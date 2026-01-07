import { NextResponse } from "next/server";
import supabase from "@/lib/supabaseClient";
import { ENABLE_FITUR, FITUR_ROOM_SEED, ROOM_SEED } from "@/lib/constants";

const FITUR_NAMES = new Set(FITUR_ROOM_SEED.map((r) => r.name));

const getGroupParam = () => {
  // fallback-safe parsing for Next.js route handler
  try {
    const url = new URL(globalThis?.location?.href || "http://localhost");
    return (url.searchParams.get("group") || "").toLowerCase();
  } catch {
    return "";
  }
};

const getRequestedGroup = (request) => {
  try {
    const { searchParams } = new URL(request?.url || "http://localhost");
    return (searchParams.get("group") || "").toLowerCase();
  } catch {
    return getGroupParam();
  }
};

const filterRoomsByGroup = (rooms, group) => {
  const list = Array.isArray(rooms) ? rooms : [];
  if (!ENABLE_FITUR) return list;
  if (group === "fitur") return list.filter((r) => FITUR_NAMES.has(r?.name));
  if (group === "all") return list;
  // default / salas
  return list.filter((r) => !FITUR_NAMES.has(r?.name));
};

export async function GET(request) {
  const group = getRequestedGroup(request);

  if (!supabase) {
    if (ENABLE_FITUR && group === "fitur") return NextResponse.json(FITUR_ROOM_SEED, { status: 200 });
    if (ENABLE_FITUR && group === "all") return NextResponse.json([...ROOM_SEED, ...FITUR_ROOM_SEED], { status: 200 });
    return NextResponse.json(ROOM_SEED, { status: 200 });
  }

  try {
    if (ENABLE_FITUR) {
      const { data: existingFitur, error: fetchFiturError } = await supabase
        .from("rooms")
        .select("id, name")
        .in("name", Array.from(FITUR_NAMES));

      if (!fetchFiturError) {
        const existingNames = new Set((existingFitur || []).map((r) => r.name));
        const missing = FITUR_ROOM_SEED.filter((r) => !existingNames.has(r.name)).map((r) => ({ name: r.name }));
        if (missing.length) {
          await supabase.from("rooms").insert(missing);
        }
      }
    }

    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .order("name");

    if (error) {
      if (ENABLE_FITUR && group === "fitur") return NextResponse.json(FITUR_ROOM_SEED, { status: 200 });
      if (ENABLE_FITUR && group === "all") return NextResponse.json([...ROOM_SEED, ...FITUR_ROOM_SEED], { status: 200 });
      return NextResponse.json(ROOM_SEED, { status: 200 });
    }

    const supabaseRooms = (data || []).length ? data : ROOM_SEED;
    const filtered = filterRoomsByGroup(supabaseRooms, group);
    if (ENABLE_FITUR && group === "fitur" && filtered.length === 0) {
      return NextResponse.json(FITUR_ROOM_SEED, { status: 200 });
    }
    if (ENABLE_FITUR && group === "all") {
      return NextResponse.json(filtered, { status: 200 });
    }

    return NextResponse.json(filtered, { status: 200 });
  } catch (error) {
    if (ENABLE_FITUR && group === "fitur") return NextResponse.json(FITUR_ROOM_SEED, { status: 200 });
    if (ENABLE_FITUR && group === "all") return NextResponse.json([...ROOM_SEED, ...FITUR_ROOM_SEED], { status: 200 });
    return NextResponse.json(ROOM_SEED, { status: 200 });
  }
}

