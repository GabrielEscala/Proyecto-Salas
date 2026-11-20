"use client";

import {
  Dialog,
  DialogContent,
  IconButton,
  Typography,
  Button,
  Box
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import NorthEastIcon from "@mui/icons-material/NorthEast";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useTheme } from "@/lib/theme-context";
import { NEW_BOOKING_URL } from "@/lib/constants";

export default function BookingsMovedModal({ open, onClose }) {
  const { mode } = useTheme();
  const dark = mode === "dark";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="bookings-moved-title"
      aria-describedby="bookings-moved-description"
      PaperProps={{
        sx: {
          borderRadius: "24px",
          overflow: "hidden",
          backgroundColor: dark ? "#0b1220" : "#ffffff",
          boxShadow: dark
            ? "0 30px 80px rgba(0,0,0,0.65)"
            : "0 30px 80px rgba(15, 23, 42, 0.18)"
        }
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <IconButton
          onClick={onClose}
          aria-label="Cerrar"
          size="small"
          sx={{
            position: "absolute",
            top: 14,
            right: 14,
            color: dark ? "rgba(226,232,240,0.6)" : "rgba(100,116,139,0.9)",
            "&:hover": { backgroundColor: "rgba(148,163,184,0.14)" }
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        <Box sx={{ px: 4, pt: 5, pb: 3, textAlign: "center" }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              mx: "auto",
              mb: 2.5,
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: dark
                ? "linear-gradient(135deg, rgba(14,124,255,0.25) 0%, rgba(10,86,179,0.25) 100%)"
                : "linear-gradient(135deg, rgba(14,124,255,0.12) 0%, rgba(10,86,179,0.12) 100%)",
              border: `1px solid ${dark ? "rgba(91,168,255,0.35)" : "rgba(14,124,255,0.25)"}`
            }}
          >
            <OpenInNewIcon sx={{ fontSize: 28, color: dark ? "#5BA8FF" : "#0E7CFF" }} />
          </Box>

          <Typography
            id="bookings-moved-title"
            variant="h6"
            sx={{
              fontWeight: 900,
              lineHeight: 1.2,
              color: dark ? "#e2e8f0" : "#0f172a"
            }}
          >
            Cambiamos de página
          </Typography>
          <Typography
            id="bookings-moved-description"
            variant="body2"
            sx={{
              mt: 1.5,
              lineHeight: 1.5,
              color: dark ? "rgba(226,232,240,0.7)" : "rgba(51,65,85,0.75)"
            }}
          >
            Las nuevas reservas de salas ahora se realizan en la intranet de
            Escala.
          </Typography>
        </Box>

        <Box sx={{ px: 4, pb: 4 }}>
          <Box
            component="a"
            href={NEW_BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              px: 2.5,
              py: 2,
              borderRadius: "18px",
              textDecoration: "none",
              border: `2px solid ${dark ? "rgba(91,168,255,0.4)" : "rgba(14,124,255,0.3)"}`,
              backgroundColor: dark ? "rgba(14,124,255,0.08)" : "rgba(14,124,255,0.05)",
              transition: "all 0.15s ease",
              "&:hover": {
                borderColor: dark ? "#5BA8FF" : "#0E7CFF",
                backgroundColor: dark ? "rgba(14,124,255,0.14)" : "rgba(14,124,255,0.09)"
              }
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: dark ? "rgba(226,232,240,0.55)" : "rgba(51,65,85,0.6)",
                  lineHeight: 1.3
                }}
              >
                Reserva desde aquí
              </Typography>
              <Typography
                sx={{
                  mt: 0.5,
                  fontWeight: 900,
                  fontSize: "1.1rem",
                  lineHeight: 1.3,
                  color: dark ? "#5BA8FF" : "#0A56B3"
                }}
              >
                intranet.escalabeds.co
              </Typography>
            </Box>
            <NorthEastIcon sx={{ color: dark ? "#5BA8FF" : "#0E7CFF", flexShrink: 0 }} />
          </Box>

          <Typography
            variant="caption"
            sx={{
              display: "block",
              textAlign: "center",
              mt: 2.5,
              lineHeight: 1.5,
              color: dark ? "rgba(226,232,240,0.55)" : "rgba(51,65,85,0.6)"
            }}
          >
            Aquí puedes seguir consultando la disponibilidad de las salas y
            gestionar tus reservas existentes con tu código.
          </Typography>

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
                borderColor: dark ? "rgba(148,163,184,0.35)" : "rgba(148,163,184,0.6)",
                color: dark ? "#e2e8f0" : "#0f172a",
                "&:hover": { borderWidth: 2, borderColor: "rgba(14,124,255,0.55)" }
              }}
            >
              Entendido
            </Button>

            <Button
              component="a"
              href={NEW_BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              variant="contained"
              fullWidth
              size="large"
              endIcon={<OpenInNewIcon sx={{ fontSize: 18 }} />}
              sx={{
                height: 52,
                borderRadius: "16px",
                fontWeight: 900,
                textTransform: "none",
                boxShadow: dark ? "0 14px 35px rgba(0,0,0,0.45)" : "0 14px 35px rgba(2, 6, 23, 0.18)",
                background: "linear-gradient(135deg, #0E7CFF 0%, #0A56B3 100%)",
                "&:hover": {
                  background: "linear-gradient(135deg, #0A56B3 0%, #083d85 100%)"
                }
              }}
            >
              Ir a la intranet
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
