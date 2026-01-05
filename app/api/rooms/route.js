import { NextResponse } from "next/server";
import supabase from "@/lib/supabaseClient";
import { ROOM_SEED } from "@/lib/constants";

export async function GET() {
  if (!supabase) {
    return NextResponse.json(ROOM_SEED, { status: 200 });
  }

  try {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .order("name");

    if (error) {
      return NextResponse.json(ROOM_SEED, { status: 200 });
    }

    return NextResponse.json((data || []).length ? data : ROOM_SEED);
  } catch (error) {
    return NextResponse.json(ROOM_SEED, { status: 200 });
  }
}

