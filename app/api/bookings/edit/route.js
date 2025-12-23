import { format } from "date-fns";
import { NextResponse } from "next/server";
import supabase from "@/lib/supabaseClient";
import { DATE_FORMAT } from "@/lib/constants";
import {
  generateTimeSlots,
  getNextAvailableSlot,
  isDateBeforeToday,
  isSlotInPast
} from "@/lib/time";
import { isValidCancelCode } from "@/lib/codes";

const timeWithSeconds = (time) => (time?.length === 5 ? `${time}:00` : time);

const slots = generateTimeSlots();

export async function POST(request) {
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase no está configurado." },
      { status: 500 }
    );
  }

  const body = await request.json();
  const {
    cancelCode,
    newRoomId,
    newDate,
    newTimes,
    firstName,
    lastName,
    email
  } = body;

  if (!cancelCode || !isValidCancelCode(cancelCode)) {
    return NextResponse.json(
      { error: "Código de cancelación inválido." },
      { status: 400 }
    );
  }

  if (!newRoomId || !newDate || !newTimes || !Array.isArray(newTimes) || newTimes.length === 0) {
    return NextResponse.json(
      { error: "Debes proporcionar nueva sala, fecha y horarios." },
      { status: 400 }
    );
  }

  // Obtener reserva actual
  const { data: currentBookings, error: fetchError } = await supabase
    .from("bookings")
    .select("*, rooms(name)")
    .eq("cancel_code", cancelCode)
    .order("time", { ascending: true });

  if (fetchError || !currentBookings || currentBookings.length === 0) {
    return NextResponse.json(
      { error: "No se encontró la reserva." },
      { status: 404 }
    );
  }

  const firstBooking = currentBookings[0];

  // Validar nueva fecha
  if (isDateBeforeToday(newDate)) {
    return NextResponse.json(
      { error: "No puedes editar a una fecha pasada." },
      { status: 422 }
    );
  }

  const todayString = format(new Date(), DATE_FORMAT);
  const uniqueNewTimes = [...new Set(newTimes)];
  
  if (newDate === todayString) {
    const pastSlot = uniqueNewTimes.find((slot) => isSlotInPast(newDate, slot));
    if (pastSlot) {
      return NextResponse.json(
        { error: `El horario ${pastSlot} ya pasó.` },
        { status: 422 }
      );
    }
  }

  // Validar que los nuevos slots sean válidos
  const invalidSlot = uniqueNewTimes.find((slot) => !slots.includes(slot));
  if (invalidSlot) {
    return NextResponse.json(
      { error: `El horario ${invalidSlot} es inválido.` },
      { status: 422 }
    );
  }

  // Verificar disponibilidad de nuevos slots
  // IMPORTANTE: Incluir cancel_code para poder excluir la reserva actual
  const { data: conflictingBookings = [], error: conflictError } = await supabase
    .from("bookings")
    .select("id, room_id, date, time, first_name, last_name, cancel_code")
    .eq("date", newDate)
    .eq("room_id", newRoomId);

  if (conflictError) {
    return NextResponse.json(
      { error: "No pudimos validar la disponibilidad." },
      { status: 500 }
    );
  }

  // Filtrar conflictos (excluyendo la reserva actual con el mismo cancel_code)
  const conflicts = uniqueNewTimes
    .map((slot) => {
      const conflict = conflictingBookings.find(
        (booking) =>
          booking.time?.startsWith(slot) &&
          booking.cancel_code !== cancelCode // Excluir reservas con el mismo código
      );
      return conflict;
    })
    .filter(Boolean);

  if (conflicts.length > 0) {
    const suggestion = getNextAvailableSlot(
      slots,
      conflictingBookings.filter(b => b.cancel_code !== cancelCode),
      newDate,
      conflicts[0].time?.slice(0, 5)
    );
    return NextResponse.json(
      {
        error: "Los nuevos horarios ya están reservados.",
        conflicts: conflicts.map((booking) => ({
          first_name: booking.first_name,
          last_name: booking.last_name,
          time: booking.time?.slice(0, 5)
        })),
        suggestion
      },
      { status: 409 }
    );
  }

  // Eliminar reservas antiguas
  const { error: deleteError } = await supabase
    .from("bookings")
    .delete()
    .eq("cancel_code", cancelCode);

  if (deleteError) {
    console.error(deleteError);
    return NextResponse.json(
      { error: "No pudimos actualizar la reserva." },
      { status: 500 }
    );
  }

  // Crear nuevas reservas con el mismo código
  const insertPayload = uniqueNewTimes.map((slot) => ({
    room_id: newRoomId,
    first_name: firstName || firstBooking.first_name,
    last_name: lastName || firstBooking.last_name,
    email: email || firstBooking.email,
    date: newDate,
    time: timeWithSeconds(slot),
    cancel_code: cancelCode
  }));

  const { data: newBookings, error: insertError } = await supabase
    .from("bookings")
    .insert(insertPayload)
    .select("id, room_id, date, time, first_name, last_name, email, cancel_code, rooms(name)");

  if (insertError) {
    console.error(insertError);
    return NextResponse.json(
      { error: "No pudimos crear las nuevas reservas." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      message: "Reserva actualizada exitosamente.",
      bookings: newBookings.map((b) => ({
        id: b.id,
        room_id: b.room_id,
        date: b.date,
        time: b.time?.slice(0, 5),
        first_name: b.first_name,
        last_name: b.last_name,
        room_name: b.rooms?.name
      }))
    },
    { status: 200 }
  );
}

