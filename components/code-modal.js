"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  IconButton,
  Typography,
  Button,
  Box
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { toast } from "sonner";
import { formatTime12h } from "@/lib/time";

export default function CodeModal({ open, onClose, cancelCode, cancelUrl, roomName, timeRange, date }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open && cancelCode) {
      setCopied(false);
    }
  }, [open, cancelCode]);

  const copyCode = () => {
    if (!cancelCode) return;
    navigator.clipboard.writeText(cancelCode);
    setCopied(true);
    toast.success("Código copiado al portapapeles");
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = () => {
    if (!cancelUrl) return;
    navigator.clipboard.writeText(cancelUrl);
    toast.success("Enlace copiado al portapapeles");
  };

  if (!cancelCode) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="code-modal-title"
      aria-describedby="code-modal-description"
      PaperProps={{
        className: "rounded-2xl overflow-hidden shadow-2xl"
      }}
    >
      <DialogContent className="p-6 sm:p-8 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <Box className="relative">
          <IconButton
            onClick={onClose}
            aria-label="Cerrar"
            size="small"
            sx={{
              position: "absolute",
              top: 0,
              right: 0,
              color: "rgba(100, 116, 139, 0.9)",
              "&:hover": { backgroundColor: "rgba(148, 163, 184, 0.14)" }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          {/* Icono de éxito animado */}
          <Box
            className="mb-5 flex justify-center"
            sx={{
              animation: "scaleIn 0.5s ease-out",
              "@keyframes scaleIn": {
                "0%": {
                  transform: "scale(0)",
                  opacity: 0
                },
                "50%": {
                  transform: "scale(1.06)"
                },
                "100%": {
                  transform: "scale(1)",
                  opacity: 1
                }
              }
            }}
          >
            <Box
              sx={{
                width: 84,
                height: 84,
                borderRadius: "50%",
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: "pulse 2s infinite",
                "@keyframes pulse": {
                  "0%, 100%": {
                    transform: "scale(1)",
                    opacity: 1
                  },
                  "50%": {
                    transform: "scale(1.04)",
                    opacity: 0.9
                  }
                }
              }}
            >
              <CheckCircleIcon
                sx={{
                  fontSize: 52,
                  color: "#10b981"
                }}
              />
            </Box>
          </Box>

          {/* Título */}
          <Typography
            id="code-modal-title"
            variant="h5"
            className="text-center mb-1 font-extrabold text-slate-900 dark:text-slate-100"
            sx={{
              lineHeight: 1.25,
              animation: "fadeInUp 0.6s ease-out 0.2s both",
              "@keyframes fadeInUp": {
                "0%": {
                  opacity: 0,
                  transform: "translateY(14px)"
                },
                "100%": {
                  opacity: 1,
                  transform: "translateY(0)"
                }
              }
            }}
          >
            Reserva confirmada
          </Typography>

          <Typography
            variant="body2"
            className="text-center text-slate-600 dark:text-slate-300"
            sx={{ lineHeight: 1.5, animation: "fadeInUp 0.6s ease-out 0.25s both" }}
          >
            Guarda tu código para editar o cancelar.
          </Typography>

          <Box className="mt-6 space-y-4" sx={{ animation: "fadeInUp 0.6s ease-out 0.3s both" }}>
            {/* Información de la reserva */}
            <Box className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/40 p-5">
              <Typography
                variant="caption"
                className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400"
                sx={{ lineHeight: 1.4 }}
              >
                Detalles
              </Typography>
              <Typography
                variant="subtitle1"
                className="mt-2 font-extrabold text-slate-900 dark:text-slate-100"
                sx={{ lineHeight: 1.3 }}
              >
                {roomName}
              </Typography>
              <Typography
                variant="body2"
                className="mt-1 text-slate-600 dark:text-slate-300"
                sx={{ lineHeight: 1.5 }}
              >
                {date} • {(() => {
                  const hasMeridiem = /\b(AM|PM)\b|a\.\s?m\.|p\.\s?m\./i.test(timeRange || "");
                  if (!timeRange || hasMeridiem) return timeRange;
                  if (timeRange.includes(" - ")) {
                    return timeRange
                      .split(" - ")
                      .map((t) => formatTime12h(t.trim()))
                      .join(" - ");
                  }
                  return formatTime12h(timeRange);
                })()}
              </Typography>
            </Box>

            {/* Código de cancelación */}
            <Box
              className="rounded-2xl border-2 border-dashed border-brand/50 bg-gradient-to-br from-brand/5 to-brand/10 dark:from-brand/10 dark:to-brand/20 p-5 dark:border-brand/30"
              sx={{ backdropFilter: "blur(10px)" }}
            >
              <Box className="flex items-start justify-between gap-3">
                <Box className="min-w-0">
                  <Typography
                    variant="caption"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400"
                    sx={{ lineHeight: 1.4 }}
                  >
                    Código de edición/cancelación
                  </Typography>
                  <Typography
                    variant="h4"
                    className="mt-2 font-mono font-extrabold text-brand dark:text-brand-light break-all"
                    sx={{
                      letterSpacing: "0.12em",
                      userSelect: "all",
                      fontSize: { xs: "1.35rem", sm: "1.75rem" },
                      lineHeight: 1.2
                    }}
                  >
                    {cancelCode}
                  </Typography>
                  <Typography
                    variant="caption"
                    className="mt-2 block text-slate-600 dark:text-slate-300"
                    sx={{ lineHeight: 1.4 }}
                  >
                    {copied ? "Copiado" : "Haz clic para copiar"}
                  </Typography>
                </Box>

                <IconButton
                  onClick={copyCode}
                  size="medium"
                  sx={{
                    alignSelf: "center",
                    backgroundColor: copied
                      ? "rgba(16, 185, 129, 0.2)"
                      : "rgba(14, 124, 255, 0.1)",
                    "&:hover": {
                      backgroundColor: copied
                        ? "rgba(16, 185, 129, 0.3)"
                        : "rgba(14, 124, 255, 0.2)"
                    }
                  }}
                >
                  <ContentCopyIcon
                    sx={{
                      color: copied ? "#10b981" : "#0E7CFF",
                      fontSize: "1.4rem"
                    }}
                  />
                </IconButton>
              </Box>
            </Box>

            {/* Instrucciones */}
            <Box className="rounded-2xl bg-white/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 p-5">
              <Typography
                variant="subtitle2"
                className="font-extrabold text-slate-900 dark:text-slate-100"
                sx={{ lineHeight: 1.4 }}
              >
                ¿Cómo usar este código?
              </Typography>
              <ol className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300" style={{ lineHeight: 1.6 }}>
                <li>
                  <span className="font-bold">1.</span> Guárdalo en un lugar seguro.
                </li>
                <li>
                  <span className="font-bold">2.</span> Úsalo para editar o cancelar tu reserva.
                </li>
                <li className="break-all">
                  <span className="font-bold">3.</span> Enlace: <span className="font-mono text-xs bg-slate-200/70 dark:bg-slate-700/60 px-2 py-1 rounded">{cancelUrl}</span>
                </li>
              </ol>
              <Box className="mt-4">
                <Button
                  variant="outlined"
                  onClick={copyLink}
                  startIcon={<ContentCopyIcon />}
                  size="medium"
                  className="dark:border-slate-600 dark:text-slate-300"
                  sx={{
                    borderWidth: 2,
                    textTransform: "none",
                    "&:hover": { borderWidth: 2 }
                  }}
                >
                  Copiar enlace
                </Button>
              </Box>
            </Box>
          </Box>

          {/* Botones */}
          <Box
            className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center"
            sx={{ animation: "fadeInUp 0.6s ease-out 0.45s both" }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                window.open(cancelUrl, "_blank");
              }}
              size="large"
              className="font-semibold shadow-lg"
              sx={{
                background: "linear-gradient(135deg, #0E7CFF 0%, #0A56B3 100%)",
                "&:hover": {
                  background: "linear-gradient(135deg, #0A56B3 0%, #083d85 100%)",
                  transform: "translateY(-2px)",
                  boxShadow: "0 10px 20px rgba(14, 124, 255, 0.3)"
                },
                transition: "all 0.2s ease",
                textTransform: "none",
                borderRadius: "14px"
              }}
            >
              Gestionar reserva
            </Button>
            <Button
              variant="text"
              onClick={onClose}
              size="large"
              className="dark:text-slate-400"
              sx={{ textTransform: "none", fontWeight: 800 }}
            >
              Cerrar
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
