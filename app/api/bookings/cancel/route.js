import { NextResponse } from "next/server";
import supabase from "@/lib/supabaseClient";
import { isValidCancelCode } from "@/lib/codes";
import { getTodayString, isDateBeforeToday, isSlotInPast } from "@/lib/time";
import { FITUR_ROOM_SEED, MALLORCA_ROOM_SEED } from "@/lib/constants";

const normalizeTime = (time) => (time?.length ? time.slice(0, 5) : time);

const MEMORY_BOOKINGS = globalThis.__SALAS_MEMORY_BOOKINGS__ ?? (globalThis.__SALAS_MEMORY_BOOKINGS__ = []);

const FITUR_TIME_ZONE = "Europe/Madrid";
const DEFAULT_TIME_ZONE = "America/Caracas";
const FITUR_NAMES = new Set(
  FITUR_ROOM_SEED.flatMap((r) => [r.name, r.legacyName].filter(Boolean))
);
const MALLORCA_NAMES = new Set(MALLORCA_ROOM_SEED.map((r) => r.name));

const resolveTimeZoneForRoomId = async (roomId) => {
  const key = String(roomId || "");
  if (key.startsWith("fitur:")) return FITUR_TIME_ZONE;
  if (key.startsWith("mallorca:")) return FITUR_TIME_ZONE;

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
    if (name && MALLORCA_NAMES.has(name)) return FITUR_TIME_ZONE;
    return DEFAULT_TIME_ZONE;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
};

const cancelMemoryBooking = ({ cancelCode, firstName, lastName, date, time, times }) => {
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

  bookings.sort((a, b) => String(a.time || "").localeCompare(String(b.time || "")));

  const firstBooking = bookings[0];
  const timeZone = (String(firstBooking.room_id || "").startsWith("fitur:") || String(firstBooking.room_id || "").startsWith("mallorca:"))
    ? FITUR_TIME_ZONE
    : DEFAULT_TIME_ZONE;
  const now = new Date();

  const partialSet = Array.isArray(times) && times.length
    ? new Set(times.map((t) => (t?.length === 5 ? t : normalizeTime(t))))
    : null;

  const isFuture = (b) => {
    const d = b.date;
    const t = normalizeTime(b.time);
    if (isDateBeforeToday(d, now, timeZone)) return false;
    const todayString = getTodayString(now, timeZone);
    if (d === todayString && isSlotInPast(d, t, now, timeZone)) return false;
    return true;
  };

  const candidates = partialSet
    ? bookings.filter((b) => partialSet.has(normalizeTime(b.time)))
    : bookings;

  const cancellable = candidates.filter(isFuture);

  if (!cancellable.length) {
    return NextResponse.json(
      { error: "No hay bloques futuros para cancelar." },
      { status: 422 }
    );
  }

  const idsToDelete = new Set(cancellable.map((b) => b.id));
  const before = MEMORY_BOOKINGS.length;
  for (let i = MEMORY_BOOKINGS.length - 1; i >= 0; i--) {
    if (idsToDelete.has(MEMORY_BOOKINGS[i].id)) {
      MEMORY_BOOKINGS.splice(i, 1);
    }
  }
  const deleted = before - MEMORY_BOOKINGS.length;

  return NextResponse.json(
    {
      success: true,
      message: partialSet ? "Bloques cancelados exitosamente." : "Reserva cancelada exitosamente.",
      cancelled_bookings: deleted,
      partial: !!partialSet,
      storage: "memory"
    },
    { status: 200 }
  );
};

export async function POST(request) {
  const body = await request.json();
  const { cancelCode, firstName, lastName, date, time, times } = body;

  // Validar que se proporcione código o datos de verificación
  if (!cancelCode && (!firstName || !lastName || !date || !time)) {
    return NextResponse.json(
      { error: "Proporciona el código de cancelación o los datos de verificación." },
      { status: 400 }
    );
  }

  if (!supabase) {
    return cancelMemoryBooking({ cancelCode, firstName, lastName, date, time, times });
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
    return cancelMemoryBooking({ cancelCode, firstName, lastName, date, time, times });
  }

  bookings.sort((a, b) => String(a.time || "").localeCompare(String(b.time || "")));

  const firstBooking = bookings[0];
  const timeZone = await resolveTimeZoneForRoomId(firstBooking.room_id);
  const now = new Date();

  const partialSet = Array.isArray(times) && times.length
    ? new Set(times.map((t) => (t?.length === 5 ? t : normalizeTime(t))))
    : null;

  const isFuture = (b) => {
    const d = b.date;
    const t = normalizeTime(b.time);
    if (isDateBeforeToday(d, now, timeZone)) return false;
    const todayString = getTodayString(now, timeZone);
    if (d === todayString && isSlotInPast(d, t, now, timeZone)) return false;
    return true;
  };

  const candidates = partialSet
    ? bookings.filter((b) => partialSet.has(normalizeTime(b.time)))
    : bookings;

  const cancellable = candidates.filter(isFuture);

  if (!cancellable.length) {
    return NextResponse.json(
      { error: "No hay bloques futuros para cancelar." },
      { status: 422 }
    );
  }

  const idsToDelete = cancellable.map((b) => b.id);
  const { error: deleteError } = await supabase
    .from("bookings")
    .delete()
    .in("id", idsToDelete);

  if (deleteError) {
    console.error(deleteError);
    return NextResponse.json(
      { error: "No pudimos cancelar la reserva." },
      { status: 500 }
    );
  }

  await supabase
    .from("booking_guests")
    .delete()
    .in("booking_id", idsToDelete);

  return NextResponse.json(
    {
      success: true,
      message: partialSet ? "Bloques cancelados exitosamente." : "Reserva cancelada exitosamente.",
      cancelled_bookings: cancellable.length,
      partial: !!partialSet,
      storage: "supabase"
    },
    { status: 200 }
  );
}

