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
        className: "rounded-2xl overflow-hidden bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800"
      }}
    >
      <DialogTitle 
        id="manage-booking-dialog-title"
        className="text-center pb-3 pt-6 px-6"
      >
        <Typography 
          variant="h5" 
          className="font-bold text-slate-900 dark:text-slate-100 mb-2"
          sx={{ lineHeight: 1.3 }}
        >
          Gestionar Reserva
        </Typography>
        <Typography 
          id="manage-booking-dialog-description"
          variant="body2" 
          className="text-slate-600 dark:text-slate-400"
          sx={{ lineHeight: 1.5 }}
        >
          Ingresa tu código de cancelación/edición
        </Typography>
      </DialogTitle>
      <DialogContent className="px-6 pb-6" sx={{ pt: 2 }}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Box sx={{ mb: 2 }}>
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
                className: mode === "dark" ? "dark:text-slate-400" : "",
                sx: { 
                  lineHeight: 1.5,
                  fontSize: "16px",
                  color: mode === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
                  "&.Mui-focused": {
                    color: "#0E7CFF"
                  }
                }
              }}
              FormHelperTextProps={{
                sx: { 
                  marginTop: "8px",
                  lineHeight: 1.5,
                  fontSize: "0.75rem"
                }
              }}
              sx={{
                backgroundColor: mode === "dark" ? "rgba(30, 41, 59, 0.5)" : "white",
                borderRadius: "16px",
                "& .MuiOutlinedInput-root": {
                  height: "56px",
                  paddingLeft: "16px",
                  paddingRight: "16px",
                  "& fieldset": {
                    borderColor: mode === "dark" ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.23)",
                    borderWidth: 2
                  },
                  "&:hover fieldset": {
                    borderColor: "#0E7CFF",
                    borderWidth: 2
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#0E7CFF",
                    borderWidth: 2
                  },
                  transition: "all 0.2s ease"
                },
                "& .MuiInputBase-input": {
                  color: mode === "dark" ? "#e2e8f0" : "#1a202c",
                  lineHeight: 1.5,
                  padding: "16px 0 !important",
                  fontSize: "18px",
                  fontFamily: "monospace",
                  letterSpacing: "0.15em",
                  fontWeight: 600
                },
                boxShadow: mode === "dark" ? "0 2px 8px rgba(0, 0, 0, 0.3)" : "0 2px 8px rgba(0, 0, 0, 0.08)"
              }}
            />
          </Box>

          {error && (
            <Alert 
              severity="error" 
              onClose={() => setError("")}
              className="rounded-lg"
              sx={{
                backgroundColor: mode === "dark" ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.05)",
                border: `1px solid ${mode === "dark" ? "rgba(239, 68, 68, 0.3)" : "rgba(239, 68, 68, 0.2)"}`,
                "& .MuiAlert-message": {
                  lineHeight: 1.5
                }
              }}
            >
              {error}
            </Alert>
          )}

          <Box className="flex flex-col sm:flex-row gap-3" sx={{ mt: 3 }}>
            <Button
              variant="outlined"
              onClick={onClose}
              fullWidth
              size="large"
              className="dark:border-slate-600 dark:text-slate-300"
              sx={{
                borderWidth: 2,
                height: "48px",
                lineHeight: 1.5,
                "&:hover": {
                  borderWidth: 2
                }
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              disabled={loading || !code.trim()}
              className="font-semibold shadow-lg"
              sx={{
                height: "48px",
                lineHeight: 1.5,
                background: "linear-gradient(135deg, #0E7CFF 0%, #0A56B3 100%)",
                "&:hover": {
                  background: "linear-gradient(135deg, #0A56B3 0%, #083d85 100%)"
                },
                "&:disabled": {
                  background: mode === "dark" ? "rgba(14, 124, 255, 0.3)" : "rgba(14, 124, 255, 0.5)"
                }
              }}
            >
              {loading ? "Verificando..." : "Gestionar Reserva"}
            </Button>
          </Box>

          <Typography 
            variant="caption" 
            className="block text-center text-slate-500 dark:text-slate-400"
            sx={{ 
              mt: 2,
              lineHeight: 1.5,
              display: "block"
            }}
          >
            El código se te proporcionó al confirmar tu reserva
          </Typography>
        </form>
      </DialogContent>
    </Dialog>
  );
}

