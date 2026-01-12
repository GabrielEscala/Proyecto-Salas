export const ROOM_SEED = [
  { name: "Sala Caracas" },
  { name: "Sala Beirut" },
  { name: "Sala Aruba" },
  { name: "Cabina Mallorca" },
  { name: "Cabina Miami" },
  { name: "Cabina Bogota" },
  { name: "Cabina London" },
  { name: "Cabina CDMX" }
];

export const ENABLE_FITUR = ["true", "1", "yes", "on"].includes(
  String(process.env.NEXT_PUBLIC_ENABLE_FITUR || "").toLowerCase()
);

export const FITUR_ROOM_SEED = [
  { id: "fitur:mesa-1", name: "Cabina Palma", legacyName: "Mesa 1" },
  { id: "fitur:mesa-2", name: "Cabina Caracas", legacyName: "Mesa 2" },
  { id: "fitur:mesa-3", name: "Suite 1", legacyName: "Mesa 3" },
  { id: "fitur:cabina-1", name: "Suite 2", legacyName: "Cabina 1" },
  { id: "fitur:cabina-2", name: "Suite 3", legacyName: "Cabina 2" }
];

export const MALLORCA_ROOM_SEED = [
  { id: "mallorca:sala-palma", name: "Sala Palma" }
];

export const TIME_CONFIG = {
  startTime: "07:00",
  endTime: "20:00",
  intervalMinutes: 30
};

export const DATE_FORMAT = "yyyy-MM-dd";

