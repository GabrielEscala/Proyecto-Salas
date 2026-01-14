import { NextResponse } from "next/server";
import supabase from "@/lib/supabaseClient";
import { parseBookingNotes } from "@/lib/booking-notes";
import { ENABLE_FITUR, FITUR_ROOM_SEED, MALLORCA_ROOM_SEED } from "@/lib/constants";

const MEMORY_BOOKINGS = globalThis.__SALAS_MEMORY_BOOKINGS__ ?? (globalThis.__SALAS_MEMORY_BOOKINGS__ = []);

const normalizeTime = (time) => (time?.length ? time.slice(0, 5) : time);

const FITUR_NAMES = new Set(
  FITUR_ROOM_SEED.flatMap((r) => [r.name, r.legacyName].filter(Boolean))
);
const MALLORCA_NAMES = new Set(MALLORCA_ROOM_SEED.map((r) => r.name));

const mapFiturSwapName = (name) => {
  if (name === "Cabina Palma") return "Suite 1";
  if (name === "Suite 1") return "Cabina Palma";
  if (name === "Cabina Caracas") return "Suite 2";
  if (name === "Suite 2") return "Cabina Caracas";
  return name;
};

const isInGroup = (roomName, group) => {
  const name = String(roomName || "");
  if (group === "fitur") return FITUR_NAMES.has(name);
  if (group === "mallorca") return MALLORCA_NAMES.has(name);
  // default / salas
  return !FITUR_NAMES.has(name) && !MALLORCA_NAMES.has(name);
};

const formatBookingRow = (row) => ({
  ...(parseBookingNotes(row.notes ?? row.company) || {}),
  id: row.id,
  room_id: row.room_id,
  date: row.date,
  time: normalizeTime(row.time),
  first_name: row.first_name,
  last_name: row.last_name,
  email: row.email ?? null,
  company: (parseBookingNotes(row.notes ?? row.company)?.company ?? row.company ?? row.notes) ?? null,
  clients: (parseBookingNotes(row.notes ?? row.company)?.clients ?? row.clients) ?? null,
  cancel_code: row.cancel_code,
  room_name: ENABLE_FITUR
    ? mapFiturSwapName(row.rooms?.name ?? row.room_name)
    : (row.rooms?.name ?? row.room_name),
  storage: row.storage ?? row._storage ?? (row.rooms ? "supabase" : "memory")
});

const getMemoryBookingsInRange = ({ from, to, roomId, group }) => {
  const filtered = MEMORY_BOOKINGS.filter((b) => {
    if (from && String(b.date || "") < from) return false;
    if (to && String(b.date || "") > to) return false;
    if (roomId && b.room_id !== roomId) return false;
    if (group && !isInGroup(b.room_name, group)) return false;
    return true;
  });

  return filtered
    .map((row) => formatBookingRow({ ...row, _storage: "memory" }))
    .sort((a, b) => {
      const dateCmp = String(b.date || "").localeCompare(String(a.date || ""));
      if (dateCmp !== 0) return dateCmp;
      return String(a.time || "").localeCompare(String(b.time || ""));
    });
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const roomId = searchParams.get("roomId");
  const group = (searchParams.get("group") || "salas").toLowerCase();

  if (!from || !to) {
    return NextResponse.json(
      { error: "Los parámetros from y to son obligatorios (YYYY-MM-DD)." },
      { status: 400 }
    );
  }

  if (!supabase) {
    return NextResponse.json(getMemoryBookingsInRange({ from, to, roomId, group }), {
      headers: {
        "x-salas-storage": "memory",
        "x-salas-storage-reason": "supabase_not_configured"
      }
    });
  }

  try {
    let query = supabase
      .from("bookings")
      .select("id, room_id, date, time, first_name, last_name, email, notes, cancel_code, rooms(name)")
      .gte("date", from)
      .lte("date", to)
      .order("date", { ascending: false })
      .order("time", { ascending: true });

    if (roomId) {
      query = query.eq("room_id", roomId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(getMemoryBookingsInRange({ from, to, roomId, group }), {
        headers: {
          "x-salas-storage": "memory",
          "x-salas-storage-reason": "supabase_error",
          "x-salas-supabase-error": (error?.message || "").slice(0, 200)
        }
      });
    }

    const supabaseRows = (data || []).filter((row) => {
      const name = row?.rooms?.name ?? row?.room_name;
      return isInGroup(name, group);
    });

    const merged = [
      ...(supabaseRows.map(formatBookingRow)),
      ...getMemoryBookingsInRange({ from, to, roomId, group })
    ];

    const byKey = new Map();
    for (const b of merged) {
      const key = `${b.room_id}|${b.date}|${b.time}|${b.cancel_code || ""}`;
      if (!byKey.has(key)) byKey.set(key, b);
    }

    const result = Array.from(byKey.values()).sort((a, b) => {
      const dateCmp = String(b.date || "").localeCompare(String(a.date || ""));
      if (dateCmp !== 0) return dateCmp;
      return String(a.time || "").localeCompare(String(b.time || ""));
    });

    return NextResponse.json(result, {
      headers: {
        "x-salas-storage": "supabase"
      }
    });
  } catch (error) {
    return NextResponse.json(getMemoryBookingsInRange({ from, to, roomId, group }), {
      headers: {
        "x-salas-storage": "memory",
        "x-salas-storage-reason": "supabase_error",
        "x-salas-supabase-error": (error?.message || "").slice(0, 200)
      }
    });
  }
}
