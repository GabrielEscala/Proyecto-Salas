import { NextResponse } from "next/server";
import supabase from "@/lib/supabaseClient";
import { FITUR_ROOM_SEED } from "@/lib/constants";
import {
  generateTimeSlots,
  getNextAvailableSlot,
  isDateBeforeToday,
  isSlotInPast,
  getTodayString
} from "@/lib/time";
import { isValidCancelCode } from "@/lib/codes";

const timeWithSeconds = (time) => (time?.length === 5 ? `${time}:00` : time);

const normalizeTime = (time) => (time?.length ? time.slice(0, 5) : time);

const MEMORY_BOOKINGS = globalThis.__SALAS_MEMORY_BOOKINGS__ ?? (globalThis.__SALAS_MEMORY_BOOKINGS__ = []);

const slots = generateTimeSlots();

const FITUR_TIME_ZONE = "Europe/Madrid";
const DEFAULT_TIME_ZONE = "America/Caracas";
const FITUR_NAMES = new Set(FITUR_ROOM_SEED.map((r) => r.name));

const resolveSupabaseRoomId = async (roomId) => {
  const key = String(roomId || "");
  if (!supabase) return roomId;
  if (!key.startsWith("fitur:")) return roomId;

  const seed = FITUR_ROOM_SEED.find((r) => r.id === key);
  const name = seed?.name;
  if (!name) return roomId;

  try {
    const { data: existing, error: fetchError } = await supabase
      .from("rooms")
      .select("id, name")
      .eq("name", name)
      .limit(1);
    if (!fetchError && Array.isArray(existing) && existing[0]?.id) return existing[0].id;

    await supabase.from("rooms").insert({ name });

    const { data: created } = await supabase
      .from("rooms")
      .select("id, name")
      .eq("name", name)
      .limit(1);
    if (Array.isArray(created) && created[0]?.id) return created[0].id;
  } catch {
    // ignore
  }

  return roomId;
};

