"use client";

import { Chip, Typography } from "@mui/material";
import { useMemo } from "react";

const equipmentIcons = {
  "Proyector": "📽️",
  "Pizarra": "🖊️",
  "WiFi": "📶",
  "Aire acondicionado": "❄️",
  "Pantalla": "🖥️",
  "Micrófono": "🎤",
  "Cámara": "📹",
  "Impresora": "🖨️"
};

export default function RoomInfo({ room }) {
  const equipment = useMemo(() => {
    if (!room) return [];
    if (Array.isArray(room.equipment)) return room.equipment;
    if (typeof room.equipment === "string") {
      try {
        return JSON.parse(room.equipment);
      } catch {
        return [];
      }
    }
    return [];
  }, [room]);

  if (!room) return null;

  return (
    <div className="space-y-3">
      {room.description && (
        <Typography 
          variant="body2" 
          className="text-slate-700 dark:text-slate-300"
          sx={{ lineHeight: 1.6 }}
        >
          {room.description}
        </Typography>
      )}
      
      {room.capacity && (
        <div className="flex items-center gap-2">
          <Typography 
            variant="body2" 
            className="text-slate-600 dark:text-slate-400 font-medium"
            sx={{ lineHeight: 1.5 }}
          >
            Capacidad:
          </Typography>
          <Chip
            size="small"
            label={`${room.capacity} personas`}
            variant="outlined"
            sx={{
              borderWidth: 1.5,
              fontWeight: 600,
              fontSize: "0.75rem"
            }}
          />
        </div>
      )}

      {equipment.length > 0 && (
        <div>
          <Typography 
            variant="body2" 
            className="mb-2 text-slate-600 dark:text-slate-400 font-medium"
            sx={{ lineHeight: 1.5 }}
          >
            Equipamiento:
          </Typography>
          <div className="flex flex-wrap gap-2">
            {equipment.map((item, index) => (
              <Chip
                key={index}
                size="small"
                label={`${equipmentIcons[item] || "✓"} ${item}`}
                variant="outlined"
                sx={{
                  borderWidth: 1.5,
                  fontSize: "0.7rem",
                  fontWeight: 500,
                  "&:hover": {
                    backgroundColor: "rgba(14, 124, 255, 0.05)"
                  }
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

