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
    toast.success("Link copiado al portapapeles");
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
      <DialogContent className="p-8 md:p-10 text-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        {/* Icono de éxito animado */}
        <Box
          className="mb-6 flex justify-center"
          sx={{
            animation: "scaleIn 0.5s ease-out",
            "@keyframes scaleIn": {
              "0%": {
                transform: "scale(0)",
                opacity: 0
              },
              "50%": {
                transform: "scale(1.1)"
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
              width: 100,
              height: 100,
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
                  transform: "scale(1.05)",
                  opacity: 0.9
                }
              }
            }}
          >
            <CheckCircleIcon
              sx={{
                fontSize: 60,
                color: "#10b981"
              }}
            />
          </Box>
        </Box>

        {/* Título */}
        <Typography
          id="code-modal-title"
          variant="h4"
          className="mb-2 font-bold text-slate-900 dark:text-slate-100"
          sx={{
            lineHeight: 1.3,
            animation: "fadeInUp 0.6s ease-out 0.2s both",
            "@keyframes fadeInUp": {
              "0%": {
                opacity: 0,
                transform: "translateY(20px)"
              },
              "100%": {
                opacity: 1,
                transform: "translateY(0)"
              }
            }
          }}
        >
          ¡Reserva Confirmada!
        </Typography>

        {/* Información de la reserva */}
        <Box
          className="mb-6 space-y-2"
          sx={{
            animation: "fadeInUp 0.6s ease-out 0.3s both"
          }}
        >
          <Typography 
            variant="body1" 
            className="text-slate-600 dark:text-slate-400"
            sx={{ lineHeight: 1.5 }}
          >
            {roomName}
          </Typography>
          <Typography 
            variant="body2" 
            className="text-slate-500 dark:text-slate-500"
            sx={{ lineHeight: 1.5 }}
          >
            {date} • {timeRange && !timeRange.includes("AM") && !timeRange.includes("PM") 
              ? (timeRange.includes(" - ") 
                  ? timeRange.split(" - ").map(t => formatTime12h(t.trim())).join(" - ")
                  : formatTime12h(timeRange))
              : timeRange}
          </Typography>
        </Box>

        {/* Código de cancelación */}
        <Box
          className="mb-6 rounded-2xl border-2 border-dashed border-brand/50 bg-gradient-to-br from-brand/5 to-brand/10 dark:from-brand/10 dark:to-brand/20 p-6 dark:border-brand/30"
          sx={{
            animation: "fadeInUp 0.6s ease-out 0.4s both",
            backdropFilter: "blur(10px)"
          }}
        >
          <Typography
            variant="caption"
            className="mb-3 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400"
            sx={{ lineHeight: 1.5 }}
          >
            Código de Cancelación/Edición
          </Typography>
          <Box className="flex items-center justify-center gap-3 flex-wrap">
            <Typography
              variant="h4"
              className="font-mono font-bold tracking-wider text-brand dark:text-brand-light break-all"
              sx={{
                letterSpacing: "0.15em",
                userSelect: "all",
                fontSize: { xs: "1.5rem", sm: "2rem" },
                lineHeight: 1.2
              }}
            >
              {cancelCode}
            </Typography>
            <IconButton
              onClick={copyCode}
              size="medium"
              sx={{
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
                  fontSize: "1.5rem"
                }}
              />
            </IconButton>
          </Box>
        </Box>

        {/* Instrucciones */}
        <Box
          className="mb-6 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-700/50 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700 p-5 text-left"
          sx={{
            animation: "fadeInUp 0.6s ease-out 0.5s both"
          }}
        >
          <Typography 
            variant="subtitle2" 
            className="mb-3 font-bold text-slate-800 dark:text-slate-200"
            sx={{ lineHeight: 1.4 }}
          >
            ¿Cómo usar este código?
          </Typography>
          <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300" style={{ lineHeight: 1.6 }}>
            <li className="flex items-start gap-2">
              <span className="text-brand font-bold">•</span>
              <span>Guarda este código de forma segura</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand font-bold">•</span>
              <span>Úsalo para cancelar o editar tu reserva</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand font-bold">•</span>
              <span>Accede a: <span className="font-mono text-xs bg-slate-200 dark:bg-slate-600 px-2 py-1 rounded">{cancelUrl}</span></span>
            </li>
          </ul>
        </Box>

        {/* Botones */}
        <Box
          className="flex flex-col gap-3 sm:flex-row sm:justify-center"
          sx={{
            animation: "fadeInUp 0.6s ease-out 0.6s both"
          }}
        >
          <Button
            variant="outlined"
            onClick={copyLink}
            startIcon={<ContentCopyIcon />}
            size="large"
            className="dark:border-slate-600 dark:text-slate-300"
            sx={{
              borderWidth: 2,
              "&:hover": {
                borderWidth: 2
              }
            }}
          >
            Copiar Link
          </Button>
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
              transition: "all 0.2s ease"
            }}
          >
            Gestionar Reserva
          </Button>
          <Button
            variant="text"
            onClick={onClose}
            size="large"
            className="dark:text-slate-400"
          >
            Cerrar
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

