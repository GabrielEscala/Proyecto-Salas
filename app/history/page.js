"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO, subDays } from "date-fns";
import { es } from "date-fns/locale";
import {
  Box,
  Button,
  Container,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  TextField,
  Typography
} from "@mui/material";
import { toast, Toaster } from "sonner";
import { useTheme } from "@/lib/theme-context";
import { formatTime12h } from "@/lib/time";
import { ENABLE_FITUR } from "@/lib/constants";

export default function HistoryPage() {
  const { mode } = useTheme();

  const [group, setGroup] = useState("salas");

  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState("");

  const selectedRoomLabel =
    rooms.find((r) => (r.id ?? r.name) === selectedRoom)?.name || "";

  const [from, setFrom] = useState(() => format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [to, setTo] = useState(() => format(new Date(), "yyyy-MM-dd"));

  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  const loadRooms = useCallback(async () => {
    setLoadingRooms(true);
    try {
      const groupParam = `?group=${encodeURIComponent(group)}`;
      const response = await fetch(`/api/rooms${groupParam}`);
      const data = await response.json();
      const list = Array.isArray(data) ? data : [];
      setRooms(list);
    } catch {
      setRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  }, [group]);

  const loadHistory = useCallback(async () => {
    if (!from || !to) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("from", from);
      params.set("to", to);
      params.set("group", group);
      if (selectedRoom) params.set("roomId", selectedRoom);

      const response = await fetch(`/api/bookings/history?${params.toString()}`);
      const payload = await response.json();

      if (!response.ok) {
        toast.error(payload?.error || "No se pudo cargar el historial.");
        setItems([]);
        return;
      }

      setItems(Array.isArray(payload) ? payload : []);
    } catch {
      toast.error("No se pudo cargar el historial.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [from, to, selectedRoom, group]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const grouped = useMemo(() => {
    const list = Array.isArray(items) ? items : [];
    const map = new Map();

    for (const b of list) {
      const key = String(b.date || "");
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(b);
    }

    const keys = Array.from(map.keys()).sort((a, b) => String(b).localeCompare(String(a)));
    return keys.map((k) => ({
      date: k,
      label: k ? format(parseISO(k), "EEEE, d MMM yyyy", { locale: es }) : "",
      items: (map.get(k) || []).slice().sort((a, b) => String(a.time || "").localeCompare(String(b.time || "")))
    }));
  }, [items]);

  const exportCsv = useCallback(() => {
    const list = Array.isArray(items) ? items : [];
    if (!list.length) {
      toast.error("No hay reservas para exportar.");
      return;
    }

    const escape = (value) => {
      const v = String(value ?? "");
      return `"${v.replace(/"/g, '""')}"`;
    };

    const header = [
      "Fecha",
      "Hora",
      "Nombre",
      "Apellido",
      "Empresa",
      "Clientes",
      "Sala"
    ];

    const rows = list.map((b) => [
      b.date || "",
      b.time || "",
      b.first_name || "",
      b.last_name || "",
      b.company || "",
      b.clients || "",
      b.room_name || ""
    ]);

    const csv = "\ufeff" + [header, ...rows].map((r) => r.map(escape).join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historial_${from || ""}_a_${to || ""}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [items, from, to]);

  return (
    <main className="min-h-screen">
      <Toaster richColors position="top-right" />

      <Container maxWidth="lg" className="px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img
              src="/logo-salas.svg"
              alt="SALAS"
              className="h-9 w-auto"
              style={{
                height: 36,
                width: "auto",
                maxHeight: 36,
                filter: mode === "dark" ? "brightness(1.1)" : "none"
              }}
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Historial</p>
              <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100 truncate">Reservas anteriores</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outlined"
              onClick={exportCsv}
              disabled={!items.length}
              sx={{
                fontWeight: 900,
                textTransform: "none",
                borderRadius: "12px",
                borderWidth: 2
              }}
            >
              Exportar Excel
            </Button>
            <Button
              variant="text"
              onClick={() => {
                window.location.href = "/";
              }}
              sx={{
                fontWeight: 800,
                textTransform: "none",
                borderRadius: "12px",
                color: mode === "dark" ? "#e2e8f0" : "#0f172a"
              }}
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
          <div className="grid grid-cols-1 md:grid-cols-3">
            <div className={"p-6 md:p-7 border-b md:border-b-0 md:border-r " + (mode === "dark" ? "border-slate-800" : "border-slate-200/70")}>
              <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mb-4">Filtros</p>

              {loadingRooms ? (
                <Skeleton variant="rounded" height={168} className="rounded-2xl" />
              ) : (
                <div className="space-y-4">
                  <div
                    className={
                      "rounded-2xl border p-2 flex gap-2 " +
                      (mode === "dark" ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white")
                    }
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
                        background:
                          group === "salas" ? "linear-gradient(135deg, #0E7CFF 0%, #0A56B3 100%)" : undefined
                      }}
                    >
                      Caracas
                    </Button>

                    <Button
                      variant={group === "mallorca" ? "contained" : "outlined"}
                      onClick={() => {
                        setGroup("mallorca");
                        setSelectedRoom("");
                      }}
                      sx={{
                        flex: 1,
                        height: 42,
                        fontWeight: 900,
                        textTransform: "none",
                        borderRadius: "14px",
                        background:
                          group === "mallorca"
                            ? "linear-gradient(135deg, #0E7CFF 0%, #0A56B3 100%)"
                            : undefined
                      }}
                    >
                      Mallorca
                    </Button>

                    {ENABLE_FITUR ? (
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
                          background:
                            group === "fitur" ? "linear-gradient(135deg, #0E7CFF 0%, #0A56B3 100%)" : undefined
                        }}
                      >
                        Fitur
                      </Button>
                    ) : null}
                  </div>

                  <FormControl fullWidth>
                    <InputLabel id="history-room">{group === "fitur" ? "Espacio" : "Sala"}</InputLabel>
                    <Select
                      labelId="history-room"
                      value={selectedRoom}
                      label={group === "fitur" ? "Espacio" : "Sala"}
                      onChange={(e) => setSelectedRoom(e.target.value)}
                      displayEmpty
                      renderValue={(val) => {
                        if (!val) return "Todas";
                        return selectedRoomLabel || String(val);
                      }}
                      MenuProps={{
                        disableScrollLock: true,
                        PaperProps: { sx: { maxHeight: 360, overflowY: "auto", borderRadius: "16px", mt: 1 } },
                        MenuListProps: { sx: { py: 0 } }
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
                      <MenuItem value="">Todas</MenuItem>
                      {rooms.map((r) => (
                        <MenuItem key={r.id ?? r.name} value={r.id ?? r.name}>
                          {r.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <TextField
                      label="Desde"
                      type="date"
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      sx={{
                        "& .MuiOutlinedInput-root": { borderRadius: "14px" },
                        "& .MuiInputBase-input": { fontSize: "16px", lineHeight: 1.5, padding: "14px 14px !important" }
                      }}
                    />
                    <TextField
                      label="Hasta"
                      type="date"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      sx={{
                        "& .MuiOutlinedInput-root": { borderRadius: "14px" },
                        "& .MuiInputBase-input": { fontSize: "16px", lineHeight: 1.5, padding: "14px 14px !important" }
                      }}
                    />
                  </div>

                  <Button
                    variant="contained"
                    fullWidth
                    onClick={loadHistory}
                    disabled={loading || !from || !to}
                    sx={{
                      height: 46,
                      fontWeight: 900,
                      textTransform: "none",
                      borderRadius: "14px",
                      background: "linear-gradient(135deg, #0E7CFF 0%, #0A56B3 100%)",
                      "&:hover": { background: "linear-gradient(135deg, #0A56B3 0%, #083d85 100%)" }
                    }}
                  >
                    {loading ? "Cargando..." : "Buscar"}
                  </Button>

                  <div className={"rounded-2xl border p-4 " + (mode === "dark" ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white")}>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Rango</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                      {from ? format(parseISO(from), "d MMM yyyy", { locale: es }) : "—"} — {to ? format(parseISO(to), "d MMM yyyy", { locale: es }) : "—"}
                    </p>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                      {items.length} reserva(s)
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 md:p-7 md:col-span-2">
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Resultados</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Se muestran reservas guardadas en Supabase (días anteriores incluidos).
                  </p>
                </div>
              </div>

              <Divider className="my-4" />

              {loading ? (
                <Skeleton variant="rounded" height={520} className="rounded-2xl" />
              ) : grouped.length ? (
                <div className="space-y-4">
                  {grouped.map((g) => (
                    <div
                      key={g.date}
                      className={
                        "rounded-2xl border p-4 " +
                        (mode === "dark" ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white")
                      }
                    >
                      <Typography
                        variant="subtitle2"
                        className="font-extrabold"
                        sx={{ color: mode === "dark" ? "#e2e8f0" : "#0f172a" }}
                      >
                        {g.label}
                      </Typography>

                      <div className="mt-3 space-y-2">
                        {g.items.map((b) => (
                          <div key={`${b.id}-${b.time}`} className="flex items-start justify-between gap-3">
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
                              {b.clients ? (
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">
                                  Clientes: {b.clients}
                                </p>
                              ) : null}
                            </div>

                            <div className="text-right">
                              <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
                                {b.room_name || "—"}
                              </p>
                              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                {b.cancel_code || ""}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={"rounded-2xl border p-5 " + (mode === "dark" ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white")}>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Sin resultados</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Prueba con otro rango de fechas o sala.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
