import { NextResponse } from "next/server";
import supabase from "@/lib/supabaseClient";
import { isValidCancelCode } from "@/lib/codes";
import { isDateBeforeToday, isSlotInPast } from "@/lib/time";
import { format } from "date-fns";
import { DATE_FORMAT } from "@/lib/constants";

export async function POST(request) {
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase no está configurado." },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { cancelCode, firstName, lastName, date, time } = body;

  // Validar que se proporcione código o datos de verificación
  if (!cancelCode && (!firstName || !lastName || !date || !time)) {
    return NextResponse.json(
      { error: "Proporciona el código de cancelación o los datos de verificación." },
      { status: 400 }
    );
  }

  let query = supabase.from("bookings");

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

  const { data: bookings, error } = await query.select("*");

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "No pudimos encontrar la reserva." },
      { status: 500 }
    );
  }

  if (!bookings || bookings.length === 0) {
    return NextResponse.json(
      { error: "No se encontró ninguna reserva con esos datos." },
      { status: 404 }
    );
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

  const todayString = format(new Date(), DATE_FORMAT);
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
      cancelled_bookings: bookings.length
    },
    { status: 200 }
  );
}