const resolveTimeZoneForRoomId = async (roomId) => {
  const key = String(roomId || "");
  if (key.startsWith("fitur:")) return FITUR_TIME_ZONE;

  if (!supabase || !roomId) return DEFAULT_TIME_ZONE;
  try {
    const { data, error } = await supabase
      .from("rooms")
      .select("name")
      .eq("id", roomId)
      .limit(1);
    if (error) return DEFAULT_TIME_ZONE;
    const name = Array.isArray(data) && data[0] ? data[0].name : null;
    if (name && FITUR_NAMES.has(name)) return FITUR_TIME_ZONE;
    return DEFAULT_TIME_ZONE;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
};

const formatMemoryBookingRow = (row) => ({
  id: row.id,
  room_id: row.room_id,
  date: row.date,
  time: row.time?.slice(0, 5) ?? row.time,
  first_name: row.first_name,
  last_name: row.last_name,
  company: row.company ?? row.notes ?? null,
  cancel_code: row.cancel_code,
  room_name: row.room_name
});

const createId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const editMemoryBooking = ({ cancelCode, newRoomId, newDate, newTimes }) => {
  const existing = MEMORY_BOOKINGS.filter((b) => b.cancel_code === cancelCode).sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  if (!existing.length) {
    return NextResponse.json(
      { error: "No se encontró la reserva." },
      { status: 404 }
    );
  }

  const firstBooking = existing[0];

  const timeZone = String(newRoomId || "").startsWith("fitur:") ? FITUR_TIME_ZONE : DEFAULT_TIME_ZONE;

  if (isDateBeforeToday(newDate, new Date(), timeZone)) {
    return NextResponse.json(
      { error: "No puedes editar a una fecha pasada." },
      { status: 422 }
    );
  }

  const todayString = getTodayString(new Date(), timeZone);
  const uniqueNewTimes = [...new Set(newTimes.map(normalizeTime))].filter(Boolean);

  if (newDate === todayString) {
    const pastSlot = uniqueNewTimes.find((slot) => isSlotInPast(newDate, slot, new Date(), timeZone));
    if (pastSlot) {
      return NextResponse.json(
        { error: `El horario ${pastSlot} ya pasó.` },
        { status: 422 }
      );
    }
  }

  const invalidSlot = uniqueNewTimes.find((slot) => !slots.includes(slot));
  if (invalidSlot) {
    return NextResponse.json(
      { error: `El horario ${invalidSlot} es inválido.` },
      { status: 422 }
    );
  }

  const dayBookings = MEMORY_BOOKINGS.filter((b) => b.date === newDate && b.room_id === newRoomId && b.cancel_code !== cancelCode);
  const conflicts = uniqueNewTimes
    .map((slot) => dayBookings.find((b) => normalizeTime(b.time) === slot))
    .filter(Boolean);

  if (conflicts.length) {
    const suggestion = getNextAvailableSlot(
      slots,
      dayBookings.map((b) => ({ ...b, time: normalizeTime(b.time) })),
      newDate,
      normalizeTime(conflicts[0].time)
    );

    return NextResponse.json(
      {
        error: "Los nuevos horarios ya están reservados.",
        conflicts: conflicts.map((booking) => ({
          first_name: booking.first_name,
          last_name: booking.last_name,
          time: normalizeTime(booking.time)
        })),
        suggestion
      },
      { status: 409 }
    );
  }

  // Eliminar reservas antiguas
  for (let i = MEMORY_BOOKINGS.length - 1; i >= 0; i--) {
    if (MEMORY_BOOKINGS[i].cancel_code === cancelCode) {
      MEMORY_BOOKINGS.splice(i, 1);
    }
  }

  const insertPayload = uniqueNewTimes.map((slot) => ({
    id: createId(),
    room_id: newRoomId,
    first_name: firstBooking.first_name,
    last_name: firstBooking.last_name,
    notes: firstBooking.notes ?? firstBooking.company ?? null,
    company: firstBooking.company ?? firstBooking.notes ?? null,
    date: newDate,
    time: `${slot}:00`,
    cancel_code: cancelCode,
    room_name: firstBooking.room_name
  }));

  MEMORY_BOOKINGS.push(...insertPayload);

  const formatted = insertPayload.map(formatMemoryBookingRow);
  return NextResponse.json(
    {
      success: true,
      message: "Reserva actualizada exitosamente.",
      storage: "memory",
      bookings: formatted.map((b) => ({
        id: b.id,
        room_id: b.room_id,
        date: b.date,
        time: b.time,
        first_name: b.first_name,
        last_name: b.last_name,
        room_name: b.room_name
      }))
    },
    { status: 200 }
  );
};

export async function POST(request) {
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

  if (!supabase) {
    return editMemoryBooking({ cancelCode, newRoomId, newDate, newTimes });
  }

  const resolvedRoomId = await resolveSupabaseRoomId(newRoomId);

  // Obtener reserva actual
  const { data: currentBookings, error: fetchError } = await supabase
    .from("bookings")
    .select("*, rooms(name)")
    .eq("cancel_code", cancelCode)
    .order("time", { ascending: true });

  if (fetchError || !currentBookings || currentBookings.length === 0) {
    return editMemoryBooking({ cancelCode, newRoomId, newDate, newTimes });
  }

  const firstBooking = currentBookings[0];

  const timeZone = await resolveTimeZoneForRoomId(resolvedRoomId);

  // Validar nueva fecha
  if (isDateBeforeToday(newDate, new Date(), timeZone)) {
    return NextResponse.json(
      { error: "No puedes editar a una fecha pasada." },
      { status: 422 }
    );
  }

  const todayString = getTodayString(new Date(), timeZone);
  const uniqueNewTimes = [...new Set(newTimes)];
  
  if (newDate === todayString) {
    const pastSlot = uniqueNewTimes.find((slot) => isSlotInPast(newDate, slot, new Date(), timeZone));
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
    .eq("room_id", resolvedRoomId);

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
    notes: firstBooking.notes ?? null,
    date: newDate,
    time: timeWithSeconds(slot),
    cancel_code: cancelCode
  }));

  const { data: newBookings, error: insertError } = await supabase
    .from("bookings")
    .insert(insertPayload)
    .select("id, room_id, date, time, first_name, last_name, email, cancel_code, rooms(name)");

  if (insertError) {
    const msg = String(insertError?.message || "");
    const code = String(insertError?.code || "");
    const isCancelCodeUnique =
      code === "23505" && /cancel_code/i.test(msg);
    if (isCancelCodeUnique) {
      return NextResponse.json(
        {
          error:
            "No pudimos guardar varios horarios porque tu base de datos tiene cancel_code como UNIQUE. Debes quitar esa restricción en Supabase para permitir reservas múltiples.",
          hint: "En Supabase, elimina la restricción UNIQUE de bookings.cancel_code o aplica la migración actualizada."
        },
        { status: 409 }
      );
    }
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
      storage: "supabase",
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

