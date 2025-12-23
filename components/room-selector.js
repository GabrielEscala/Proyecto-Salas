"use client";

import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Box
} from "@mui/material";
import RoomInfo from "./room-info";
import { useTheme } from "@/lib/theme-context";

export default function RoomSelector({ rooms = [], value, onChange, showInfo = true }) {
  const selectedRoom = rooms.find((room) => (room.id ?? room.name) === value);
  const { mode } = useTheme();

  return (
    <Box className="space-y-3">
      <Typography 
        variant="subtitle2" 
        className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2"
        sx={{ lineHeight: 1.5 }}
      >
        Sala / Cabina
      </Typography>
      <FormControl 
        fullWidth 
        sx={{
          "& .MuiInputLabel-root": {
            lineHeight: 1.5,
            fontSize: "16px"
          }
        }}
      >
        <InputLabel 
          id="room-selector-label" 
          sx={{
            color: mode === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
            "&.Mui-focused": {
              color: "#0E7CFF"
            }
          }}
        >
          Selecciona una sala
        </InputLabel>
        <Select
          labelId="room-selector-label"
          label="Selecciona una sala"
          value={value || ""}
          onChange={(event) => onChange?.(event.target.value)}
          sx={{
            backgroundColor: mode === "dark" ? "rgba(30, 41, 59, 0.6)" : "white",
            borderRadius: "16px",
            height: "56px",
            "& .MuiOutlinedInput-root": {
              paddingLeft: "16px",
              paddingRight: "12px"
            },
            "& .MuiSelect-select": {
              padding: "16px 0 !important",
              fontSize: "16px",
              lineHeight: 1.5,
              display: "flex",
              alignItems: "center",
              minHeight: "auto"
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
            transition: "all 0.2s ease",
            boxShadow: mode === "dark" ? "0 2px 8px rgba(0, 0, 0, 0.3)" : "0 2px 8px rgba(0, 0, 0, 0.08)"
          }}
        >
          {rooms.map((room) => {
            const capacity = room.capacity ? ` (${room.capacity} pers.)` : "";
            return (
              <MenuItem 
                key={room.id ?? room.name} 
                value={room.id ?? room.name}
                sx={{
                  fontSize: "16px",
                  lineHeight: 1.5,
                  padding: "12px 16px",
                  "&:hover": {
                    backgroundColor: "rgba(14, 124, 255, 0.1)"
                  },
                  "&.Mui-selected": {
                    backgroundColor: "rgba(14, 124, 255, 0.15)",
                    "&:hover": {
                      backgroundColor: "rgba(14, 124, 255, 0.2)"
                    }
                  }
                }}
              >
                {room.name}{capacity}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
      {showInfo && selectedRoom && (
        <Box 
          className={`mt-3 rounded-xl border-2 ${mode === "dark" ? "border-slate-600" : "border-slate-300"} bg-gradient-to-br from-slate-50 to-white dark:from-slate-700/80 dark:to-slate-800/80 p-4 shadow-md`}
          sx={{
            borderColor: mode === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(148, 163, 184, 0.4)",
            boxShadow: mode === "dark" ? undefined : "0 2px 8px -2px rgba(0, 0, 0, 0.1)"
          }}
        >
          <RoomInfo room={selectedRoom} />
        </Box>
      )}
    </Box>
  );
}

