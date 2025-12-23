"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { format } from "date-fns";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Skeleton,
  Stack,
  Typography,
  useMediaQuery
} from "@mui/material";
import { toast, Toaster } from "sonner";
import dynamic from "next/dynamic";
import RoomSelector from "@/components/room-selector";
import DatePickerCalendar from "@/components/date-picker";
import TimeSlots from "@/components/time-slots";
import BookingForm from "@/components/booking-form";
import BookingsList from "@/components/bookings-list";
import UpcomingBookings from "@/components/upcoming-bookings";
import AvailabilitySummary from "@/components/availability-summary";
import BookingAlert from "@/components/booking-alert";
import ThemeToggle from "@/components/theme-toggle";
import SearchBar from "@/components/search-bar";

// Lazy load componentes pesados que no siempre se usan
const CalendarView = dynamic(() => import("@/components/calendar-view"), {
  loading: () => <div className="h-96 flex items-center justify-center"><div className="text-slate-500">Cargando calendario...</div></div>,
  ssr: false
});

const CodeModal = dynamic(() => import("@/components/code-modal"), {
  ssr: false
});

const ManageBookingDialog = dynamic(() => import("@/components/manage-booking-dialog"), {
  ssr: false
});
import {
  buildAvailabilityRanges,
  generateTimeSlots,
  isSlotInPast,
  formatTime12h
} from "@/lib/time";
import { useTheme } from "@/lib/theme-context";

const slots = generateTimeSlots();

