"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  Typography,
  Alert,
  Box
} from "@mui/material";
import { useRouter } from "next/navigation";
import { isValidCancelCode } from "@/lib/codes";
import { useTheme } from "@/lib/theme-context";

export default function ManageBookingDialog({ open, onClose }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { mode } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!code.trim()) {
      setError("Por favor ingresa un código");
      return;
    }

    const trimmedCode = code.trim().toUpperCase();

    if (!isValidCancelCode(trimmedCode)) {
      setError("Formato de código inválido. Debe ser: CXL-XXXXXXXX");
      return;
    }

    setLoading(true);
    try {
      // Verificar que el código existe
      const response = await fetch(`/api/bookings?cancelCode=${trimmedCode}`);
      const data = await response.json();

      if (!response.ok || !data || data.length === 0) {
        setError("Código no encontrado. Verifica que el código sea correcto.");
        setLoading(false);
        return;
      }

      // Redirigir a la página de gestión
      router.push(`/manage/${trimmedCode}`);
      onClose();
    } catch (err) {
      console.error(err);
      setError("Error al verificar el código. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="manage-booking-dialog-title"
      aria-describedby="manage-booking-dialog-description"
      PaperProps={{
        sx: {
          borderRadius: "24px",
          overflow: "hidden",
          backgroundColor: mode === "dark" ? "#0b1220" : "#ffffff",
          boxShadow:
            mode === "dark"
              ? "0 30px 80px rgba(0,0,0,0.65)"
              : "0 30px 80px rgba(15, 23, 42, 0.18)"
        }
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ px: 4, pt: 4, pb: 3, textAlign: "center" }}>
          <Typography
            id="manage-booking-dialog-title"
            variant="h6"
            sx={{
              fontWeight: 900,
              lineHeight: 1.15,
              color: mode === "dark" ? "#e2e8f0" : "#0f172a"
            }}
          >
            Gestionar Reserva
          </Typography>
          <Typography
            id="manage-booking-dialog-description"
            variant="body2"
            sx={{
              mt: 1.5,
              lineHeight: 1.45,
              color: mode === "dark" ? "rgba(226,232,240,0.7)" : "rgba(51,65,85,0.75)"
            }}
          >
            Ingresa tu código de cancelación/edición
          </Typography>
        </Box>

        <Box sx={{ px: 4, pb: 4 }}>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Código de Reserva"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError("");
              }}
              placeholder="CXL-XXXXXXXX"
              fullWidth
              required
              autoFocus
              error={!!error}
              helperText={error || "Formato: CXL- seguido de 8 caracteres"}
              variant="outlined"
              InputLabelProps={{
                shrink: true,
                sx: {
                  fontWeight: 700,
                  lineHeight: 1.2,
                  color: mode === "dark" ? "rgba(226,232,240,0.75)" : "rgba(51,65,85,0.7)",
                  "&.Mui-focused": { color: "#0E7CFF" }
                }
              }}
              FormHelperTextProps={{
                sx: {
                  marginTop: "8px",
                  lineHeight: 1.4,
                  fontSize: "0.78rem",
                  color: error
                    ? (mode === "dark" ? "rgba(248,113,113,0.95)" : "#dc2626")
                    : (mode === "dark" ? "rgba(226,232,240,0.6)" : "rgba(51,65,85,0.65)")
                }
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "18px",
                  height: 58,
                  backgroundColor: mode === "dark" ? "rgba(15,23,42,0.35)" : "rgba(248,250,252,0.9)",
                  "& fieldset": {
                    borderColor: mode === "dark" ? "rgba(148,163,184,0.35)" : "rgba(148,163,184,0.45)",
                    borderWidth: 2
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(14,124,255,0.65)",
                    borderWidth: 2
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#0E7CFF",
                    borderWidth: 2
                  }
                },
                "& .MuiInputBase-input": {
                  fontSize: "16px",
                  fontWeight: 800,
                  letterSpacing: "0.02em",
                  color: mode === "dark" ? "#e2e8f0" : "#0f172a"
                }
              }}
            />

            {error ? (
              <Alert
                severity="error"
                onClose={() => setError("")}
                className="rounded-xl"
                sx={{
                  mt: 2,
                  backgroundColor: mode === "dark" ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.06)",
                  border: `1px solid ${mode === "dark" ? "rgba(239,68,68,0.35)" : "rgba(239,68,68,0.25)"}`
                }}
              >
                {error}
              </Alert>
            ) : null}

            <Box
              sx={{
                mt: 3,
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2
              }}
            >
              <Button
                variant="outlined"
                onClick={onClose}
                fullWidth
                size="large"
                sx={{
                  height: 52,
                  borderRadius: "16px",
                  fontWeight: 900,
                  textTransform: "none",
                  borderWidth: 2,
                  borderColor: mode === "dark" ? "rgba(148,163,184,0.35)" : "rgba(148,163,184,0.6)",
                  color: mode === "dark" ? "#e2e8f0" : "#0f172a",
                  "&:hover": { borderWidth: 2, borderColor: "rgba(14,124,255,0.55)" }
                }}
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading || !code.trim()}
                sx={{
                  height: 52,
                  borderRadius: "16px",
                  fontWeight: 900,
                  textTransform: "none",
                  boxShadow: mode === "dark" ? "0 14px 35px rgba(0,0,0,0.45)" : "0 14px 35px rgba(2, 6, 23, 0.18)",
                  background: "linear-gradient(135deg, #0E7CFF 0%, #0A56B3 100%)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #0A56B3 0%, #083d85 100%)"
                  },
                  "&:disabled": {
                    background: mode === "dark" ? "rgba(14,124,255,0.28)" : "rgba(14,124,255,0.45)"
                  }
                }}
              >
                {loading ? "Verificando..." : "Gestionar Reserva"}
              </Button>
            </Box>

            <Typography
              variant="caption"
              sx={{
                display: "block",
                textAlign: "center",
                mt: 3,
                lineHeight: 1.4,
                color: mode === "dark" ? "rgba(226,232,240,0.55)" : "rgba(51,65,85,0.6)"
              }}
            >
              El código se te proporcionó al confirmar tu reserva
            </Typography>
          </form>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

