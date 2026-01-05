"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  addMonths,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  subMonths
} from "date-fns";
import { es } from "date-fns/locale";
import {
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
  Container,
  Box,
  Divider,
  CircularProgress,
  Skeleton
} from "@mui/material";
import { toast, Toaster } from "sonner";
import { generateTimeSlots, isSlotInPast, formatTime12h } from "@/lib/time";
import { isValidCancelCode } from "@/lib/codes";
import ThemeToggle from "@/components/theme-toggle";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useTheme } from "@/lib/theme-context";

const slots = generateTimeSlots();

function ManageCalendar({ value, onChange, mode }) {
  const [cursorMonth, setCursorMonth] = useState(() => parseISO(value));

  useEffect(() => {
    setCursorMonth(parseISO(value));
  }, [value]);

  const monthStart = startOfMonth(cursorMonth);
  const monthEnd = endOfMonth(cursorMonth);
  const startWeekday = monthStart.getDay();

  const days = (() => {
    const result = [];
    for (let i = 0; i < startWeekday; i += 1) result.push(null);
    for (let d = new Date(monthStart); !isAfter(d, monthEnd); d.setDate(d.getDate() + 1)) {
      result.push(new Date(d));
    }
    return result;
  })();

  const today = startOfDay(new Date());
  const selected = parseISO(value);

  const canSelect = (day) => {
    if (!day) return false;
    if (!isSameMonth(day, cursorMonth)) return false;
    return !isBefore(startOfDay(day), today);
  };

  const dayButtonClass = (day) => {
    const selectedDay = day && isSameDay(day, selected);
    const outside = day && !isSameMonth(day, cursorMonth);
    const past = day && isBefore(startOfDay(day), today);
    const isToday = day && isSameDay(day, today);

    if (!day) return "";

    if (selectedDay) {
      return "bg-brand text-white shadow-lg";
    }

    if (past || outside) {
      return "text-slate-300 dark:text-slate-600";
    }

    if (isToday) {
      return "ring-2 ring-brand/60 text-slate-900 dark:text-slate-100";
    }

    return "text-slate-800 dark:text-slate-100 hover:bg-brand/10 dark:hover:bg-brand/20";
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="text"
          onClick={() => setCursorMonth((m) => subMonths(m, 1))}
          sx={{
            minWidth: 44,
            height: 40,
            borderRadius: "12px",
            color: mode === "dark" ? "#e2e8f0" : "#0f172a",
            "&:hover": { backgroundColor: mode === "dark" ? "rgba(148,163,184,0.12)" : "rgba(15,23,42,0.06)" }
          }}
          aria-label="Mes anterior"
        >
          ‹
        </Button>
        <Typography
          variant="subtitle1"
          className="font-extrabold"
          sx={{ color: mode === "dark" ? "#e2e8f0" : "#0f172a" }}
        >
          {format(cursorMonth, "MMMM yyyy", { locale: es })}
        </Typography>
        <Button
          variant="text"
          onClick={() => setCursorMonth((m) => addMonths(m, 1))}
          sx={{
            minWidth: 44,
            height: 40,
            borderRadius: "12px",
            color: mode === "dark" ? "#e2e8f0" : "#0f172a",
            "&:hover": { backgroundColor: mode === "dark" ? "rgba(148,163,184,0.12)" : "rgba(15,23,42,0.06)" }
          }}
          aria-label="Mes siguiente"
        >
          ›
        </Button>
      </div>

      <div className="grid grid-cols-7 text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2">
        {["D", "L", "M", "M", "J", "V", "S"].map((d) => (
          <div key={d} className="text-center py-2">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => (
          <button
            key={day ? day.toISOString() : `empty-${idx}`}
            type="button"
            disabled={!canSelect(day)}
            onClick={() => {
              if (!day) return;
              onChange?.(format(day, "yyyy-MM-dd"));
            }}
            className={
              "h-10 w-10 mx-auto rounded-full flex items-center justify-center text-sm font-extrabold transition-all " +
              (day ? dayButtonClass(day) : "")
            }
          >
            {day ? format(day, "d") : ""}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-300">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full border-2 border-brand"></span>
          Hoy
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-brand/30"></span>
          Disponible
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
          Pasado
        </span>
      </div>
    </div>
  );
}

export default function ManageBookingPage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code;
  const today = new Date().toISOString().split("T")[0];
  const { mode } = useTheme();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const [availabilityBookings, setAvailabilityBookings] = useState([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  useEffect(() => {
    if (!code || !isValidCancelCode(code)) {
      toast.error("Código inválido");
      router.push("/");
      return;
    }
    loadBooking();
    loadRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const loadRooms = async () => {
    setLoadingRooms(true);
    try {
      const response = await fetch("/api/rooms");
      const data = await response.json();
      if (!Array.isArray(data)) {
        setRooms([]);
        toast.error("No se pudieron cargar las salas");
        return;
      }
      setRooms(data);
    } catch (error) {
      console.error(error);
      setRooms([]);
      toast.error("No se pudieron cargar las salas");
    } finally {
      setLoadingRooms(false);
    }
  };

  const loadAvailability = async (nextRoomId, nextDate) => {
    if (!nextRoomId || !nextDate) {
      setAvailabilityBookings([]);
      return;
    }

    setLoadingAvailability(true);
    try {
      const response = await fetch(`/api/bookings?date=${nextDate}&roomId=${nextRoomId}`);
      const data = await response.json();
      setAvailabilityBookings(Array.isArray(data) ? data : []);
    } catch {
      setAvailabilityBookings([]);
    } finally {
      setLoadingAvailability(false);
    }
  };

  const loadBooking = async () => {
    try {
      const response = await fetch(`/api/bookings?cancelCode=${code}`);
      if (!response.ok) {
        throw new Error("Error al cargar la reserva");
      }
      const data = await response.json();
      if (data && Array.isArray(data) && data.length > 0) {
        const first = data[0];
        setBooking(data);
        setSelectedRoom(first.room_id);
        setSelectedDate(first.date);
        // Agrupar slots de la reserva
        const bookingSlots = data.map(b => b.time?.slice(0, 5)).filter(Boolean).sort();
        setSelectedSlots(bookingSlots);
      } else {
        toast.error("Reserva no encontrada");
        router.push("/");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error cargando la reserva");
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancelCode: code })
      });

      let data = null;
      try {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          data = await response.json();
        } else {
          const text = await response.text();
          data = { error: text };
        }
      } catch (_) {
        data = null;
      }

      if (!response.ok) {
        toast.error(data?.error || `No se pudo cancelar la reserva (HTTP ${response.status})`);
        return;
      }

      toast.success("Reserva cancelada exitosamente");
      router.push("/");
    } catch (error) {
      console.error(error);
      toast.error("Error al cancelar la reserva");
    } finally {
      setSaving(false);
      setCancelDialog(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedRoom || !selectedDate || selectedSlots.length === 0) {
      toast.error("Completa todos los campos");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/bookings/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cancelCode: code,
          newRoomId: selectedRoom,
          newDate: selectedDate,
          newTimes: selectedSlots
        })
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 409) {
          toast.error("Los nuevos horarios ya están reservados");
        } else {
          toast.error(data.error || "No se pudo actualizar la reserva");
        }
        return;
      }

      toast.success("Reserva actualizada exitosamente");
      setEditMode(false);
      await loadBooking();
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar la reserva");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <Box className="text-center">
          <CircularProgress size={60} className="mb-4" />
          <Typography variant="h6" className="text-slate-600 dark:text-slate-400">
            Cargando reserva...
          </Typography>
        </Box>
      </main>
    );
  }

  if (!booking || booking.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center p-6">
            <Typography variant="h6" className="mb-4 text-slate-900 dark:text-slate-100">
              Reserva no encontrada
            </Typography>
            <Button
              variant="contained"
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push("/")}
            >
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const firstBooking = booking[0];
  const currentRoomName =
    firstBooking.room_name ||
    rooms.find((r) => (r?.id ?? r?.name) === firstBooking.room_id)?.name ||
    "—";
  const startTime = booking[0].time?.slice(0, 5) || "";
  const endTime = booking[booking.length - 1].time?.slice(0, 5) || "";
  const timeRange = booking.length > 1
    ? `${formatTime12h(startTime)} - ${formatTime12h(endTime)}`
    : formatTime12h(startTime);

  const bookingCompany = firstBooking.company || "";
  const isMahCompany = String(bookingCompany).trim().toLowerCase() === "mah";

  const availabilitySlotStates = (() => {
    const bookingTimes = new Map(
      (availabilityBookings || [])
        .filter((b) => b && b.cancel_code !== code)
        .map((b) => [(b.time || "").slice(0, 5), b])
    );

    return slots.map((t) => {
      if (bookingTimes.has(t)) {
        return { time: t, status: "reserved", booking: bookingTimes.get(t) };
      }
      if (isSlotInPast(selectedDate, t)) return { time: t, status: "invalid" };
      return { time: t, status: "available" };
    });
  })();

  return (
    <main className="min-h-screen pb-12 transition-colors duration-200">
      <Toaster richColors position="top-right" />
      <Container maxWidth="lg" className="px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img
              src={isMahCompany ? "/logo-heart.svg" : "/logo-salas.svg"}
              alt={isMahCompany ? "MAH" : "SALAS"}
              className="h-9 w-auto"
              style={{
                height: 36,
                width: "auto",
                maxHeight: 36,
                filter: mode === "dark" ? "brightness(1.1)" : "none"
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="text"
              startIcon={<ArrowBackIcon aria-hidden="true" />}
              onClick={() => router.push("/")}
              sx={{
                fontWeight: 800,
                textTransform: "none",
                borderRadius: "12px",
                color: mode === "dark" ? "#e2e8f0" : "#0f172a"
              }}
              aria-label="Volver a la página principal"
            >
              Volver
            </Button>
          </div>
        </div>

        <div
          className={
            "rounded-3xl overflow-hidden border bg-white/90 dark:bg-slate-900/80 shadow-xl backdrop-blur-sm " +
            (mode === "dark" ? "border-slate-800" : "border-slate-200/70")
          }
        >
          <div className="p-6 md:p-7">
            <Box className="mb-6">
              <Typography variant="h4" className="mb-3 font-extrabold" sx={{ color: mode === "dark" ? "#e2e8f0" : "#0f172a" }}>
                Gestionar Reserva
              </Typography>
              {firstBooking.storage === "memory" ? (
                <Chip
                  label="Modo local: esta reserva no quedará guardada si reinicias el servidor"
                  color="warning"
                  className="mr-2 font-semibold"
                  sx={{
                    height: "32px",
                    fontSize: "0.8rem",
                    backgroundColor: mode === "dark" ? "rgba(245, 158, 11, 0.15)" : "rgba(245, 158, 11, 0.12)",
                    color: mode === "dark" ? "#fbbf24" : "#b45309",
                    border: `1px solid ${mode === "dark" ? "rgba(245, 158, 11, 0.35)" : "rgba(245, 158, 11, 0.35)"}`
                  }}
                />
              ) : null}
              <Chip
                label={`Código: ${code}`}
                color="primary"
                className="font-mono font-semibold"
                sx={{
                  fontSize: "0.875rem",
                  height: "32px",
                  backgroundColor: "rgba(14, 124, 255, 0.1)",
                  color: "#0E7CFF",
                  border: "1px solid rgba(14, 124, 255, 0.3)"
                }}
              />
            </Box>

            {/* Información de la reserva */}
            <Card 
              variant="outlined" 
              className={
                "mb-6 border-2 shadow-sm " +
                (mode === "dark"
                  ? "border-slate-800 bg-slate-900/70"
                  : "border-slate-200/70 bg-white/80")
              }
            >
              <CardContent className="p-5">
                <Typography variant="h6" className="mb-4 font-bold text-slate-900 dark:text-slate-100">
                  Reserva Actual
                </Typography>
                <Divider className="mb-4 dark:border-slate-700" />
                <div className="grid gap-4 md:grid-cols-2">
                  <Box>
                    <Typography variant="caption" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Persona
                    </Typography>
                    <Typography className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
                      {firstBooking.first_name} {firstBooking.last_name}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Empresa
                    </Typography>
                    <Typography className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
                      {firstBooking.company || "—"}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Sala
                    </Typography>
                    <Typography className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
                      {currentRoomName}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Fecha
                    </Typography>
                    <Typography className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
                      {firstBooking.date}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Horario
                    </Typography>
                    <Typography className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
                      {timeRange}
                    </Typography>
                  </Box>
                </div>
              </CardContent>
            </Card>

            {editMode ? (
              <Box className="space-y-6">
                <Box>
                  <Typography variant="h6" className="mb-4 font-bold text-slate-900 dark:text-slate-100">
                    Editar Reserva
                  </Typography>
                  <Divider className="mb-4 dark:border-slate-700" />
                </Box>
                <div className="grid gap-6 lg:grid-cols-3">
                  <Card
                    variant="outlined"
                    className={
                      "border-2 rounded-2xl overflow-hidden shadow-sm " +
                      (mode === "dark"
                        ? "border-slate-800 bg-slate-900/70"
                        : "border-slate-200/70 bg-white/80")
                    }
                  >
                    <CardContent className="p-5">
                      <Typography variant="subtitle1" className="mb-4 font-extrabold text-slate-900 dark:text-slate-100">
                        Sala
                      </Typography>
                      <div className="space-y-3">
                        <Typography
                          variant="body2"
                          className="text-slate-600 dark:text-slate-300 font-semibold"
                        >
                          Selecciona una sala
                        </Typography>
                        <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
                          {loadingRooms ? (
                            <div className="space-y-2">
                              <Skeleton variant="rounded" height={44} className="rounded-xl" />
                              <Skeleton variant="rounded" height={44} className="rounded-xl" />
                              <Skeleton variant="rounded" height={44} className="rounded-xl" />
                              <Skeleton variant="rounded" height={44} className="rounded-xl" />
                            </div>
                          ) : rooms.length ? (
                            rooms.map((room) => {
                              const roomId = room.id ?? room.name;
                              const selected = roomId === selectedRoom;
                              return (
                                <Button
                                  key={roomId}
                                  fullWidth
                                  variant={selected ? "contained" : "outlined"}
                                  onClick={() => {
                                    setSelectedRoom(roomId);
                                    loadAvailability(roomId, selectedDate);
                                  }}
                                  sx={{
                                    justifyContent: "space-between",
                                    textTransform: "none",
                                    fontWeight: 900,
                                    borderRadius: "14px",
                                    height: 44,
                                    ...(selected
                                      ? {
                                          background: "linear-gradient(135deg, #0E7CFF 0%, #0A56B3 100%)",
                                          "&:hover": {
                                            background: "linear-gradient(135deg, #0A56B3 0%, #083d85 100%)"
                                          }
                                        }
                                      : {
                                          borderWidth: 2,
                                          borderColor: "rgba(14, 124, 255, 0.35)",
                                          color: mode === "dark" ? "#e2e8f0" : "#0A56B3",
                                          backgroundColor: mode === "dark" ? "rgba(15,23,42,0.25)" : "rgba(248,250,252,0.7)"
                                        })
                                  }}
                                >
                                  <span className="truncate">{room.name}</span>
                                </Button>
                              );
                            })
                          ) : (
                            <Typography variant="body2" className="text-slate-600 dark:text-slate-300">
                              No hay salas disponibles.
                            </Typography>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card
                    variant="outlined"
                    className={
                      "border-2 rounded-2xl overflow-hidden shadow-sm " +
                      (mode === "dark"
                        ? "border-slate-800 bg-slate-900/70"
                        : "border-slate-200/70 bg-white/80")
                    }
                  >
                    <CardContent className="p-5">
                      <Typography variant="subtitle1" className="mb-4 font-extrabold text-slate-900 dark:text-slate-100">
                        Fecha
                      </Typography>
                      <ManageCalendar
                        value={selectedDate}
                        mode={mode}
                        onChange={(value) => {
                          setSelectedDate(value);
                          loadAvailability(selectedRoom, value);
                        }}
                      />
                    </CardContent>
                  </Card>

                  <Card
                    variant="outlined"
                    className={
                      "border-2 rounded-2xl overflow-hidden shadow-sm " +
                      (mode === "dark"
                        ? "border-slate-800 bg-slate-900/70"
                        : "border-slate-200/70 bg-white/80")
                    }
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <Typography variant="subtitle1" className="font-extrabold text-slate-900 dark:text-slate-100">
                            Horarios
                          </Typography>
                          <Typography variant="caption" className="text-slate-600 dark:text-slate-300 font-semibold">
                            Seleccionados: {selectedSlots.length}
                          </Typography>
                        </div>
                      </div>

                      {selectedSlots.length ? (
                        <div className="mb-4 flex flex-wrap gap-2">
                          {selectedSlots.map((t) => (
                            <Chip
                              key={t}
                              label={formatTime12h(t)}
                              onDelete={() => setSelectedSlots((prev) => prev.filter((x) => x !== t))}
                              size="small"
                              sx={{
                                fontWeight: 800,
                                borderRadius: "999px",
                                backgroundColor: mode === "dark" ? "rgba(14, 124, 255, 0.12)" : "rgba(14, 124, 255, 0.10)",
                                color: mode === "dark" ? "#93c5fd" : "#0A56B3",
                                border: "1px solid rgba(14, 124, 255, 0.25)"
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        <Typography variant="body2" className="mb-4 text-slate-600 dark:text-slate-300">
                          Selecciona uno o más horarios disponibles.
                        </Typography>
                      )}

                      {loadingAvailability ? (
                        <Skeleton variant="rounded" height={520} className="rounded-2xl" />
                      ) : (
                        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
                          {availabilitySlotStates.map((slot) => {
                            const isSelected = selectedSlots.includes(slot.time);
                            const isAvailable = slot.status === "available";
                            const isReserved = slot.status === "reserved";
                            const reservedLabel = isReserved
                              ? `${slot.booking?.first_name || ""} ${slot.booking?.last_name || ""}`.trim()
                              : "";
                            const reservedCompany = isReserved ? slot.booking?.company : null;

                            return (
                              <div key={slot.time} className="flex items-center gap-2">
                                <Button
                                  variant={isSelected ? "contained" : "outlined"}
                                  disabled={!isAvailable}
                                  onClick={() => {
                                    if (!isAvailable) return;
                                    setSelectedSlots((prev) => {
                                      const exists = prev.includes(slot.time);
                                      const next = exists
                                        ? prev.filter((t) => t !== slot.time)
                                        : [...prev, slot.time];
                                      return next.sort((a, b) => a.localeCompare(b));
                                    });
                                  }}
                                  sx={{
                                    flex: 1,
                                    height: 44,
                                    fontWeight: 900,
                                    textTransform: "none",
                                    borderRadius: "14px",
                                    ...(isSelected
                                      ? {
                                          background: "linear-gradient(135deg, #0E7CFF 0%, #0A56B3 100%)",
                                          "&:hover": {
                                            background: "linear-gradient(135deg, #0A56B3 0%, #083d85 100%)"
                                          }
                                        }
                                      : {
                                          borderWidth: 2,
                                          borderColor: isAvailable
                                            ? "rgba(14, 124, 255, 0.35)"
                                            : "rgba(148, 163, 184, 0.25)",
                                          color: isAvailable
                                            ? mode === "dark"
                                              ? "#e2e8f0"
                                              : "#0A56B3"
                                            : mode === "dark"
                                              ? "rgba(226,232,240,0.45)"
                                              : "rgba(51,65,85,0.45)",
                                          backgroundColor: !isAvailable
                                            ? mode === "dark"
                                              ? "rgba(15,23,42,0.25)"
                                              : "rgba(248,250,252,0.7)"
                                            : undefined
                                        })
                                  }}
                                >
                                  {formatTime12h(slot.time)}
                                </Button>

                                <Box
                                  sx={{
                                    minWidth: 110,
                                    textAlign: "right",
                                    fontWeight: 900,
                                    fontSize: "12px",
                                    color: isAvailable
                                      ? "#16a34a"
                                      : isReserved
                                        ? "#ef4444"
                                        : mode === "dark"
                                          ? "rgba(226, 232, 240, 0.55)"
                                          : "rgba(51, 65, 85, 0.6)"
                                  }}
                                >
                                  {isAvailable ? "Disponible" : isReserved ? "Ocupada" : "No reservable"}
                                  {isReserved && (reservedLabel || reservedCompany) ? (
                                    <div className="mt-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 text-right">
                                      {reservedLabel ? <div className="truncate">{reservedLabel}</div> : null}
                                      {reservedCompany ? <div className="truncate">{reservedCompany}</div> : null}
                                    </div>
                                  ) : null}
                                </Box>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} flexWrap="wrap">
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSaveEdit}
                    disabled={saving}
                    size="large"
                    className="font-semibold min-w-[160px]"
                    sx={{
                      background: "linear-gradient(135deg, #0E7CFF 0%, #0A56B3 100%)",
                      "&:hover": {
                        background: "linear-gradient(135deg, #0A56B3 0%, #083d85 100%)"
                      }
                    }}
                  >
                    {saving ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={() => setEditMode(false)}
                    size="large"
                    className="dark:border-slate-600 dark:text-slate-300"
                  >
                    Cancelar Edición
                  </Button>
                </Stack>
              </Box>
            ) : (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} flexWrap="wrap" className="gap-3">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    setEditMode(true);
                    loadAvailability(selectedRoom, selectedDate);
                  }}
                  size="large"
                  className="font-semibold min-w-[160px]"
                  sx={{
                    background: "linear-gradient(135deg, #0E7CFF 0%, #0A56B3 100%)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #0A56B3 0%, #083d85 100%)"
                    }
                  }}
                >
                  Editar Reserva
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setCancelDialog(true)}
                  size="large"
                  className="dark:border-red-600 dark:text-red-400 min-w-[160px]"
                  sx={{
                    borderWidth: 2,
                    "&:hover": {
                      borderWidth: 2,
                      backgroundColor: "rgba(239, 68, 68, 0.1)"
                    }
                  }}
                >
                  Cancelar Reserva
                </Button>
              </Stack>
            )}
          </div>
        </div>
      </Container>

      <Dialog 
        open={cancelDialog} 
        onClose={() => setCancelDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          className: "rounded-2xl"
        }}
      >
        <DialogTitle className="text-center pb-2">
          <Typography variant="h6" className="font-bold text-slate-900 dark:text-slate-100">
            Confirmar Cancelación
          </Typography>
        </DialogTitle>
        <DialogContent className="px-6">
          <Typography className="text-slate-700 dark:text-slate-300 mb-4">
            ¿Estás seguro de que deseas cancelar esta reserva?
          </Typography>
          <Box className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
            <Typography variant="body2" className="text-red-700 dark:text-red-400 font-semibold">
              ⚠️ Esta acción no se puede deshacer
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions className="px-6 pb-4 gap-2">
          <Button 
            onClick={() => setCancelDialog(false)}
            variant="outlined"
            className="dark:border-slate-600 dark:text-slate-300"
            fullWidth
          >
            No, mantener
          </Button>
          <Button 
            onClick={handleCancel} 
            color="error" 
            variant="contained" 
            disabled={saving}
            fullWidth
            className="font-semibold"
            sx={{
              background: saving ? undefined : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)"
              }
            }}
          >
            {saving ? "Cancelando..." : "Sí, cancelar"}
          </Button>
        </DialogActions>
      </Dialog>
    </main>
  );
}

