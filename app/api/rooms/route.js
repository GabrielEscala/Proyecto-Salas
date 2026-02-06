import { NextResponse } from "next/server";
import supabase from "@/lib/supabaseClient";
import { ENABLE_FITUR, FITUR_ROOM_SEED, MALLORCA_ROOM_SEED, ROOM_SEED } from "@/lib/constants";

const FITUR_NAMES = new Set(
  FITUR_ROOM_SEED.flatMap((r) => [r.name, r.legacyName].filter(Boolean))
);
const MALLORCA_NAMES = new Set(MALLORCA_ROOM_SEED.map((r) => r.name));

const ROOMS_INIT_STATE = globalThis.__SALAS_ROOMS_INIT_STATE__ ?? (globalThis.__SALAS_ROOMS_INIT_STATE__ = {
  fitur: false,
  mallorca: false
});

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
  const base = ENABLE_FITUR
    ? list
    : list.filter((r) => !FITUR_NAMES.has(r?.name));

  if (group === "fitur") {
    return ENABLE_FITUR ? base.filter((r) => FITUR_NAMES.has(r?.name)) : [];
  }
  if (group === "mallorca") return base.filter((r) => MALLORCA_NAMES.has(r?.name));
  if (group === "all") return base;
  // default / salas
  return base.filter((r) => !MALLORCA_NAMES.has(r?.name));
};

export async function GET(request) {
  const group = getRequestedGroup(request);

  if (!supabase) {
    if (ENABLE_FITUR && group === "fitur") return NextResponse.json(FITUR_ROOM_SEED, { status: 200 });
    if (group === "mallorca") return NextResponse.json(MALLORCA_ROOM_SEED, { status: 200 });
    if (group === "all") {
      return NextResponse.json(
        [...ROOM_SEED, ...MALLORCA_ROOM_SEED, ...(ENABLE_FITUR ? FITUR_ROOM_SEED : [])],
        { status: 200 }
      );
    }
    return NextResponse.json(ROOM_SEED, { status: 200 });
  }

  try {
    if (ENABLE_FITUR && !ROOMS_INIT_STATE.fitur) {
      // Best-effort rename: if legacy rooms exist, rename them to the new requested names.
      // This keeps historical bookings tied to the same room_id while updating UI labels.
      for (const seed of FITUR_ROOM_SEED) {
        if (!seed?.legacyName || !seed?.name) continue;
        const legacyName = seed.legacyName;
        const newName = seed.name;

        const { data: newExists, error: newExistsError } = await supabase
          .from("rooms")
          .select("id")
          .eq("name", newName)
          .limit(1);

        // If the new name already exists, do NOT rename the legacy one to avoid duplicates.
        if (!newExistsError && Array.isArray(newExists) && newExists.length) continue;

        const { data: legacyExists, error: legacyExistsError } = await supabase
          .from("rooms")
          .select("id")
          .eq("name", legacyName)
          .limit(1);

        if (!legacyExistsError && Array.isArray(legacyExists) && legacyExists[0]?.id) {
          await supabase
            .from("rooms")
            .update({ name: newName })
            .eq("id", legacyExists[0].id);
        }
      }

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

      ROOMS_INIT_STATE.fitur = true;
    }

    // Mallorca is always enabled: ensure Sala Palma exists.
    if (!ROOMS_INIT_STATE.mallorca) {
      const { data: existingMallorca, error: fetchMallorcaError } = await supabase
        .from("rooms")
        .select("id, name")
        .in("name", Array.from(MALLORCA_NAMES));

      if (!fetchMallorcaError) {
        const existingNames = new Set((existingMallorca || []).map((r) => r.name));
        const missing = MALLORCA_ROOM_SEED.filter((r) => !existingNames.has(r.name)).map((r) => ({ name: r.name }));
        if (missing.length) {
          await supabase.from("rooms").insert(missing);
        }
      }

      ROOMS_INIT_STATE.mallorca = true;
    }

    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .order("name");

    if (error) {
      if (ENABLE_FITUR && group === "fitur") return NextResponse.json(FITUR_ROOM_SEED, { status: 200 });
      if (group === "mallorca") return NextResponse.json(MALLORCA_ROOM_SEED, { status: 200 });
      if (group === "all") {
        return NextResponse.json(
          [...ROOM_SEED, ...MALLORCA_ROOM_SEED, ...(ENABLE_FITUR ? FITUR_ROOM_SEED : [])],
          { status: 200 }
        );
      }
      return NextResponse.json(ROOM_SEED, { status: 200 });
    }

    const supabaseRooms = (data || []).length ? data : ROOM_SEED;
    const filtered = filterRoomsByGroup(supabaseRooms, group);
    if (ENABLE_FITUR && group === "fitur" && filtered.length === 0) {
      return NextResponse.json(FITUR_ROOM_SEED, { status: 200 });
    }
    if (group === "mallorca" && filtered.length === 0) {
      return NextResponse.json(MALLORCA_ROOM_SEED, { status: 200 });
    }
    if (ENABLE_FITUR && group === "all") {
      return NextResponse.json(filtered, { status: 200 });
    }

    if (group === "all") {
      return NextResponse.json(filtered, { status: 200 });
    }

    return NextResponse.json(filtered, { status: 200 });
  } catch (error) {
    if (ENABLE_FITUR && group === "fitur") return NextResponse.json(FITUR_ROOM_SEED, { status: 200 });
    if (group === "mallorca") return NextResponse.json(MALLORCA_ROOM_SEED, { status: 200 });
    if (group === "all") {
      return NextResponse.json(
        [...ROOM_SEED, ...MALLORCA_ROOM_SEED, ...(ENABLE_FITUR ? FITUR_ROOM_SEED : [])],
        { status: 200 }
      );
    }
    return NextResponse.json(ROOM_SEED, { status: 200 });
  }
}