export default function HomePage() {
  const today = format(new Date(), "yyyy-MM-dd");

  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [dayBookings, setDayBookings] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [conflicts, setConflicts] = useState([]);
  const [suggestion, setSuggestion] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [bookingData, setBookingData] = useState(null);

  const selectedRoomBookings = useMemo(
    () => dayBookings.filter((booking) => booking.room_id === selectedRoom),
    [dayBookings, selectedRoom]
  );

  // Filtrar reservas por búsqueda
  const filteredBookings = useMemo(() => {
    if (!searchQuery.trim()) return dayBookings;
    const query = searchQuery.toLowerCase();
    return dayBookings.filter(
      (booking) =>
        booking.first_name?.toLowerCase().includes(query) ||
        booking.last_name?.toLowerCase().includes(query) ||
        booking.room_name?.toLowerCase().includes(query) ||
        booking.time?.includes(query)
    );
  }, [dayBookings, searchQuery]);

  const slotStates = useMemo(() => {
    if (!selectedDate) return [];
    return slots.map((slot) => {
      const booking = selectedRoomBookings.find((item) => item.time === slot);
      if (booking) {
        return { time: slot, status: "reserved", booking };
      }

      if (isSlotInPast(selectedDate, slot) || !selectedRoom) {
        return { time: slot, status: "invalid" };
      }

      return {
        time: slot,
        status: "available",
        selected: selectedSlots.includes(slot)
      };
    });
  }, [selectedRoomBookings, selectedDate, selectedRoom, selectedSlots]);

  const availabilityRanges = useMemo(
    () => buildAvailabilityRanges(slotStates),
    [slotStates]
  );

  const selectedRoomLabel =
    rooms.find((room) => (room.id ?? room.name) === selectedRoom)?.name || "";

  const totalSlots = slotStates.length || slots.length;
  const availableSlots = slotStates.filter((slot) => slot.status === "available").length;
  const reservedSlots = slotStates.filter((slot) => slot.status === "reserved").length;
  const pastSlots = totalSlots - availableSlots - reservedSlots;

  const isMobile = useMediaQuery("(max-width:900px)", { noSsr: true });


  const loadRooms = async () => {
    try {
      const response = await fetch("/api/rooms");
      const data = await response.json();
      setRooms(data);
      if (!selectedRoom && data.length) {
        setSelectedRoom(data[0].id ?? data[0].name);
      }
    } catch (error) {
      console.error(error);
      toast.error("No pudimos cargar las salas.");
    }
  };

  const loadBookings = async (date = selectedDate) => {
    if (!date) return;
    setFetching(true);
    try {
      const response = await fetch(`/api/bookings?date=${date}`);
      const data = await response.json();
      setDayBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      toast.error("No pudimos cargar las reservas.");
    } finally {
      setFetching(false);
    }
  };

  const loadUpcoming = async (date = selectedDate) => {
    if (!date) return;
    const now = format(new Date(), "HH:mm");
    try {
      const response = await fetch(
        `/api/bookings/upcoming?date=${date}&currentTime=${now}`
      );
      const data = await response.json();
      setUpcomingBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    }
  };

  const refreshData = async () => {
    await Promise.all([loadBookings(), loadUpcoming()]);
  };

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      refreshData();
    }
  }, [selectedDate]);

  useEffect(() => {
    setSelectedSlots([]);
    setConflicts([]);
    setSuggestion("");
  }, [selectedRoom, selectedDate]);

  const handleSlotToggle = useCallback((slot) => {
    setSelectedSlots((prev) => {
      if (prev.includes(slot)) {
        return prev.filter((item) => item !== slot);
      }
      return [...prev, slot].sort();
    });
  }, []);

  const handleSuggestionSelect = useCallback((slot) => {
    if (!slot) return;
    setSelectedSlots((prev) => {
      if (prev.includes(slot)) {
        return prev;
      }
      return [...prev, slot].sort();
    });
  }, []);

  const handleBookingSubmit = async (payload) => {
    setLoading(true);
    setConflicts([]);
    setSuggestion("");
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 409) {
          setConflicts(data.conflicts || []);
          setSuggestion(data.suggestion);
          toast.error("Uno o más horarios ya están reservados.");
        } else {
          toast.error(data.error || "No pudimos crear la reserva.");
        }
        return;
      }

      const bookings = Array.isArray(data.all_bookings) ? data.all_bookings : [data];
      const bookedTimes = bookings.map((item) => item.time);
      const roomName = bookings[0]?.room_name || selectedRoomLabel;
      // Formatear timeRange a AM/PM si viene de la API, o formatear bookedTimes
      let timeRange = data.time_range;
      if (!timeRange && bookedTimes.length > 0) {
        if (bookedTimes.length === 1) {
          timeRange = formatTime12h(bookedTimes[0]?.slice(0, 5) || bookedTimes[0]);
        } else {
          const start = formatTime12h(bookedTimes[0]?.slice(0, 5) || bookedTimes[0]);
          const end = formatTime12h(bookedTimes[bookedTimes.length - 1]?.slice(0, 5) || bookedTimes[bookedTimes.length - 1]);
          timeRange = `${start} - ${end}`;
        }
      } else if (timeRange && !timeRange.includes("AM") && !timeRange.includes("PM")) {
        // Si timeRange viene en formato 24h, convertirlo
        const parts = timeRange.split(" - ");
        if (parts.length === 2) {
          timeRange = `${formatTime12h(parts[0])} - ${formatTime12h(parts[1])}`;
        } else {
          timeRange = formatTime12h(timeRange);
        }
      }
      const cancelCode = data.cancel_code;
      const cancelUrl = data.cancel_url;
      
      // Mostrar modal con código
      if (cancelCode) {
        setBookingData({
          cancelCode,
          cancelUrl,
          roomName,
          timeRange,
          date: selectedDate
        });
        setShowCodeModal(true);
      }
      
      toast.success(`Reserva confirmada • ${roomName} • ${timeRange}`);
      
      setSelectedSlots([]);
      setConflicts([]);
      setSuggestion("");
      await refreshData();
      return { success: true, cancelCode, cancelUrl };
    } catch (error) {
      console.error(error);
      toast.error("Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }

    return { success: false };
  };

  const isLoadingState = fetching && !dayBookings.length;
  const { mode } = useTheme();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 pb-24 md:pb-8 transition-colors duration-200">
      <Toaster richColors position={isMobile ? "top-center" : "top-right"} />
      <Container maxWidth="lg" className="px-4 py-6 md:px-6 md:py-8">
        {/* Header mejorado */}
        <div className="mb-8 md:mb-10">
          <Card 
            elevation={0}
            className={`border-2 ${mode === "dark" ? "border-slate-600" : "border-slate-300"} shadow-xl overflow-hidden mb-6`}
            sx={{
              background: mode === "dark" 
                ? "linear-gradient(135deg, rgba(14, 124, 255, 0.15) 0%, rgba(10, 86, 179, 0.15) 100%)"
                : "linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(248, 250, 252, 1) 100%)",
              borderColor: mode === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(148, 163, 184, 0.4)",
              boxShadow: mode === "dark" ? undefined : "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
            }}
          >
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
                <div className="flex-1 text-center md:text-left w-full md:w-auto">
                  <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <img 
                        src="/logo-salas.svg" 
                        alt="SALAS Logo" 
                        className="h-7 sm:h-9 md:h-10 w-auto transition-opacity duration-200"
                        style={{ filter: mode === "dark" ? "brightness(1.1)" : "none" }}
                      />
                      <img 
                        src="/logo-heart.svg" 
                        alt="Heart Logo" 
                        className="h-5 sm:h-7 md:h-8 w-auto transition-opacity duration-200"
                      />
                    </div>
                    <div className="flex-1">
                      <Typography
                        variant={isMobile ? "h5" : "h4"}
                        className="font-extrabold text-slate-900 dark:text-slate-100 mb-2"
                        sx={{
                          background: "linear-gradient(135deg, #0E7CFF 0%, #0A56B3 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                          lineHeight: 1.2,
                          textAlign: { xs: "center", sm: "left" }
                        }}
                      >
                        Reserva de Salas
                      </Typography>
                    </div>
                  </div>
                  <Typography
                    variant="body1"
                    className={`${mode === "dark" ? "text-slate-400" : "text-slate-700"} font-medium`}
                    sx={{ 
                      lineHeight: 1.5,
                      textAlign: { xs: "center", sm: "left" }
                    }}
                  >
                    Horario 7:00 am - 8:00 pm • Bloques de 30 minutos
                  </Typography>
                </div>
                <div className="flex-shrink-0">
                  <ThemeToggle />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats compactos para móvil */}
          {isMobile && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Disponibles", value: availableSlots, color: "text-brand", bg: "bg-brand/10 dark:bg-brand/20", border: "border-brand/50 dark:border-brand/30" },
                { label: "Reservadas", value: reservedSlots, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-900/20", border: "border-rose-300 dark:border-rose-200" },
                { label: "Pasadas", value: pastSlots, color: "text-slate-400", bg: "bg-slate-100 dark:bg-slate-800/50", border: "border-slate-300 dark:border-slate-200" }
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={`rounded-xl ${stat.bg} border-2 ${stat.border} p-4 text-center shadow-sm hover:shadow-md transition-all duration-200`}
                >
                  <p className={`text-3xl font-extrabold ${stat.color} mb-1`}>{stat.value}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selección de Sala y Fecha */}
        <section className="mb-6 md:mb-8">
          <Card 
            elevation={0}
            className={`border-2 ${mode === "dark" ? "border-slate-600" : "border-slate-300"} shadow-xl overflow-hidden`}
            sx={{
              background: mode === "dark"
                ? "linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)"
                : "linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(248, 250, 252, 1) 100%)",
              borderColor: mode === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(148, 163, 184, 0.4)",
              boxShadow: mode === "dark" ? undefined : "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
            }}
          >
            <CardContent className="p-6 md:p-8">
              <Typography 
                variant="h6" 
                className="mb-6 font-bold text-slate-900 dark:text-slate-100 text-center md:text-left"
                sx={{ lineHeight: 1.3 }}
              >
                Selecciona Sala y Fecha
              </Typography>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2 w-full">
                  <RoomSelector 
                    rooms={rooms} 
                    value={selectedRoom} 
                    onChange={setSelectedRoom}
                    showInfo={true}
                  />
                </div>
                <div className="space-y-2 w-full">
                  <DatePickerCalendar value={selectedDate} onChange={setSelectedDate} />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Alerta de conflictos */}
        {conflicts.length || suggestion ? (
          <div className="mb-6">
            <BookingAlert
              conflicts={conflicts}
              suggestion={suggestion}
              onSelectSuggestion={handleSuggestionSelect}
            />
          </div>
        ) : null}

        {/* Selección de Horarios */}
        <section className="mb-6 md:mb-8">
          <Card 
            elevation={0}
            className={`border-2 ${mode === "dark" ? "border-slate-600" : "border-slate-300"} shadow-xl overflow-hidden`}
            sx={{
              background: mode === "dark"
                ? "linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)"
                : "linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(248, 250, 252, 1) 100%)",
              borderColor: mode === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(148, 163, 184, 0.4)",
              boxShadow: mode === "dark" ? undefined : "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
            }}
          >
            <CardContent className="p-6 md:p-8">
              <div className={`mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b-2 ${mode === "dark" ? "border-slate-600" : "border-slate-300"}`}>
                <div className="flex-1">
                  <Typography variant="h6" className="font-bold text-slate-900 dark:text-slate-100 mb-1 text-center sm:text-left">
                    Selecciona horarios
                  </Typography>
                  <Typography variant="body2" className="text-slate-600 dark:text-slate-300 text-center sm:text-left">
                    Elige los bloques de 30 minutos que necesitas
                  </Typography>
                </div>
                {selectedSlots.length > 0 && (
                  <div className="flex-shrink-0 w-full sm:w-auto flex justify-center sm:justify-end">
                    <Chip
                      size="medium"
                      color="primary"
                      label={`${selectedSlots.length} seleccionado${selectedSlots.length > 1 ? "s" : ""}`}
                      sx={{
                        backgroundColor: "rgba(14, 124, 255, 0.15)",
                        color: "#0E7CFF",
                        border: "2px solid rgba(14, 124, 255, 0.3)",
                        fontWeight: 700,
                        fontSize: "0.875rem",
                        height: "36px",
                        padding: "0 12px"
                      }}
                    />
                  </div>
                )}
              </div>
              {isLoadingState ? (
                <Skeleton variant="rounded" height={isMobile ? 400 : 500} className="rounded-xl" />
              ) : (
                <TimeSlots
                  slots={slots}
                  slotStates={slotStates}
                  selectedSlots={selectedSlots}
                  onToggle={handleSlotToggle}
                />
              )}
            </CardContent>
          </Card>
        </section>

        {/* Formulario de Reserva - En móvil aparece justo después de horarios */}
        {isMobile && (
          <section className="mb-6 md:mb-8">
            <BookingForm
              selectedRoom={selectedRoom}
              selectedRoomLabel={selectedRoomLabel}
              selectedDate={selectedDate}
              selectedSlots={selectedSlots}
              onRemoveSlot={handleSlotToggle}
              onSubmit={handleBookingSubmit}
              loading={loading}
            />
          </section>
        )}

        {/* Layout responsive: Desktop muestra lado a lado, Mobile apila */}
        <Grid container spacing={isMobile ? 2 : 4}>
          {/* Columna izquierda: Formulario y próximas reservas (solo en desktop) */}
          {!isMobile && (
            <Grid item xs={12} lg={5} order={1}>
              <Stack spacing={4}>
                {/* Paso 3: Formulario de Reserva */}
                <BookingForm
                  selectedRoom={selectedRoom}
                  selectedRoomLabel={selectedRoomLabel}
                  selectedDate={selectedDate}
                  selectedSlots={selectedSlots}
                  onRemoveSlot={handleSlotToggle}
                  onSubmit={handleBookingSubmit}
                  loading={loading}
                />
                {/* Próximas reservas */}
                <UpcomingBookings items={upcomingBookings} />
              </Stack>
            </Grid>
          )}
          
          {/* En móvil, mostrar próximas reservas aquí */}
          {isMobile && (
            <Grid item xs={12} order={2}>
              <UpcomingBookings items={upcomingBookings} />
            </Grid>
          )}

          {/* Columna derecha: Resumen y lista completa */}
          <Grid item xs={12} lg={7} order={isMobile ? 1 : 2}>
            <Stack spacing={isMobile ? 3 : 4}>
              {/* Resumen de disponibilidad */}
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
                <CardContent className="p-5 md:p-6">
                  <Typography 
                    variant="h6" 
                    className="mb-4 font-bold text-slate-900 dark:text-slate-100 text-center md:text-left"
                    sx={{ lineHeight: 1.3 }}
                  >
                    Resumen del Día
                  </Typography>
                  <AvailabilitySummary ranges={availabilityRanges} />
                </CardContent>
              </Card>
              {/* Búsqueda */}
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
                <CardContent className="p-5">
                  <Typography 
                    variant="h6" 
                    className="mb-4 font-bold text-slate-900 dark:text-slate-100 text-center md:text-left"
                    sx={{ lineHeight: 1.3 }}
                  >
                    Buscar Reservas
                  </Typography>
                  <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Buscar por nombre, sala o horario..."
                  />
                </CardContent>
              </Card>

              {/* Vista de calendario toggle */}
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
                <CardContent className="p-5">
                  <Button
                    variant={showCalendar ? "contained" : "outlined"}
                    onClick={() => setShowCalendar(!showCalendar)}
                    fullWidth
                    size="large"
                    startIcon={showCalendar ? null : null}
                    sx={{
                      ...(showCalendar ? {
                        background: "linear-gradient(135deg, #0E7CFF 0%, #0A56B3 100%)",
                        "&:hover": {
                          background: "linear-gradient(135deg, #0A56B3 0%, #083d85 100%)",
                          transform: "translateY(-2px)",
                          boxShadow: "0 8px 16px rgba(14, 124, 255, 0.3)"
                        }
                      } : {
                        borderWidth: 2,
                        borderColor: "#0E7CFF",
                        color: "#0E7CFF",
                        "&:hover": {
                          borderWidth: 2,
                          backgroundColor: "rgba(14, 124, 255, 0.1)",
                          transform: "translateY(-2px)",
                          boxShadow: "0 4px 12px rgba(14, 124, 255, 0.2)"
                        }
                      }),
                      transition: "all 0.2s ease",
                      fontWeight: 600,
                      height: "48px",
                      fontSize: "1rem"
                    }}
                  >
                    {showCalendar ? "Ocultar Calendario" : "Mostrar Calendario Mensual"}
                  </Button>
                </CardContent>
              </Card>

              {showCalendar && (
                <CalendarView
                  bookings={dayBookings}
                  onDateSelect={(date) => {
                    setSelectedDate(date);
                    setShowCalendar(false);
                  }}
                />
              )}

              {/* Lista completa de reservas del día */}
              <BookingsList
                bookings={[...filteredBookings].sort((a, b) => a.time.localeCompare(b.time))}
              />

              {/* Botón para gestionar reserva */}
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
                <CardContent className="p-5">
                  <Typography 
                    variant="h6" 
                    className="mb-4 font-bold text-slate-900 dark:text-slate-100 text-center md:text-left"
                    sx={{ lineHeight: 1.3 }}
                  >
                    Gestionar Reserva
                  </Typography>
                  <Typography 
                    variant="body2" 
                    className="mb-4 text-slate-600 dark:text-slate-400 text-center md:text-left"
                    sx={{ lineHeight: 1.5 }}
                  >
                    Ingresa tu código de cancelación para editar o cancelar tu reserva
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => setShowManageDialog(true)}
                    fullWidth
                    size="large"
                    className="font-semibold"
                    aria-label="Abrir diálogo para gestionar reserva con código"
                    sx={{
                      borderWidth: 2,
                      borderColor: "#0E7CFF",
                      color: "#0E7CFF",
                      height: "48px",
                      fontSize: "1rem",
                      "&:hover": {
                        borderWidth: 2,
                        borderColor: "#0A56B3",
                        backgroundColor: "rgba(14, 124, 255, 0.1)",
                        transform: "translateY(-2px)",
                        boxShadow: "0 4px 12px rgba(14, 124, 255, 0.2)"
                      },
                      transition: "all 0.2s ease"
                    }}
                  >
                    Ingresar Código
                  </Button>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>

        {/* Sticky Bottom Bar para móvil - Mejorado */}
        {isMobile && selectedSlots.length > 0 && (
          <Box className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg shadow-2xl">
            <Container maxWidth="lg" className="px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Listo para reservar
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    {selectedRoomLabel} • {selectedSlots.length} bloque{selectedSlots.length > 1 ? "s" : ""}
                  </p>
                </div>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={() => {
                    if (selectedSlots.length) {
                      const formElement = document.querySelector('form');
                      if (formElement) {
                        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                        formElement.dispatchEvent(submitEvent);
                      }
                    } else {
                      toast.info("Completa el formulario arriba para reservar");
                    }
                  }}
                  className="font-semibold shadow-xl"
                  disabled={loading || !selectedSlots.length}
                  sx={{
                    background: loading || !selectedSlots.length 
                      ? undefined 
                      : "linear-gradient(135deg, #0E7CFF 0%, #0A56B3 100%)",
                    "&:hover": {
                      background: loading || !selectedSlots.length 
                        ? undefined 
                        : "linear-gradient(135deg, #0A56B3 0%, #083d85 100%)",
                      transform: "translateY(-2px)",
                      boxShadow: "0 10px 20px rgba(14, 124, 255, 0.4)"
                    },
                    "&:disabled": {
                      background: "rgba(14, 124, 255, 0.3)"
                    },
                    transition: "all 0.2s ease"
                  }}
                >
                  {loading ? "Reservando..." : "Confirmar"}
                </Button>
              </div>
            </Container>
          </Box>
        )}

        {/* Modal de código de cancelación (solo al crear reserva) */}
        {bookingData && (
          <CodeModal
            open={showCodeModal}
            onClose={() => {
              setShowCodeModal(false);
              setBookingData(null);
            }}
            cancelCode={bookingData.cancelCode}
            cancelUrl={bookingData.cancelUrl}
            roomName={bookingData.roomName}
            timeRange={bookingData.timeRange}
            date={bookingData.date}
          />
        )}

        {/* Dialog para ingresar código y gestionar */}
        <ManageBookingDialog
          open={showManageDialog}
          onClose={() => setShowManageDialog(false)}
        />
      </Container>
    </main>
  );
}

