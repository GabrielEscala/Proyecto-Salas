"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  Box,
  Button,
  Container,
  Divider,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  TextField,
  Typography
} from "@mui/material";
import { toast, Toaster } from "sonner";
import dynamic from "next/dynamic";
import { generateTimeSlots, formatTime12h, getTodayString, isSlotInPast } from "@/lib/time";
import { useTheme } from "@/lib/theme-context";
import { ENABLE_FITUR } from "@/lib/constants";

const ManageBookingDialog = dynamic(() => import("@/components/manage-booking-dialog"), {
  ssr: false
});

const CodeModal = dynamic(() => import("@/components/code-modal"), {
  ssr: false
});

const slots = generateTimeSlots();

function CompanyCarousel({ value, onChange, mode }) {
  const companies = [
    { id: "Escalabeds", label: "Escalabeds" },
    { id: "Levruno", label: "Levruno" },
    { id: "Mah", label: "Mah" }
  ];

  return (
    <div className="w-full">
      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Empresa</p>
      <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {companies.map((c) => {
          const selected = value === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange?.(c.id)}
              className={
                "whitespace-nowrap px-4 py-2 rounded-full border text-sm font-extrabold transition-all " +
                (selected
                  ? "bg-brand text-white border-brand shadow-md"
                  : mode === "dark"
                    ? "border-slate-700 text-slate-100 hover:bg-slate-800"
                    : "border-slate-200 text-slate-800 hover:bg-slate-50")
              }
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CalendlyCalendar({ value, onChange, mode, todayString, timeZone }) {
  const [cursorMonth, setCursorMonth] = useState(() => parseISO(value));

  useEffect(() => {
    setCursorMonth(parseISO(value));
  }, [value]);

  const monthStart = startOfMonth(cursorMonth);
  const monthEnd = endOfMonth(cursorMonth);
  const startWeekday = monthStart.getDay();

  const days = useMemo(() => {
    const result = [];
    for (let i = 0; i < startWeekday; i += 1) result.push(null);
    for (let d = new Date(monthStart); !isAfter(d, monthEnd); d.setDate(d.getDate() + 1)) {
      result.push(new Date(d));
    }
    return result;
  }, [monthStart, monthEnd, startWeekday]);

  const dayButtonClass = (day) => {
    const dayString = day ? format(day, "yyyy-MM-dd") : "";
    const isSelected = !!dayString && dayString === value;
    const isOutside = day && !isSameMonth(day, cursorMonth);
    const isPast = !!dayString && !!todayString && dayString < todayString;
    const isToday = !!dayString && !!todayString && dayString === todayString;

    if (!day) return "";

    if (isSelected) {
      return "bg-brand text-white shadow-lg";
    }

    if (isPast || isOutside) {
      return "text-slate-300 dark:text-slate-600";
    }

    if (isToday) {
      return "ring-2 ring-brand/60 text-slate-900 dark:text-slate-100";
    }

    return "text-slate-800 dark:text-slate-100 hover:bg-brand/10 dark:hover:bg-brand/20";
  };

  const canSelect = (day) => {
    if (!day) return false;
    if (!isSameMonth(day, cursorMonth)) return false;
    const dayString = format(day, "yyyy-MM-dd");
    if (!todayString) return true;
    return dayString >= todayString;
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
              onChange(format(day, "yyyy-MM-dd"));
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

      <div className="mt-4">
        <div
          className={
            "rounded-xl border px-3 py-2 text-xs flex items-center justify-between " +
            (mode === "dark" ? "border-slate-700 bg-slate-800/50 text-slate-200" : "border-slate-200 bg-slate-50 text-slate-700")
          }
        >
          <span className="font-semibold">Zona horaria</span>
          <span className="font-bold">{timeZone === "Europe/Madrid" ? "España (Europe/Madrid)" : "Venezuela (America/Caracas)"}</span>
        </div>
      </div>
    </div>
  );
}

function BookingDetailsForm({ roomId, roomLabel, date, times, company, onCompanyChange, isFitur, onSuccess }) {
  const { mode } = useTheme();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [clients, setClients] = useState("");
  const [loading, setLoading] = useState(false);
  const [openCode, setOpenCode] = useState(false);

  const sortedTimes = useMemo(() => {
    const unique = [...new Set((times || []).filter(Boolean))];
    return unique.sort((a, b) => a.localeCompare(b));
  }, [times]);

  const submit = async (e) => {
    e.preventDefault();
    if (!roomId || !date || !sortedTimes.length) return;

    setLoading(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          firstName,
          lastName,
          email,
          company,
          clients: isFitur ? clients : "",
          date,
          times: sortedTimes
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        if (payload?.suggestion) {
          toast.error(payload?.error || "No pudimos reservar.");
          toast.message(`Sugerencia: ${payload.suggestion}`);
        } else {
          toast.error(payload?.error || "No pudimos reservar.");
        }
        return;
      }

      toast.success("Reserva confirmada");
      if (payload?.storage === "memory") {
        toast.warning(
          "Reserva guardada temporalmente (modo local). Configura Supabase para que quede guardada al reiniciar."
        );
      }
      onSuccess?.(payload);
    } catch {
      toast.error("No pudimos reservar. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" id="booking-form">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextField
          label="Nombre"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          fullWidth
          InputLabelProps={{ shrink: true }}
          sx={{
            "& .MuiOutlinedInput-root": { borderRadius: "14px" },
            "& .MuiInputBase-input": {
              fontSize: "16px",
              lineHeight: 1.5,
              padding: "14px 14px !important"
            }
          }}
        />

      {isFitur ? (
        <TextField
          label="Clientes"
          value={clients}
          onChange={(e) => setClients(e.target.value)}
          fullWidth
          InputLabelProps={{ shrink: true }}
          sx={{
            "& .MuiOutlinedInput-root": { borderRadius: "14px" },
            "& .MuiInputBase-input": {
              fontSize: "16px",
              lineHeight: 1.5,
              padding: "14px 14px !important"
            }
          }}
        />
      ) : null}
        <TextField
          label="Apellido"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
          fullWidth
          InputLabelProps={{ shrink: true }}
          sx={{
            "& .MuiOutlinedInput-root": { borderRadius: "14px" },
            "& .MuiInputBase-input": {
              fontSize: "16px",
              lineHeight: 1.5,
              padding: "14px 14px !important"
            }
          }}
        />
      </div>

      <TextField
        label="Empresa"
        value={company}
        InputProps={{ readOnly: true }}
        InputLabelProps={{ shrink: true }}
        required
        fullWidth
        sx={{
          "& .MuiOutlinedInput-root": { borderRadius: "14px" },
          "& .MuiInputBase-input": {
            fontSize: "16px",
            lineHeight: 1.5,
            padding: "14px 14px !important"
          }
        }}
      />

      <TextField
        label="Correo"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        required
        fullWidth
        InputLabelProps={{ shrink: true }}
        sx={{
          "& .MuiOutlinedInput-root": { borderRadius: "14px" },
          "& .MuiInputBase-input": {
            fontSize: "16px",
            lineHeight: 1.5,
            padding: "14px 14px !important"
          }
        }}
      />

      <div
        className={
          "rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 " +
          (mode === "dark" ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white")
        }
      >
        <div className="min-w-0">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Confirmación</p>
          <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100 truncate">
            {roomLabel} • {format(parseISO(date), "EEEE, d MMM", { locale: es })}
          </p>
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-1">
            {sortedTimes.length === 1
              ? formatTime12h(sortedTimes[0])
              : `${formatTime12h(sortedTimes[0])} - ${formatTime12h(sortedTimes[sortedTimes.length - 1])}`}
          </p>
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-1">
            {sortedTimes.length} bloques
          </p>
        </div>
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          sx={{
            height: 44,
            fontWeight: 900,
            textTransform: "none",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #0E7CFF 0%, #0A56B3 100%)",
            "&:hover": { background: "linear-gradient(135deg, #0A56B3 0%, #083d85 100%)" }
          }}
        >
          {loading ? "Reservando..." : "Confirmar reserva"}
        </Button>
      </div>
    </form>
  );
}

export default function CalendlyHome() {
  const { mode } = useTheme();

  const [group, setGroup] = useState("salas");
  const timeZone = group === "fitur" ? "Europe/Madrid" : "America/Caracas";
  const todayString = useMemo(() => getTodayString(new Date(), timeZone), [timeZone]);

  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayString);
  const [dayBookings, setDayBookings] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(true);

  const [selectedTimes, setSelectedTimes] = useState([]);
  const [confirmed, setConfirmed] = useState(false);

  const [company, setCompany] = useState("Escalabeds");

  const [showManageDialog, setShowManageDialog] = useState(false);

  const [bookingData, setBookingData] = useState(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [openAllReservations, setOpenAllReservations] = useState(false);

  const selectedRoomLabel =
    rooms.find((r) => (r.id ?? r.name) === selectedRoom)?.name || "";

  const fetchRooms = useCallback(async () => {
    const groupParam = ENABLE_FITUR ? `?group=${encodeURIComponent(group)}` : "";
    const res = await fetch(`/api/rooms${groupParam}`);
    const data = await res.json();
    setRooms(Array.isArray(data) ? data : []);
    const firstId = (Array.isArray(data) && data[0] && (data[0].id ?? data[0].name)) || "";
    setSelectedRoom((prev) => prev || firstId);
  }, [group]);

  const fetchBookings = useCallback(async () => {
    if (!selectedDate || !selectedRoom) {
      setDayBookings([]);
      setLoadingSlots(false);
      return;
    }

    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/bookings?date=${selectedDate}&roomId=${selectedRoom}`);
      const data = await res.json();
      setDayBookings(Array.isArray(data) ? data : []);
    } catch {
      setDayBookings([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedDate, selectedRoom]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    setSelectedTimes([]);
    setConfirmed(false);
    setSelectedDate(todayString);
  }, [todayString]);

  useEffect(() => {
    setSelectedTimes([]);
    setConfirmed(false);
    fetchBookings();
  }, [selectedDate, selectedRoom, fetchBookings]);

  const slotStates = useMemo(() => {
    const bookingsByTime = new Map(
      dayBookings.map((b) => [(b.time || "").slice(0, 5), b])
    );

    return slots.map((t) => {
      if (!selectedRoom) return { time: t, status: "invalid" };
      if (bookingsByTime.has(t)) return { time: t, status: "reserved", booking: bookingsByTime.get(t) };
      if (isSlotInPast(selectedDate, t, new Date(), timeZone)) return { time: t, status: "invalid" };
      return { time: t, status: "available" };
    });
  }, [dayBookings, selectedDate, selectedRoom, timeZone]);

  const reservationsForDay = useMemo(() => {
    const list = Array.isArray(dayBookings) ? dayBookings : [];
    return [...list]
      .map((b) => ({
        time: (b.time || "").slice(0, 5),
        first_name: b.first_name,
        last_name: b.last_name,
        company: b.company,
        cancel_code: b.cancel_code
      }))
      .filter((b) => !!b.time)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [dayBookings]);

  const openForm = () => {
    if (!selectedTimes.length) return;
    setConfirmed(true);
    requestAnimationFrame(() => {
      const el = document.getElementById("section-form");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const toggleTime = (time) => {
    setSelectedTimes((prev) => {
      const exists = prev.includes(time);
      const next = exists ? prev.filter((t) => t !== time) : [...prev, time];
      return next.sort((a, b) => a.localeCompare(b));
    });
    setConfirmed(false);
  };

  const selectedRangeLabel = useMemo(() => {
    if (!selectedTimes.length) return "";
    const sorted = [...selectedTimes].sort((a, b) => a.localeCompare(b));
    if (sorted.length === 1) return formatTime12h(sorted[0]);
    return `${formatTime12h(sorted[0])} - ${formatTime12h(sorted[sorted.length - 1])}`;
  }, [selectedTimes]);

  return (
    <main className="min-h-screen">
      <Toaster richColors position="top-right" />

      <Container maxWidth="lg" className="px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {(() => {
              const isMah = String(company || "").trim().toLowerCase() === "mah";
              const logoSrc = isMah ? "/logo-heart.svg" : "/logo-salas.svg";
              const logoAlt = isMah ? "MAH" : "SALAS";
              return (
                <img
                  src={logoSrc}
                  alt={logoAlt}
                  className="h-9 w-auto"
                  style={{
                    height: 36,
                    width: "auto",
                    maxHeight: 36,
                    filter: mode === "dark" ? "brightness(1.1)" : "none"
                  }}
                />
              );
            })()}
          </div>
          <Button
            variant="outlined"
            onClick={() => setShowManageDialog(true)}
            sx={{
              fontWeight: 900,
              textTransform: "none",
              borderRadius: "999px",
              px: 2.5,
              height: 42,
              borderWidth: 2,
              borderColor: mode === "dark" ? "rgba(148,163,184,0.35)" : "rgba(148,163,184,0.65)",
              color: mode === "dark" ? "#e2e8f0" : "#0f172a",
              "&:hover": {
                borderWidth: 2,
                borderColor: "rgba(14, 124, 255, 0.65)",
                backgroundColor: mode === "dark" ? "rgba(14,124,255,0.12)" : "rgba(14,124,255,0.06)"
              }
            }}
          >
            Gestionar reserva
          </Button>
        </div>

        <div
          className={
            "rounded-3xl overflow-hidden border bg-white/90 dark:bg-slate-900/80 shadow-xl backdrop-blur-sm " +
            (mode === "dark" ? "border-slate-800" : "border-slate-200/70")
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-3">
            {/* Left panel */}
            <div className={"p-6 md:p-7 border-b md:border-b-0 md:border-r " + (mode === "dark" ? "border-slate-800" : "border-slate-200/70")}>
              <div className="flex items-center gap-3 mb-6">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Reserva</p>
                  <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100 truncate">Sala de Reunión</p>
                </div>
              </div>

              <div className="space-y-4">
                <CompanyCarousel value={company} onChange={setCompany} mode={mode} />

                {ENABLE_FITUR ? (
                  <div className={"rounded-2xl border p-2 flex gap-2 " + (mode === "dark" ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white")}
                  >
                    <Button
                      variant={group === "salas" ? "contained" : "outlined"}
                      onClick={() => {
                        setGroup("salas");
                        setSelectedRoom("");
                      }}
                      sx={{
                        flex: 1,
                        height: 42,
                        fontWeight: 900,
                        textTransform: "none",
                        borderRadius: "14px",
                        background: group === "salas" ? "linear-gradient(135deg, #0E7CFF 0%, #0A56B3 100%)" : undefined
                      }}
                    >
                      Caracas
                    </Button>
                    <Button
                      variant={group === "fitur" ? "contained" : "outlined"}
                      onClick={() => {
                        setGroup("fitur");
                        setSelectedRoom("");
                      }}
                      sx={{
                        flex: 1,
                        height: 42,
                        fontWeight: 900,
                        textTransform: "none",
                        borderRadius: "14px",
                        background: group === "fitur" ? "linear-gradient(135deg, #0E7CFF 0%, #0A56B3 100%)" : undefined
                      }}
                    >
                      Fitur
                    </Button>
                  </div>
                ) : null}

                <FormControl fullWidth>
                  <InputLabel id="room-label">{group === "fitur" ? "Espacio" : "Sala"}</InputLabel>
                  <Select
                    labelId="room-select"
                    value={selectedRoom}
                    label={group === "fitur" ? "Espacio" : "Sala"}
                    onChange={(e) => setSelectedRoom(e.target.value)}
                    displayEmpty
                    renderValue={(val) => {
                      if (!val) return "Selecciona una sala";
                      return selectedRoomLabel || String(val);
                    }}
                    MenuProps={{
                      disableScrollLock: true,
                      PaperProps: {
                        sx: {
                          maxHeight: 360,
                          overflowY: "auto",
                          borderRadius: "16px",
                          mt: 1
                        }
                      },
                      MenuListProps: {
                        sx: {
                          py: 0
                        }
                      }
                    }}
                    sx={{
                      borderRadius: "16px",
                      height: 52,
                      background: mode === "dark" ? "rgba(15,23,42,0.35)" : "rgba(255,255,255,0.9)",
                      boxShadow: mode === "dark" ? "0 2px 10px rgba(0,0,0,0.35)" : "0 2px 10px rgba(0,0,0,0.08)",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderWidth: 2,
                        borderColor: mode === "dark" ? "rgba(148,163,184,0.35)" : "rgba(148,163,184,0.55)"
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(14, 124, 255, 0.65)"
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(14, 124, 255, 0.9)"
                      }
                    }}
                  >
                    <MenuItem value="" disabled>
                      {group === "fitur" ? "Selecciona un espacio" : "Selecciona una sala"}
                    </MenuItem>
                    {rooms.map((r) => (
                      <MenuItem key={r.id ?? r.name} value={r.id ?? r.name}>
                        {r.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <div className={"rounded-2xl border p-4 " + (mode === "dark" ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white")}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">30 min</p>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Zoom</p>
                  </div>
                  <Divider className="my-3" />
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Seleccionado</p>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                    {selectedRoomLabel || "—"}
                  </p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {selectedDate ? format(parseISO(selectedDate), "EEEE, d MMM", { locale: es }) : ""}
                    {selectedRangeLabel ? ` • ${selectedRangeLabel}` : ""}
                  </p>
                  {selectedTimes.length ? (
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                      {selectedTimes.length} bloque(s) seleccionado(s)
                    </p>
                  ) : null}
                </div>

                <div className={"rounded-2xl border p-4 " + (mode === "dark" ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white")}>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Nota</p>
                  <p className="text-sm text-slate-700 dark:text-slate-200 mt-1">
                    Selecciona una fecha y una hora para continuar.
                  </p>
                </div>

                <div className={"rounded-2xl border p-4 " + (mode === "dark" ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white")}>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Reservas del día</p>
                  {reservationsForDay.length ? (
                    <div className="mt-3 space-y-2">
                      {reservationsForDay.slice(0, 6).map((b) => (
                        <div key={`${b.time}-${b.first_name}-${b.last_name}`} className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                              {formatTime12h(b.time)}
                            </p>
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">
                              {b.first_name} {b.last_name}
                            </p>
                            {b.company ? (
                              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">
                                {b.company}
                              </p>
                            ) : null}
                          </div>
                          <div className="text-xs font-extrabold text-rose-500">Ocupada</div>
                        </div>
                      ))}
                      {reservationsForDay.length > 6 ? (
                        <div className="pt-2">
                          <Button
                            variant="text"
                            size="small"
                            onClick={() => setOpenAllReservations(true)}
                            sx={{
                              textTransform: "none",
                              fontWeight: 900,
                              padding: 0,
                              minWidth: 0
                            }}
                          >
                            Ver todas las reservas
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Sin reservas para esta sala.</p>
                  )}
                </div>
              </div>
            </div>

            <Dialog
              open={openAllReservations}
              onClose={() => setOpenAllReservations(false)}
              fullWidth
              maxWidth="sm"
            >
              <DialogTitle sx={{ fontWeight: 900 }}>Reservas del día</DialogTitle>
              <DialogContent dividers sx={{ p: 2 }}>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                  {reservationsForDay.map((b) => (
                    <div key={`${b.time}-${b.first_name}-${b.last_name}-full`} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                          {formatTime12h(b.time)}
                        </p>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">
                          {b.first_name} {b.last_name}
                        </p>
                        {b.company ? (
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">
                            {b.company}
                          </p>
                        ) : null}
                      </div>
                      <div className="text-xs font-extrabold text-rose-500">Ocupada</div>
                    </div>
                  ))}
                </div>

                <div className="mt-3">
                  <Button
                    onClick={() => setOpenAllReservations(false)}
                    variant="contained"
                    fullWidth
                    sx={{
                      height: 44,
                      fontWeight: 900,
                      textTransform: "none",
                      borderRadius: "14px",
                      background: "linear-gradient(135deg, #0E7CFF 0%, #0A56B3 100%)",
                      "&:hover": { background: "linear-gradient(135deg, #0A56B3 0%, #083d85 100%)" }
                    }}
                  >
                    Cerrar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Calendar panel */}
            <div className={"p-6 md:p-7 border-b md:border-b-0 md:border-r " + (mode === "dark" ? "border-slate-800" : "border-slate-200/70")}>
              <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mb-2">Selecciona una fecha</p>
              <CalendlyCalendar value={selectedDate} onChange={setSelectedDate} mode={mode} todayString={todayString} timeZone={timeZone} />
            </div>

            {/* Time panel */}
            <div className="p-6 md:p-7">
              <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mb-2">Selecciona un horario</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                {format(parseISO(selectedDate), "EEEE, d MMM", { locale: es })}
              </p>

              {loadingSlots ? (
                <Skeleton variant="rounded" height={520} className="rounded-2xl" />
              ) : (
                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
                  {slotStates.map((slot) => {
                    const isSelected = selectedTimes.includes(slot.time);
                    const isAvailable = slot.status === "available";
                    const isReserved = slot.status === "reserved";
                    const reservedLabel = isReserved
                      ? `${slot.booking?.first_name || ""} ${slot.booking?.last_name || ""}`.trim()
                      : "";
                    const reservedCompany = isReserved ? slot.booking?.company : null;
                    const reservedClients = isReserved ? slot.booking?.clients : null;

                    return (
                      <div key={slot.time} className="flex items-center gap-2">
                        <Button
                          variant={isSelected ? "contained" : "outlined"}
                          disabled={!isAvailable}
                          onClick={() => {
                            if (!isAvailable) return;
                            toggleTime(slot.time);
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
                                  borderColor: isAvailable ? "rgba(14, 124, 255, 0.35)" : "rgba(148, 163, 184, 0.25)",
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
                          {isReserved && (reservedLabel || reservedCompany || reservedClients) ? (
                            <div className="mt-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 text-right">
                              {reservedLabel ? <div className="truncate">{reservedLabel}</div> : null}
                              {reservedCompany ? <div className="truncate">{reservedCompany}</div> : null}
                              {reservedClients ? <div className="truncate">Clientes: {reservedClients}</div> : null}
                            </div>
                          ) : null}
                        </Box>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-5">
                <Button
                  variant="contained"
                  fullWidth
                  disabled={!selectedTimes.length}
                  onClick={openForm}
                  sx={{
                    height: 46,
                    fontWeight: 900,
                    textTransform: "none",
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, #0E7CFF 0%, #0A56B3 100%)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #0A56B3 0%, #083d85 100%)"
                    }
                  }}
                >
                  {selectedTimes.length
                    ? `Confirmar (${selectedTimes.length})`
                    : "Confirmar"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div id="section-form" className="mt-8">
          {confirmed && selectedRoom && selectedTimes.length ? (
            <div className={"rounded-3xl border bg-white dark:bg-slate-900 shadow-2xl p-6 md:p-7 " + (mode === "dark" ? "border-slate-800" : "border-slate-200")}>
              <Typography
                variant="h6"
                className="font-extrabold"
                sx={{ color: mode === "dark" ? "#e2e8f0" : "#0f172a" }}
              >
                Completa tus datos
              </Typography>
              <Typography
                variant="body2"
                className="mt-1"
                sx={{ color: mode === "dark" ? "#94a3b8" : "#475569" }}
              >
                Completa tus datos para confirmar la reserva.
              </Typography>

              <div className="mt-5">
                <BookingDetailsForm
                  roomId={selectedRoom}
                  roomLabel={selectedRoomLabel}
                  date={selectedDate}
                  times={selectedTimes}
                  company={company}
                  onCompanyChange={setCompany}
                  isFitur={group === "fitur"}
                  onSuccess={(payload) => {
                    const cancelCode = payload?.cancel_code;
                    const cancelUrl = payload?.cancel_url;
                    setBookingData({
                      cancelCode,
                      cancelUrl,
                      roomName: payload?.room_name || selectedRoomLabel,
                      timeRange: payload?.time_range,
                      date: payload?.date || selectedDate
                    });
                    if (cancelCode) {
                      setShowCodeModal(true);
                    }
                    setConfirmed(false);
                    setSelectedTimes([]);
                    fetchBookings();
                  }}
                />
              </div>
            </div>
          ) : null}
        </div>

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

        <ManageBookingDialog open={showManageDialog} onClose={() => setShowManageDialog(false)} />

        <div className="mt-6 flex justify-end">
          <Button
            variant="outlined"
            onClick={() => {
              window.location.href = "/history";
            }}
            sx={{
              fontWeight: 900,
              textTransform: "none",
              borderRadius: "999px",
              px: 2.5,
              height: 42,
              borderWidth: 2,
              borderColor: mode === "dark" ? "rgba(148,163,184,0.35)" : "rgba(148,163,184,0.65)",
              color: mode === "dark" ? "#e2e8f0" : "#0f172a",
              "&:hover": {
                borderWidth: 2,
                borderColor: "rgba(14, 124, 255, 0.65)",
                backgroundColor: mode === "dark" ? "rgba(14,124,255,0.12)" : "rgba(14,124,255,0.06)"
              }
            }}
          >
            Historial
          </Button>
        </div>
      </Container>
    </main>
  );
}
