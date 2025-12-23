"use client";

import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isPast } from "date-fns";
import { 
  Card, 
  CardContent, 
  Chip, 
  Typography, 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  IconButton,
  Box,
  Divider
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { groupConsecutiveBookings, formatTime12h } from "@/lib/time";
import { useTheme } from "@/lib/theme-context";

// Función para formatear el mes en español sin usar locale
const formatMonthYear = (date) => {
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
};

export default function CalendarView({ bookings = [], onDateSelect }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const { mode } = useTheme();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Agrupar reservas por fecha
  const bookingsByDate = useMemo(() => {
    const grouped = {};
    bookings.forEach((booking) => {
      const date = booking.date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(booking);
    });
    return grouped;
  }, [bookings]);

  const groupedBookingsByDate = useMemo(() => {
    const result = {};
    Object.keys(bookingsByDate).forEach((date) => {
      result[date] = groupConsecutiveBookings(bookingsByDate[date]);
    });
    return result;
  }, [bookingsByDate]);

  const navigateMonth = (direction) => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const handleDayClick = (dateStr) => {
    setSelectedDate(dateStr);
    setShowDetails(true);
    // También llamar al callback original si existe
    onDateSelect?.(dateStr);
  };

  const selectedDateBookings = useMemo(() => {
    if (!selectedDate) return [];
    const dateBookings = bookings.filter(b => b.date === selectedDate);
    return groupConsecutiveBookings(dateBookings);
  }, [selectedDate, bookings]);

  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr + "T00:00:00");
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const months = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
  };

  return (
    <Card className="border-2 border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
      <CardContent className="p-5 md:p-6 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <Typography variant="h6" className="font-bold text-slate-900 dark:text-slate-100">
            Vista de Calendario
          </Typography>
          <div className="flex gap-2">
            <button
              onClick={() => navigateMonth(-1)}
              aria-label="Mes anterior"
              className="rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all duration-200 hover:scale-105"
            >
              ←
            </button>
            <button
              onClick={() => navigateMonth(1)}
              aria-label="Mes siguiente"
              className="rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all duration-200 hover:scale-105"
            >
              →
            </button>
          </div>
        </div>

        <Typography variant="subtitle1" className="mb-4 text-center font-semibold text-slate-700 dark:text-slate-300">
          {formatMonthYear(currentMonth)}
        </Typography>

        <div className="grid grid-cols-7 gap-1">
          {/* Días de la semana */}
          {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
            <div
              key={day}
              className="p-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400"
            >
              {day}
            </div>
          ))}

          {/* Días del mes */}
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const dayBookings = groupedBookingsByDate[dateStr] || [];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isTodayDate = isToday(day);
            const isPastDate = isPast(day) && !isTodayDate;
            const hasBookings = dayBookings.length > 0;
            const isAvailable = !isPastDate && !hasBookings && isCurrentMonth;

            return (
              <button
                key={dateStr}
                onClick={() => handleDayClick(dateStr)}
                disabled={!isCurrentMonth}
                aria-label={
                  isTodayDate
                    ? `Hoy, ${format(day, "d")} de ${formatMonthYear(day)}`
                    : `${format(day, "d")} de ${formatMonthYear(day)}${hasBookings ? `, ${dayBookings.length} reserva${dayBookings.length !== 1 ? "s" : ""}` : ""}`
                }
                aria-disabled={!isCurrentMonth}
                className={`
                  relative min-h-[60px] rounded-lg border-2 p-1 text-left transition-all
                  ${!isCurrentMonth ? "opacity-30 cursor-not-allowed" : "cursor-pointer hover:scale-105 active:scale-95"}
                  
                  ${isTodayDate 
                    ? "border-brand bg-brand/10 font-bold ring-2 ring-brand ring-offset-2 ring-offset-white dark:ring-offset-slate-800" 
                    : isPastDate 
                      ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20" 
                      : isAvailable
                        ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20"
                        : hasBookings
                          ? "border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-900/20 ring-2 ring-rose-200 dark:ring-rose-800"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  }
                `}
              >
                {/* Círculo para el día de hoy */}
                {isTodayDate && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-brand rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center shadow-lg">
                    <span className="text-[8px] font-bold text-white">HOY</span>
                  </div>
                )}
                
                <div className={`
                  text-xs font-medium
                  ${isTodayDate 
                    ? "text-brand dark:text-brand-light" 
                    : isPastDate 
                      ? "text-red-700 dark:text-red-400" 
                      : isAvailable
                        ? "text-green-700 dark:text-green-400"
                        : hasBookings
                          ? "text-rose-700 dark:text-rose-400"
                          : "text-slate-700 dark:text-slate-300"
                  }
                `}>
                  {format(day, "d")}
                </div>
                
                {hasBookings && (
                  <div className="mt-1 space-y-0.5">
                    {dayBookings.slice(0, 2).map((booking, idx) => (
                      <div
                        key={idx}
                        className="truncate rounded bg-rose-200 dark:bg-rose-800/50 px-1 text-[9px] text-rose-800 dark:text-rose-200 font-medium"
                        title={`${booking.room_name} - ${booking.startTime}${booking.slots.length > 1 ? `-${booking.endTime}` : ""}`}
                      >
                        {booking.room_name}
                      </div>
                    ))}
                    {dayBookings.length > 2 && (
                      <div className="text-[9px] font-medium text-rose-600 dark:text-rose-400">
                        +{dayBookings.length - 2} más
                      </div>
                    )}
                  </div>
                )}
                
                {/* Indicador de día disponible */}
                {isAvailable && !isPastDate && (
                  <div className="mt-1">
                    <div className="text-[8px] font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">
                      Disponible
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>

      {/* Modal de detalles del día */}
      <Dialog
        open={showDetails}
        onClose={() => {
          setShowDetails(false);
          setSelectedDate(null);
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          className: "rounded-2xl shadow-2xl"
        }}
      >
        <DialogTitle 
          className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700"
          id="calendar-details-dialog-title"
        >
          <Typography 
            variant="h6" 
            className="font-bold text-slate-900 dark:text-slate-100"
            sx={{ lineHeight: 1.3 }}
          >
            {selectedDate ? formatDateForDisplay(selectedDate) : "Detalles del día"}
          </Typography>
          <IconButton
            onClick={() => {
              setShowDetails(false);
              setSelectedDate(null);
            }}
            size="small"
            className="dark:text-slate-300"
            aria-label="Cerrar detalles del día"
          >
            <CloseIcon aria-hidden="true" />
          </IconButton>
        </DialogTitle>
        <DialogContent className="p-6">
          {selectedDateBookings.length === 0 ? (
            <Box className="text-center py-8">
              <Typography variant="body1" className="text-slate-500 dark:text-slate-400 mb-2">
                No hay reservas para este día
              </Typography>
              <Typography variant="body2" className="text-slate-400 dark:text-slate-500">
                Este día está completamente disponible
              </Typography>
            </Box>
          ) : (
            <Box className="space-y-4">
              <Box className="flex items-center justify-between mb-4">
                <Typography variant="subtitle2" className="text-slate-600 dark:text-slate-400">
                  {selectedDateBookings.length} reserva{selectedDateBookings.length !== 1 ? "s" : ""} programada{selectedDateBookings.length !== 1 ? "s" : ""}
                </Typography>
                <Chip 
                  label={`${selectedDateBookings.length} reserva${selectedDateBookings.length !== 1 ? "s" : ""}`}
                  color="primary"
                  size="small"
                />
              </Box>
              
              {selectedDateBookings.map((booking, index) => {
                const timeRange = booking.slots.length > 1 
                  ? `${formatTime12h(booking.startTime)} - ${formatTime12h(booking.endTime)}`
                  : formatTime12h(booking.startTime);
                
                return (
                  <Card
                    key={booking.id ?? `${booking.room_name}-${booking.startTime}-${index}`}
                    variant="outlined"
                    className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-700/50 dark:to-slate-800/50"
                  >
                    <CardContent className="p-4">
                      <Box className="flex items-start justify-between mb-3">
                        <Box className="flex-1">
                          <Typography variant="h6" className="font-bold text-slate-900 dark:text-slate-100 mb-1">
                            {booking.room_name}
                          </Typography>
                          <Typography variant="body2" className="text-slate-600 dark:text-slate-400">
                            {booking.first_name} {booking.last_name}
                          </Typography>
                        </Box>
                        <Chip 
                          label="Reservado" 
                          color="error" 
                          size="small"
                          className="font-semibold"
                        />
                      </Box>
                      
                      <Divider className="my-3 dark:border-slate-700" />
                      
                      <Box className="grid grid-cols-2 gap-4">
                        <Box>
                          <Typography variant="caption" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                            Horario
                          </Typography>
                          <Typography variant="body1" className="font-semibold text-slate-900 dark:text-slate-100">
                            {timeRange}
                          </Typography>
                          {booking.slots.length > 1 && (
                            <Typography variant="caption" className="text-slate-500 dark:text-slate-400">
                              {booking.slots.length} bloques de 30 min
                            </Typography>
                          )}
                        </Box>
                        <Box>
                          <Typography variant="caption" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                            Duración
                          </Typography>
                          <Typography variant="body1" className="font-semibold text-slate-900 dark:text-slate-100">
                            {booking.slots.length * 30} minutos
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

