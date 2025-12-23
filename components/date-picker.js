"use client";

import { es } from "date-fns/locale";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV3";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { Typography, Box } from "@mui/material";
import { parseISO } from "date-fns";
import { useTheme } from "@/lib/theme-context";

export default function DatePickerCalendar({ value, onChange, minDate = new Date() }) {
  const parsedValue = value ? parseISO(value) : null;
  const { mode } = useTheme();

  return (
    <Box className="space-y-3">
      <Typography 
        variant="subtitle2" 
        className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2"
        sx={{ lineHeight: 1.5 }}
      >
        Fecha
      </Typography>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
        <DatePicker
          disablePast
          minDate={minDate}
          value={parsedValue}
          onChange={(newValue) => {
            if (!newValue) {
              onChange?.("");
              return;
            }
            onChange?.(newValue.toISOString().split("T")[0]);
          }}
          slotProps={{
            textField: {
              fullWidth: true,
              helperText: "Selecciona un día",
              "aria-label": "Selector de fecha",
              InputLabelProps: {
                sx: {
                  lineHeight: 1.5,
                  fontSize: "16px"
                }
              },
              sx: {
                backgroundColor: mode === "dark" ? "rgba(30, 41, 59, 0.6)" : "white",
                borderRadius: "16px",
                "& .MuiOutlinedInput-root": {
                  height: "56px",
                  paddingLeft: "16px",
                  paddingRight: "12px",
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
                  "& .MuiInputBase-input": {
                    lineHeight: 1.5,
                    fontSize: "16px",
                    padding: "16px 0 !important"
                  },
                  transition: "all 0.2s ease"
                },
                "& .MuiInputLabel-root": {
                  color: mode === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
                  "&.Mui-focused": {
                    color: "#0E7CFF"
                  }
                },
                "& .MuiInputAdornment-root": {
                  marginLeft: "8px",
                  "& .MuiIconButton-root": {
                    padding: "8px",
                    color: mode === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.54)",
                    "&:hover": {
                      color: "#0E7CFF",
                      backgroundColor: "rgba(14, 124, 255, 0.1)"
                    }
                  }
                },
                boxShadow: mode === "dark" ? "0 2px 8px rgba(0, 0, 0, 0.3)" : "0 2px 8px rgba(0, 0, 0, 0.08)"
              }
            },
            popper: {
              sx: {
                "& .MuiPaper-root": {
                  borderRadius: "16px",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
                  border: `2px solid ${mode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"}`,
                  backgroundColor: mode === "dark" ? "rgba(30, 41, 59, 0.95)" : "white",
                  "& .MuiPickersCalendarHeader-root": {
                    padding: "16px"
                  },
                  "& .MuiDayCalendar-weekContainer": {
                    margin: "4px"
                  },
                  "& .MuiPickersDay-root": {
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: mode === "dark" ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.87)",
                    "&:hover": {
                      backgroundColor: mode === "dark" ? "rgba(14, 124, 255, 0.2)" : "rgba(14, 124, 255, 0.1)"
                    },
                    "&.Mui-selected": {
                      backgroundColor: "#0E7CFF",
                      color: "white",
                      fontWeight: 600,
                      "&:hover": {
                        backgroundColor: "#0A56B3"
                      }
                    },
                    "&.MuiPickersDay-today": {
                      border: "2px solid #0E7CFF",
                      fontWeight: 600,
                      color: mode === "dark" ? "#0E7CFF" : undefined
                    },
                    "&.Mui-disabled": {
                      color: mode === "dark" ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.26)"
                    }
                  },
                  "& .MuiPickersCalendarHeader-root": {
                    color: mode === "dark" ? "rgba(255, 255, 255, 0.9)" : undefined,
                    "& .MuiIconButton-root": {
                      color: mode === "dark" ? "rgba(255, 255, 255, 0.7)" : undefined,
                      "&:hover": {
                        backgroundColor: mode === "dark" ? "rgba(14, 124, 255, 0.2)" : undefined
                      }
                    }
                  }
                }
              }
            }
          }}
        />
      </LocalizationProvider>
    </Box>
  );
}

