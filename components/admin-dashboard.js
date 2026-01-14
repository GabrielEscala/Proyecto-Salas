"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  TextField,
  Divider,
  InputAdornment,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useTheme } from "@/lib/theme-context";

const todayISO = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export default function AdminDashboard() {
  const { mode } = useTheme();
  const router = useRouter();
  const [date, setDate] = useState(todayISO());
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  const load = async () => {
    if (!date) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings?date=${encodeURIComponent(date)}`);
      if (!res.ok) {
        setBookings([]);
        return;
      }
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [date]);

  const blocks = useMemo(() => {
    const byCode = new Map();
    for (const b of Array.isArray(bookings) ? bookings : []) {
      const code = String(b?.cancel_code || "").trim();
      if (!code) continue;
      if (!byCode.has(code)) {
        byCode.set(code, {
          cancel_code: code,
          room_name: b?.room_name || "—",
          room_id: b?.room_id || null,
          date: b?.date || date,
          first_name: b?.first_name || "",
          last_name: b?.last_name || "",
          company: b?.company || "",
          times: []
        });
      }
      const item = byCode.get(code);
      const t = String(b?.time || "").slice(0, 5);
      if (t) item.times.push(t);
    }

    return Array.from(byCode.values())
      .map((x) => ({ ...x, times: [...new Set(x.times)].sort((a, b) => a.localeCompare(b)) }))
      .sort((a, b) => String(a.room_name || "").localeCompare(String(b.room_name || "")));
  }, [bookings, date]);

  const filteredBlocks = useMemo(() => {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return blocks;
    return blocks.filter((b) => {
      const name = `${b.first_name || ""} ${b.last_name || ""}`.trim().toLowerCase();
      const room = String(b.room_name || "").toLowerCase();
      const company = String(b.company || "").toLowerCase();
      const code = String(b.cancel_code || "").toLowerCase();
      return code.includes(q) || name.includes(q) || room.includes(q) || company.includes(q);
    });
  }, [blocks, query]);

  const stats = useMemo(() => {
    const totalSlots = (Array.isArray(bookings) ? bookings : []).length;
    const totalBlocks = blocks.length;
    const uniqueRooms = new Set(blocks.map((b) => b.room_name).filter(Boolean)).size;
    return { totalSlots, totalBlocks, uniqueRooms };
  }, [bookings, blocks]);

  const logout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 5,
          overflow: "hidden",
          border: `1px solid ${mode === "dark" ? "rgba(148,163,184,0.14)" : "rgba(148,163,184,0.24)"}`,
          background:
            mode === "dark"
              ? "linear-gradient(135deg, rgba(2,6,23,0.9) 0%, rgba(15,23,42,0.65) 100%)"
              : "linear-gradient(135deg, rgba(14,124,255,0.12) 0%, rgba(255,255,255,0.95) 55%, rgba(2,6,23,0.03) 100%)"
        }}
      >
        <Box sx={{ px: { xs: 3, md: 4 }, py: { xs: 3, md: 4 } }}>
          <Box sx={{ display: "flex", alignItems: { xs: "flex-start", md: "center" }, justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
            <Box sx={{ minWidth: 240 }}>
              <Typography
                variant="overline"
                sx={{
                  fontWeight: 900,
                  letterSpacing: "0.12em",
                  color: mode === "dark" ? "rgba(226,232,240,0.6)" : "rgba(51,65,85,0.7)"
                }}
              >
                Panel
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  mt: 0.5,
                  fontWeight: 900,
                  lineHeight: 1.05,
                  color: mode === "dark" ? "#e2e8f0" : "#0f172a"
                }}
              >
                Administrador de Reservas
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mt: 1,
                  maxWidth: 560,
                  color: mode === "dark" ? "rgba(226,232,240,0.7)" : "rgba(51,65,85,0.75)"
                }}
              >
                Visualiza y abre bloques por código de cancelación para editarlos.
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
              <Button
                variant="outlined"
                onClick={logout}
                sx={{
                  borderRadius: 999,
                  height: 40,
                  px: 2.25,
                  fontWeight: 900,
                  textTransform: "none",
                  borderWidth: 2
                }}
              >
                Salir
              </Button>
            </Box>
          </Box>

          <Box
            sx={{
              mt: { xs: 3, md: 4 },
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
              gap: 2
            }}
          >
            <Paper
              elevation={0}
              sx={{
                borderRadius: 4,
                p: 2.25,
                border: `1px solid ${mode === "dark" ? "rgba(148,163,184,0.14)" : "rgba(148,163,184,0.24)"}`,
                backgroundColor: mode === "dark" ? "rgba(2,6,23,0.35)" : "rgba(255,255,255,0.85)"
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 900, color: mode === "dark" ? "rgba(226,232,240,0.65)" : "rgba(51,65,85,0.7)" }}>
                Bloques
              </Typography>
              <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 900, color: mode === "dark" ? "#e2e8f0" : "#0f172a" }}>
                {stats.totalBlocks}
              </Typography>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                borderRadius: 4,
                p: 2.25,
                border: `1px solid ${mode === "dark" ? "rgba(148,163,184,0.14)" : "rgba(148,163,184,0.24)"}`,
                backgroundColor: mode === "dark" ? "rgba(2,6,23,0.35)" : "rgba(255,255,255,0.85)"
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 900, color: mode === "dark" ? "rgba(226,232,240,0.65)" : "rgba(51,65,85,0.7)" }}>
                Reservas (slots)
              </Typography>
              <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 900, color: mode === "dark" ? "#e2e8f0" : "#0f172a" }}>
                {stats.totalSlots}
              </Typography>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                borderRadius: 4,
                p: 2.25,
                border: `1px solid ${mode === "dark" ? "rgba(148,163,184,0.14)" : "rgba(148,163,184,0.24)"}`,
                backgroundColor: mode === "dark" ? "rgba(2,6,23,0.35)" : "rgba(255,255,255,0.85)"
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 900, color: mode === "dark" ? "rgba(226,232,240,0.65)" : "rgba(51,65,85,0.7)" }}>
                Salas
              </Typography>
              <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 900, color: mode === "dark" ? "#e2e8f0" : "#0f172a" }}>
                {stats.uniqueRooms}
              </Typography>
            </Paper>
          </Box>
        </Box>

        <Divider sx={{ borderColor: mode === "dark" ? "rgba(148,163,184,0.14)" : "rgba(148,163,184,0.22)" }} />

        <Box
          sx={{
            px: { xs: 3, md: 4 },
            py: 3,
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
            <TextField
              type="date"
              label="Fecha"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 190 }}
            />

            <TextField
              label="Buscar"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Código, sala, nombre, empresa..."
              sx={{ minWidth: { xs: 260, md: 360 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        backgroundColor: mode === "dark" ? alpha("#0E7CFF", 0.9) : alpha("#0E7CFF", 0.85)
                      }}
                    />
                  </InputAdornment>
                )
              }}
            />

            {query ? (
              <Chip
                label={`${filteredBlocks.length} resultados`}
                size="small"
                sx={{
                  fontWeight: 900,
                  backgroundColor: mode === "dark" ? "rgba(14,124,255,0.18)" : "rgba(14,124,255,0.12)",
                  color: mode === "dark" ? "rgba(226,232,240,0.9)" : "rgba(2,6,23,0.8)",
                  borderRadius: 999
                }}
              />
            ) : null}
          </Box>

          <Button
            variant="contained"
            onClick={load}
            disabled={loading}
            sx={{
              borderRadius: 999,
              height: 44,
              px: 3,
              fontWeight: 900,
              textTransform: "none",
              boxShadow: mode === "dark" ? "0 14px 35px rgba(0,0,0,0.45)" : "0 14px 35px rgba(2, 6, 23, 0.18)",
              background: "linear-gradient(135deg, #0E7CFF 0%, #0A56B3 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #0A56B3 0%, #083d85 100%)"
              }
            }}
          >
            {loading ? "Cargando..." : "Refrescar"}
          </Button>
        </Box>

        <Box sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 920 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 900, py: 1.5 }}>Código</TableCell>
                <TableCell sx={{ fontWeight: 900, py: 1.5 }}>Sala</TableCell>
                <TableCell sx={{ fontWeight: 900, py: 1.5 }}>Nombre</TableCell>
                <TableCell sx={{ fontWeight: 900, py: 1.5 }}>Empresa</TableCell>
                <TableCell sx={{ fontWeight: 900, py: 1.5 }}>Horas</TableCell>
                <TableCell sx={{ fontWeight: 900, py: 1.5, width: 190 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredBlocks.length ? (
                filteredBlocks.map((b) => (
                  <TableRow key={b.cancel_code} hover>
                    <TableCell
                      sx={{
                        fontFamily:
                          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                        fontWeight: 900
                      }}
                    >
                      {b.cancel_code}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>{b.room_name}</TableCell>
                    <TableCell>{`${b.first_name || ""} ${b.last_name || ""}`.trim() || "—"}</TableCell>
                    <TableCell>{b.company || "—"}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                        {b.times.map((t) => (
                          <Chip
                            key={t}
                            label={t}
                            size="small"
                            sx={{
                              fontWeight: 900,
                              borderRadius: 999,
                              backgroundColor: mode === "dark" ? "rgba(148,163,184,0.16)" : "rgba(148,163,184,0.18)"
                            }}
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        onClick={() => router.push(`/manage/${b.cancel_code}`)}
                        sx={{
                          borderRadius: 999,
                          fontWeight: 900,
                          textTransform: "none",
                          height: 36,
                          px: 2,
                          boxShadow: "none",
                          background: "linear-gradient(135deg, #0E7CFF 0%, #0A56B3 100%)",
                          "&:hover": {
                            boxShadow: "none",
                            background: "linear-gradient(135deg, #0A56B3 0%, #083d85 100%)"
                          }
                        }}
                      >
                        Gestionar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 4, textAlign: "center", color: mode === "dark" ? "rgba(226,232,240,0.65)" : "rgba(51,65,85,0.65)" }}>
                    No hay reservas para esta fecha.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Paper>
    </Container>
  );
}
