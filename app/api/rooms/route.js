import { NextResponse } from "next/server";
import supabase from "@/lib/supabaseClient";
import { ROOM_SEED } from "@/lib/constants";

export async function GET() {
  if (!supabase) {
    return NextResponse.json(ROOM_SEED, { status: 200 });
  }

  const { data, error } = await supabase.from("rooms").select("*").order("name");

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "No pudimos obtener las salas en este momento." },
      { status: 500 }
    );
  }

  return NextResponse.json(data.length ? data : ROOM_SEED);
}

