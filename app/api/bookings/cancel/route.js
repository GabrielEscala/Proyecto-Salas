import { NextResponse } from "next/server";
import supabase from "@/lib/supabaseClient";
import { isValidCancelCode } from "@/lib/codes";
import { getTodayString, isDateBeforeToday, isSlotInPast } from "@/lib/time";

const normalizeTime = (time) => (time?.length ? time.slice(0, 5) : time);

const MEMORY_BOOKINGS = globalThis.__SALAS_MEMORY_BOOKINGS__ ?? (globalThis.__SALAS_MEMORY_BOOKINGS__ = []);

const cancelMemoryBooking = ({ cancelCode, firstName, lastName, date, time }) => {
  let bookings = [];
  if (cancelCode) {
    bookings = MEMORY_BOOKINGS.filter((b) => b.cancel_code === cancelCode);
  } else {
    const timeKey = time?.includes(":") && time.length === 5 ? `${time}:00` : time;
    bookings = MEMORY_BOOKINGS.filter(
      (b) =>
        b.first_name === firstName?.trim?.() &&
        b.last_name === lastName?.trim?.() &&
        b.date === date &&
        b.time === timeKey
    );
  }

  if (!bookings.length) {
    return NextResponse.json(
      { error: "No se encontró ninguna reserva con esos datos." },
      { status: 404 }
    );
  }

  const firstBooking = bookings[0];
  const bookingDate = firstBooking.date;
  const bookingTime = normalizeTime(firstBooking.time);

  if (isDateBeforeToday(bookingDate)) {
    return NextResponse.json(
      { error: "No puedes cancelar reservas pasadas." },
      { status: 422 }
    );
  }

  const todayString = getTodayString();
  if (bookingDate === todayString && isSlotInPast(bookingDate, bookingTime)) {
    return NextResponse.json(
      { error: "No puedes cancelar una reserva que ya pasó." },
      { status: 422 }
    );
  }

  const cancelCodeToDelete = firstBooking.cancel_code;
  const before = MEMORY_BOOKINGS.length;
  for (let i = MEMORY_BOOKINGS.length - 1; i >= 0; i--) {
    if (MEMORY_BOOKINGS[i].cancel_code === cancelCodeToDelete) {
      MEMORY_BOOKINGS.splice(i, 1);
    }
  }
  const deleted = before - MEMORY_BOOKINGS.length;

  return NextResponse.json(
    {
      success: true,
      message: "Reserva cancelada exitosamente.",
      cancelled_bookings: deleted,
      storage: "memory"
    },
    { status: 200 }
  );
};

export async function POST(request) {
  const body = await request.json();
  const { cancelCode, firstName, lastName, date, time } = body;

  // Validar que se proporcione código o datos de verificación
  if (!cancelCode && (!firstName || !lastName || !date || !time)) {
    return NextResponse.json(
      { error: "Proporciona el código de cancelación o los datos de verificación." },
      { status: 400 }
    );
  }

  if (!supabase) {
    return cancelMemoryBooking({ cancelCode, firstName, lastName, date, time });
  }

  let query = supabase.from("bookings").select("*");

  if (cancelCode) {
    if (!isValidCancelCode(cancelCode)) {
      return NextResponse.json(
        { error: "Código de cancelación inválido." },
        { status: 400 }
      );
    }
    query = query.eq("cancel_code", cancelCode);
  } else {
    // Verificación por datos
    query = query
      .eq("first_name", firstName.trim())
      .eq("last_name", lastName.trim())
      .eq("date", date)
      .eq("time", time.includes(":") && time.length === 5 ? `${time}:00` : time);
  }

  const { data: bookings, error } = await query;

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "No pudimos encontrar la reserva." },
      { status: 500 }
    );
  }

  if (!bookings || bookings.length === 0) {
    return cancelMemoryBooking({ cancelCode, firstName, lastName, date, time });
  }

  // Verificar que la reserva no haya pasado
  const firstBooking = bookings[0];
  const bookingDate = firstBooking.date;
  const bookingTime = firstBooking.time?.slice(0, 5);

  if (isDateBeforeToday(bookingDate)) {
    return NextResponse.json(
      { error: "No puedes cancelar reservas pasadas." },
      { status: 422 }
    );
  }

  const todayString = getTodayString();
  if (bookingDate === todayString && isSlotInPast(bookingDate, bookingTime)) {
    return NextResponse.json(
      { error: "No puedes cancelar una reserva que ya pasó." },
      { status: 422 }
    );
  }

  // Eliminar todas las reservas del grupo (mismo cancel_code)
  const cancelCodeToDelete = firstBooking.cancel_code;
  const { error: deleteError } = await supabase
    .from("bookings")
    .delete()
    .eq("cancel_code", cancelCodeToDelete);

  if (deleteError) {
    console.error(deleteError);
    return NextResponse.json(
      { error: "No pudimos cancelar la reserva." },
      { status: 500 }
    );
  }

  // También eliminar invitados asociados
  const bookingIds = bookings.map(b => b.id);
  await supabase
    .from("booking_guests")
    .delete()
    .in("booking_id", bookingIds);

  return NextResponse.json(
    {
      success: true,
      message: "Reserva cancelada exitosamente.",
      cancelled_bookings: bookings.length,
      storage: "supabase"
    },
    { status: 200 }
  );
}

