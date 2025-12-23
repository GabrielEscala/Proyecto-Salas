"use client";

import { Alert, AlertTitle, Button, Chip } from "@mui/material";
import { getSlotEndTime, formatTime12h } from "@/lib/time";
import { useTheme } from "@/lib/theme-context";

export default function BookingAlert({ conflicts = [], suggestion, onSelectSuggestion }) {
  const { mode } = useTheme();
  
  if (!conflicts.length && !suggestion) return null;
  return (
    <Alert 
      severity="error" 
      className="rounded-xl border-2 border-rose-200 dark:border-rose-800 bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/30 dark:to-rose-800/20 shadow-lg"
      sx={{
        "& .MuiAlert-icon": {
          color: "#ef4444"
        }
      }}
    >
      <AlertTitle className="font-bold text-rose-900 dark:text-rose-200">
        ⚠️ Algunos bloques ya están reservados
      </AlertTitle>
      {conflicts.length > 0 && (
        <div className="space-y-3 mt-2">
          {conflicts.map((conflict) => (
            <div key={conflict.time} className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-white/50 dark:bg-slate-800/30">
              <Chip
                label={`${formatTime12h(conflict.time)} - ${formatTime12h(getSlotEndTime(conflict.time))}`}
                color="error"
                variant="outlined"
                size="small"
                sx={{
                  borderWidth: 2,
                  fontWeight: 600,
                  "&:hover": {
                    backgroundColor: "rgba(239, 68, 68, 0.1)"
                  }
                }}
              />
              <span className="text-sm font-medium text-rose-800 dark:text-rose-200">
                Reservado por{" "}
                <strong className="font-bold">
                  {conflict.first_name} {conflict.last_name}
                </strong>
              </span>
            </div>
          ))}
        </div>
      )}
      {suggestion && (
        <div className="mt-4 p-3 rounded-lg bg-white/70 dark:bg-slate-800/50 border border-rose-200 dark:border-rose-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Próximo bloque libre: <strong className="text-brand font-bold">{formatTime12h(suggestion)}</strong>
          </span>
          <Button 
            size="small" 
            variant="contained"
            onClick={() => onSelectSuggestion?.(suggestion)}
            sx={{
              background: "linear-gradient(135deg, #0E7CFF 0%, #0A56B3 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #0A56B3 0%, #083d85 100%)",
                transform: "translateY(-2px)",
                boxShadow: "0 4px 12px rgba(14, 124, 255, 0.4)"
              },
              transition: "all 0.2s ease",
              fontWeight: 600
            }}
          >
            Usar sugerencia
          </Button>
        </div>
      )}
    </Alert>
  );
}

