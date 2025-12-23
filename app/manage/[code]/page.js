"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  CircularProgress
} from "@mui/material";
import { toast, Toaster } from "sonner";
import RoomSelector from "@/components/room-selector";
import DatePickerCalendar from "@/components/date-picker";
import TimeSlots from "@/components/time-slots";
import { generateTimeSlots, isSlotInPast, formatTime12h } from "@/lib/time";
import { isValidCancelCode } from "@/lib/codes";
import ThemeToggle from "@/components/theme-toggle";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const slots = generateTimeSlots();

export default function ManageBookingPage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code;
  const today = new Date().toISOString().split("T")[0];

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

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
    try {
      const response = await fetch("/api/rooms");
      const data = await response.json();
      setRooms(data);
    } catch (error) {
      console.error(error);
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

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "No se pudo cancelar la reserva");
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
  const startTime = booking[0].time?.slice(0, 5) || "";
  const endTime = booking[booking.length - 1].time?.slice(0, 5) || "";
  const timeRange = booking.length > 1
    ? `${formatTime12h(startTime)} - ${formatTime12h(endTime)}`
    : formatTime12h(startTime);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 pb-12 transition-colors duration-200">
      <Toaster richColors position="top-center" />
      <Container maxWidth="lg" className="px-4 py-6 md:px-6 md:py-8">
        {/* Header */}
        <Box className="mb-6 flex items-center justify-between">
          <Button
            startIcon={<ArrowBackIcon aria-hidden="true" />}
            onClick={() => router.push("/")}
            className="dark:text-slate-300"
            aria-label="Volver a la página principal"
          >
            Volver
          </Button>
          <ThemeToggle />
        </Box>

        <Card className="border-2 border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
          <CardContent className="p-6 md:p-8 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
            {/* Título y código */}
            <Box className="mb-6">
              <Typography variant="h4" className="mb-3 font-bold text-slate-900 dark:text-slate-100">
                Gestionar Reserva
              </Typography>
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
              className="mb-6 border-2 border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-700/50 dark:to-slate-800/50"
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
                      Sala
                    </Typography>
                    <Typography className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
                      {firstBooking.room_name}
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
                <div className="grid gap-4 md:grid-cols-2">
                  <RoomSelector rooms={rooms} value={selectedRoom} onChange={setSelectedRoom} />
                  <DatePickerCalendar value={selectedDate} onChange={setSelectedDate} />
                </div>
                <Card variant="outlined" className="border-2 border-slate-200 dark:border-slate-700 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
                  <CardContent className="p-5">
                    <Typography variant="subtitle1" className="mb-4 font-semibold text-slate-900 dark:text-slate-100">
                      Selecciona nuevos horarios
                    </Typography>
                    <TimeSlots
                      slots={slots}
                      slotStates={slots.map(slot => ({
                        time: slot,
                        status: isSlotInPast(selectedDate, slot) ? "invalid" : "available",
                        selected: selectedSlots.includes(slot)
                      }))}
                      selectedSlots={selectedSlots}
                      onToggle={(slot) => {
                        setSelectedSlots(prev =>
                          prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot].sort()
                        );
                      }}
                    />
                  </CardContent>
                </Card>
                <Stack direction="row" spacing={2} flexWrap="wrap">
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
              <Stack direction="row" spacing={2} flexWrap="wrap" className="gap-3">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setEditMode(true)}
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
          </CardContent>
        </Card>
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

