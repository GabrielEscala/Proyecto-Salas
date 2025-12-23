"use client";

import { Card, CardContent, Chip, Divider, Typography } from "@mui/material";
import { groupConsecutiveBookings, formatTime12h } from "@/lib/time";
import { useTheme } from "@/lib/theme-context";

export default function BookingsList({ bookings = [] }) {
  const groupedBookings = groupConsecutiveBookings(bookings);
  const { mode } = useTheme();

  return (
    <Card 
      elevation={0} 
      className={`border-2 ${mode === "dark" ? "border-slate-600" : "border-slate-300"} shadow-lg overflow-hidden`}
      sx={{
        background: mode === "dark" 
          ? "linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)"
          : "linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(248, 250, 252, 1) 100%)",
        borderColor: mode === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(148, 163, 184, 0.4)",
        boxShadow: mode === "dark" ? undefined : "0 4px 14px -2px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)"
      }}
    >
      <CardContent className="p-5 md:p-6 space-y-4">
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b ${mode === "dark" ? "border-slate-600" : "border-slate-300"}`}>
          <Typography variant="h6" className="font-bold text-slate-900 dark:text-slate-100 text-center sm:text-left w-full sm:w-auto">
            Reservas del día
          </Typography>
          <Chip 
            label={`${groupedBookings.length} reserva${groupedBookings.length !== 1 ? "s" : ""}`}
            size="small"
            sx={{
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              color: "#ef4444",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              fontWeight: 600,
              fontSize: "0.75rem"
            }}
          />
        </div>
        {!groupedBookings.length && (
          <div className="text-center py-8">
            <Typography variant="body2" className="text-slate-500 dark:text-slate-400 italic">
              No hay reservas registradas para este día.
            </Typography>
          </div>
        )}
        <div className="space-y-3">
          {groupedBookings.map((booking, index) => {
            const timeRange = booking.slots.length > 1 
              ? `${formatTime12h(booking.startTime)} - ${formatTime12h(booking.endTime)}`
              : formatTime12h(booking.startTime);
            
            return (
              <div 
                key={booking.id ?? `${booking.room_name}-${booking.startTime}-${index}`}
                className={`rounded-xl bg-gradient-to-r from-white to-slate-50 dark:from-slate-700/80 dark:to-slate-800/80 border ${mode === "dark" ? "border-slate-600" : "border-slate-300"} p-4 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.01]`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Typography className="font-bold text-slate-900 dark:text-slate-100 mb-1">
                      {booking.first_name} {booking.last_name}
                    </Typography>
                    <Typography variant="body2" className="text-slate-600 dark:text-slate-300">
                      {booking.room_name} · <span className="font-semibold text-brand dark:text-brand-light">{timeRange}</span>
                    </Typography>
                  </div>
                  <Chip 
                    label="Reservado" 
                    color="error" 
                    size="small"
                    sx={{
                      backgroundColor: "rgba(239, 68, 68, 0.15)",
                      color: "#ef4444",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      fontWeight: 600,
                      fontSize: "0.7rem"
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

