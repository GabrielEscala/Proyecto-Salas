"use client";

import { Chip, Typography } from "@mui/material";
import { formatTime12h } from "@/lib/time";
import { useTheme } from "@/lib/theme-context";

const statusLabels = {
  available: "Disponible",
  reserved: "Reservada",
  invalid: "No disponible"
};

export default function AvailabilitySummary({ ranges = [] }) {
  const { mode } = useTheme();
  if (!ranges.length) return null;
  return (
    <div className="space-y-3">
      <Typography variant="subtitle2" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 text-center md:text-left">
        Resumen del día
      </Typography>
      <div className="flex flex-wrap gap-2.5 justify-center md:justify-start">
        {ranges.map((range, index) => {
          const isAvailable = range.status === "available";
          return (
            <Chip
              key={`${range.status}-${index}`}
              label={`${statusLabels[range.status]} de ${formatTime12h(range.from)} a ${formatTime12h(range.to)}`}
              variant={isAvailable ? "filled" : "outlined"}
              size="small"
              sx={{
                fontWeight: 600,
                fontSize: "0.75rem",
                height: "28px",
                ...(isAvailable ? {
                  backgroundColor: mode === "dark" ? "rgba(16, 185, 129, 0.25)" : "rgba(16, 185, 129, 0.15)",
                  color: mode === "dark" ? "#34d399" : "#059669",
                  border: `1px solid ${mode === "dark" ? "rgba(16, 185, 129, 0.5)" : "rgba(16, 185, 129, 0.3)"}`,
                  "&:hover": {
                    backgroundColor: mode === "dark" ? "rgba(16, 185, 129, 0.35)" : "rgba(16, 185, 129, 0.25)"
                  }
                } : range.status === "reserved" ? {
                  borderColor: mode === "dark" ? "#f87171" : "#ef4444",
                  borderWidth: 2,
                  color: mode === "dark" ? "#f87171" : "#ef4444",
                  "&:hover": {
                    backgroundColor: mode === "dark" ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.1)"
                  }
                } : {
                  borderWidth: 1.5,
                  borderColor: mode === "dark" ? "rgba(255, 255, 255, 0.2)" : undefined,
                  color: mode === "dark" ? "rgba(255, 255, 255, 0.5)" : undefined
                }),
                transition: "all 0.2s ease"
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

