import { NextResponse } from "next/server";
import supabase from "@/lib/supabaseClient";

const ensureSeconds = (time) => (time?.length === 5 ? `${time}:00` : time);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const currentTime = searchParams.get("currentTime");
  const roomId = searchParams.get("roomId");

  if (!date || !currentTime) {
    return NextResponse.json(
      { error: "Los parámetros date y currentTime son obligatorios." },
      { status: 400 }
    );
  }

  if (!supabase) {
    return NextResponse.json([]);
  }

  let query = supabase
    .from("bookings")
    .select("id, room_id, date, time, first_name, last_name, rooms(name)")
    .eq("date", date)
    .gte("time", ensureSeconds(currentTime))
    .order("time", { ascending: true });

  if (roomId) {
    query = query.eq("room_id", roomId);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "No pudimos obtener las próximas reservas." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    data.map((row) => ({
      id: row.id,
      room_id: row.room_id,
      date: row.date,
      time: row.time?.slice(0, 5),
      first_name: row.first_name,
      last_name: row.last_name,
      room_name: row.rooms?.name ?? row.room_name
    }))
  );
}

