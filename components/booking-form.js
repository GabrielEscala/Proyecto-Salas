"use client";

import { memo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  MenuItem,
  Select
} from "@mui/material";
import { useTheme } from "@/lib/theme-context";
import { formatTime12h } from "@/lib/time";
import clsx from "clsx";

function BookingForm({
  selectedRoom,
  selectedRoomLabel,
  selectedDate,
  selectedSlots = [],
  onRemoveSlot,
  onSubmit,
  loading
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [formError, setFormError] = useState("");
  const { mode } = useTheme();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedRoom || !selectedDate || !selectedSlots.length) {
      setFormError("Selecciona sala, fecha y al menos un bloque horario.");
      return;
    }

    if (!company) {
      setFormError("Selecciona tu empresa.");
      return;
    }

    setFormError("");

    const result = await onSubmit?.({
      roomId: selectedRoom,
      firstName,
      lastName,
      company,
      date: selectedDate,
      times: selectedSlots
    });

    if (result?.success) {
      setFirstName("");
      setLastName("");
      setCompany("");
    }
  };

  return (
    <Card 
      elevation={0} 
      className={`border-2 ${mode === "dark" ? "border-slate-600" : "border-slate-300"} shadow-lg overflow-hidden`}
      sx={{
        background: mode === "dark" 
          ? "linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)"
          : "linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(248, 250, 252, 1) 100%)",
        borderColor: mode === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(148, 163, 184, 0.4)",
        boxShadow: mode === "dark" ? undefined : "0 4px 14px -2px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)"
      }}
    >
      <CardContent className="p-5 md:p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="text-center md:text-left">
            <Typography 
              variant="h6" 
              className="mb-1 font-bold text-slate-900 dark:text-slate-100"
              sx={{ lineHeight: 1.3 }}
            >
              Completa tus datos
            </Typography>
            <Typography 
              variant="body2" 
              className="text-slate-600 dark:text-slate-400"
              sx={{ lineHeight: 1.5 }}
            >
              Ingresa tu nombre y apellido para confirmar la reserva
            </Typography>
          </div>

          {selectedSlots.length > 0 && (
            <div className="rounded-xl border-2 border-brand/30 dark:border-brand/50 bg-gradient-to-br from-brand/5 to-brand/10 dark:from-brand/10 dark:to-brand/20 p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <Typography variant="body2" className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedSlots.length} bloque{selectedSlots.length !== 1 ? "s" : ""} seleccionado{selectedSlots.length !== 1 ? "s" : ""}
                </Typography>
                <Chip
                  size="small"
                  color="primary"
                  label={`${formatTime12h(selectedSlots[0])} - ${formatTime12h(selectedSlots[selectedSlots.length - 1])}`}
                  className="font-semibold"
                  sx={{
                    backgroundColor: "rgba(14, 124, 255, 0.15)",
                    color: "#0E7CFF",
                    border: "1px solid rgba(14, 124, 255, 0.3)"
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedSlots.map((slot) => (
                  <Chip
                    key={slot}
                    label={formatTime12h(slot)}
                    size="small"
                    onDelete={() => onRemoveSlot?.(slot)}
                    color="primary"
                    variant="outlined"
                    className="font-medium"
                    sx={{
                      borderWidth: 1.5,
                      "&:hover": {
                        backgroundColor: "rgba(14, 124, 255, 0.1)"
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recuadro para nombre, apellido y empresa */}
          <Box 
            className={`rounded-xl border-2 ${mode === "dark" ? "border-slate-600" : "border-slate-300"} bg-gradient-to-br from-white to-slate-50 dark:from-slate-700/80 dark:to-slate-800/80 p-5 shadow-md`}
            sx={{
              borderColor: mode === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(148, 163, 184, 0.4)",
              transition: "all 0.2s ease",
              boxShadow: mode === "dark" ? undefined : "0 2px 8px -2px rgba(0, 0, 0, 0.1)",
              "&:hover": {
                borderColor: mode === "dark" ? "rgba(14, 124, 255, 0.5)" : "rgba(14, 124, 255, 0.5)",
                boxShadow: mode === "dark" ? "0 4px 12px rgba(14, 124, 255, 0.1)" : "0 4px 12px rgba(14, 124, 255, 0.15)"
              }
            }}
          >
            <Typography 
              variant="subtitle2" 
              className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400"
              sx={{ lineHeight: 1.5 }}
            >
              Información Personal
            </Typography>
            <Stack spacing={3}>
              <TextField
                label="Nombre *"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                required
                fullWidth
                placeholder="Ingresa tu nombre"
                variant="outlined"
                InputProps={{
                  style: { fontSize: "16px", lineHeight: 1.5 }
                }}
                InputLabelProps={{
                  sx: { 
                    lineHeight: 1.5,
                    fontSize: "16px",
                    color: mode === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
                    "&.Mui-focused": {
                      color: "#0E7CFF"
                    }
                  }
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: mode === "dark" ? "rgba(30, 41, 59, 0.4)" : "white",
                    borderRadius: "12px",
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
                    lineHeight: 1.5,
                    padding: "14px 0 !important",
                    fontSize: "16px"
                  }
                }}
              />
              <TextField
                label="Apellido *"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                required
                fullWidth
                placeholder="Ingresa tu apellido"
                variant="outlined"
                InputProps={{
                  style: { fontSize: "16px", lineHeight: 1.5 }
                }}
                InputLabelProps={{
                  sx: { 
                    lineHeight: 1.5,
                    fontSize: "16px",
                    color: mode === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
                    "&.Mui-focused": {
                      color: "#0E7CFF"
                    }
                  }
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: mode === "dark" ? "rgba(30, 41, 59, 0.4)" : "white",
                    borderRadius: "12px",
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
                    lineHeight: 1.5,
                    padding: "14px 0 !important",
                    fontSize: "16px"
                  }
                }}
              />
              <FormControl 
                fullWidth
                required
                sx={{
                  "& .MuiInputLabel-root": {
                    lineHeight: 1.5,
                    fontSize: "16px"
                  }
                }}
              >
                <InputLabel
                  id="company-selector-label"
                  sx={{
                    lineHeight: 1.5,
                    fontSize: "16px",
                    color: mode === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
                    "&.Mui-focused": {
                      color: "#0E7CFF"
                    }
                  }}
                >
                  Empresa *
                </InputLabel>
                <Select
                  labelId="company-selector-label"
                  label="Empresa *"
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                  sx={{
                    backgroundColor: mode === "dark" ? "rgba(30, 41, 59, 0.4)" : "white",
                    borderRadius: "12px",
                    height: "56px",
                    "& .MuiSelect-select": {
                      padding: "16px 14px",
                      fontSize: "16px",
                      lineHeight: 1.5,
                      display: "flex",
                      alignItems: "center"
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: mode === "dark" ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.23)",
                      borderWidth: 2
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#0E7CFF",
                      borderWidth: 2
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#0E7CFF",
                      borderWidth: 2
                    },
                    "& .MuiSvgIcon-root": {
                      color: mode === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.54)"
                    },
                    transition: "all 0.2s ease"
                  }}
                >
                  <MenuItem value="Grupo Escala">Grupo Escala</MenuItem>
                  <MenuItem value="Mah">Mah</MenuItem>
                  <MenuItem value="Levruno">Levruno</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Box>

          {formError && (
            <Alert severity="warning" onClose={() => setFormError("")}>
              {formError}
            </Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            disabled={loading || !selectedSlots.length}
            className="h-14 font-semibold text-base shadow-lg"
            sx={{
              background: loading || !selectedSlots.length 
                ? undefined 
                : "linear-gradient(135deg, #0E7CFF 0%, #0A56B3 100%)",
              "&:hover": {
                background: loading || !selectedSlots.length 
                  ? undefined 
                  : "linear-gradient(135deg, #0A56B3 0%, #083d85 100%)",
                transform: "translateY(-2px)",
                boxShadow: "0 10px 20px rgba(14, 124, 255, 0.3)"
              },
              "&:disabled": {
                background: mode === "dark" ? "rgba(14, 124, 255, 0.3)" : "rgba(14, 124, 255, 0.5)"
              },
              transition: "all 0.2s ease"
            }}
          >
            {loading ? "Reservando..." : selectedSlots.length > 0 ? `Confirmar reserva (${selectedSlots.length} bloque${selectedSlots.length !== 1 ? "s" : ""})` : "Selecciona horarios primero"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default memo(BookingForm);

