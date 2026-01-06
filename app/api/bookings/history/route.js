import { NextResponse } from "next/server";
import supabase from "@/lib/supabaseClient";

const MEMORY_BOOKINGS = globalThis.__SALAS_MEMORY_BOOKINGS__ ?? (globalThis.__SALAS_MEMORY_BOOKINGS__ = []);

const normalizeTime = (time) => (time?.length ? time.slice(0, 5) : time);

const formatBookingRow = (row) => ({
  id: row.id,
  room_id: row.room_id,
  date: row.date,
  time: normalizeTime(row.time),
  first_name: row.first_name,
  last_name: row.last_name,
  email: row.email ?? null,
  company: row.company ?? row.notes ?? null,
  cancel_code: row.cancel_code,
  room_name: row.rooms?.name ?? row.room_name,
  storage: row.storage ?? row._storage ?? (row.rooms ? "supabase" : "memory")
});

const getMemoryBookingsInRange = ({ from, to, roomId }) => {
  const filtered = MEMORY_BOOKINGS.filter((b) => {
    if (from && String(b.date || "") < from) return false;
    if (to && String(b.date || "") > to) return false;
    if (roomId && b.room_id !== roomId) return false;
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

  if (!from || !to) {
    return NextResponse.json(
      { error: "Los parámetros from y to son obligatorios (YYYY-MM-DD)." },
      { status: 400 }
    );
  }

  if (!supabase) {
    return NextResponse.json(getMemoryBookingsInRange({ from, to, roomId }), {
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
      return NextResponse.json(getMemoryBookingsInRange({ from, to, roomId }), {
        headers: {
          "x-salas-storage": "memory",
          "x-salas-storage-reason": "supabase_error",
          "x-salas-supabase-error": (error?.message || "").slice(0, 200)
        }
      });
    }

    const merged = [
      ...((data || []).map(formatBookingRow)),
      ...getMemoryBookingsInRange({ from, to, roomId })
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
    return NextResponse.json(getMemoryBookingsInRange({ from, to, roomId }), {
      headers: {
        "x-salas-storage": "memory",
        "x-salas-storage-reason": "supabase_error",
        "x-salas-supabase-error": (error?.message || "").slice(0, 200)
      }
    });
  }
}
