import { format } from "date-fns";
import { NextResponse } from "next/server";
import supabase from "@/lib/supabaseClient";
import { DATE_FORMAT } from "@/lib/constants";
import {
  generateTimeSlots,
  getNextAvailableSlot,
  isDateBeforeToday,
  isSlotInPast,
  getSlotEndTime
} from "@/lib/time";
import { generateCancelCode } from "@/lib/codes";

const slots = generateTimeSlots();

const formatBookingRow = (row) => ({
  id: row.id,
  room_id: row.room_id,
  date: row.date,
  time: row.time?.slice(0, 5) ?? row.time,
  first_name: row.first_name,
  last_name: row.last_name,
  cancel_code: row.cancel_code,
  room_name: row.rooms?.name ?? row.room_name
});

const timeWithSeconds = (time) => (time?.length === 5 ? `${time}:00` : time);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const roomId = searchParams.get("roomId");
  const cancelCode = searchParams.get("cancelCode");

  if (!supabase) {
    return NextResponse.json([]);
  }

  // Si se busca por código de cancelación
  if (cancelCode) {
    const { data, error } = await supabase
      .from("bookings")
      .select("id, room_id, date, time, first_name, last_name, cancel_code, rooms(name)")
      .eq("cancel_code", cancelCode)
      .order("time", { ascending: true });

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "No pudimos obtener la reserva." },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Código no encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json(data.map(formatBookingRow));
  }

  // Búsqueda normal por fecha
  if (!date) {
    return NextResponse.json(
      { error: "El parámetro date es obligatorio (o usa cancelCode)." },
      { status: 400 }
    );
  }

  let query = supabase
    .from("bookings")
    .select("id, room_id, date, time, first_name, last_name, cancel_code, rooms(name)")
    .eq("date", date)
    .order("time", { ascending: true });

  if (roomId) {
    query = query.eq("room_id", roomId);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "No pudimos obtener las reservas." },
      { status: 500 }
    );
  }

  return NextResponse.json(data.map(formatBookingRow));
}

export async function POST(request) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase no está configurado." },
        { status: 500 }
      );
    }

  const body = await request.json();
  const { roomId, firstName, lastName, date, time, times } = body;
  const requestedTimes = Array.isArray(times)
    ? times
    : time
      ? [time]
      : [];

  if (!roomId || !firstName || !lastName || !date || !requestedTimes.length) {
    return NextResponse.json(
      { error: "Todos los campos son obligatorios." },
      { status: 400 }
    );
  }

  const uniqueTimes = [...new Set(requestedTimes)];

  if (isDateBeforeToday(date)) {
    return NextResponse.json(
      { error: "No puedes reservar en fechas pasadas." },
      { status: 422 }
    );
  }

  const todayString = format(new Date(), DATE_FORMAT);
  if (date === todayString) {
    const pastSlot = uniqueTimes.find((slot) => isSlotInPast(date, slot));
    if (pastSlot) {
      return NextResponse.json(
        { error: `El horario ${pastSlot} ya pasó.` },
        { status: 422 }
      );
    }
  }

  const invalidSlot = uniqueTimes.find((slot) => !slots.includes(slot));
  if (invalidSlot) {
    return NextResponse.json(
      { error: `El horario ${invalidSlot} es inválido.` },
      { status: 422 }
    );
  }

  const { data: dayBookings = [], error: dayError } = await supabase
    .from("bookings")
    .select("id, room_id, date, time, first_name, last_name")
    .eq("date", date)
    .eq("room_id", roomId);

  if (dayError) {
    console.error(dayError);
    return NextResponse.json(
      { error: "No pudimos validar la disponibilidad." },
      { status: 500 }
    );
  }

  // Verificar conflictos: debe ser la misma sala Y el mismo horario
  const conflicts = uniqueTimes
    .map((slot) => {
      const conflict = dayBookings.find(
        (booking) => 
          booking.room_id === roomId && // Misma sala
          booking.time?.startsWith(slot) // Mismo horario
      );
      return conflict;
    })
    .filter(Boolean);

  if (conflicts.length) {
    const suggestion = getNextAvailableSlot(slots, dayBookings, date, conflicts[0].time?.slice(0, 5));
    return NextResponse.json(
      {
        error: "La sala ya está reservada en ese horario.",
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

  // Generar código único para todo el grupo de reservas
  const cancelCode = generateCancelCode();
  
  // Validar que todos los slots tengan el formato correcto
  const insertPayload = uniqueTimes
    .map((slot) => {
      const timeFormatted = timeWithSeconds(slot);
      if (!timeFormatted || timeFormatted.length !== 8) {
        return null;
      }
      return {
        room_id: roomId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        date,
        time: timeFormatted,
        cancel_code: cancelCode
      };
    })
    .filter(Boolean);

  if (insertPayload.length === 0) {
    return NextResponse.json(
      { error: "No hay horarios válidos para reservar." },
      { status: 400 }
    );
  }

          const { data, error } = await supabase
    .from("bookings")
    .insert(insertPayload)
    .select("id, room_id, date, time, first_name, last_name, cancel_code, rooms(name)");

  if (error) {
    let errorMessage = "No pudimos crear la reserva.";
    if (error.code === "23505") {
      errorMessage = "Uno o más horarios ya están reservados.";
    } else if (error.code === "23503") {
      errorMessage = "La sala seleccionada no existe.";
    } else if (error.message) {
      errorMessage = `Error: ${error.message}`;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? (error.details || error.message) : undefined
      },
      { status: 500 }
    );
  }

          const formatted = (Array.isArray(data) ? data : [data]).map(formatBookingRow);
          
          if (!formatted || formatted.length === 0) {
            return NextResponse.json(
              { error: "No se pudo crear la reserva." },
              { status: 500 }
            );
          }
  
  const firstBooking = formatted[0];
  const lastTime = formatted[formatted.length - 1].time;
  const timeRange = formatted.length > 1
    ? `${formatted[0].time} - ${getSlotEndTime(lastTime)}`
    : formatted[0].time;

  // Obtener URL base para el link de cancelación
  let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!baseUrl) {
    if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    } else {
      baseUrl = "http://localhost:3000";
    }
  }
  const cancelUrl = `${baseUrl}/manage/${cancelCode}`;

  return NextResponse.json(
    {
      ...formatted[0],
      cancel_code: cancelCode,
      cancel_url: cancelUrl,
      time_range: timeRange,
      all_bookings: formatted
    },
    { status: 201 }
  );
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Ocurrió un error inesperado al crear la reserva." },
      { status: 500 }
    );
  }
}

