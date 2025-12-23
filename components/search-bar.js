"use client";

import { TextField, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useTheme } from "@/lib/theme-context";

export default function SearchBar({ value, onChange, placeholder = "Buscar..." }) {
  const { mode } = useTheme();
  
  return (
    <TextField
      fullWidth
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      variant="outlined"
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ color: mode === "dark" ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.4)" }} />
          </InputAdornment>
        ),
        style: { fontSize: "16px", lineHeight: 1.5 }
      }}
      sx={{
        backgroundColor: mode === "dark" ? "rgba(30, 41, 59, 0.5)" : "white",
        borderRadius: "12px",
        "& .MuiOutlinedInput-root": {
          paddingLeft: "16px",
          paddingRight: "12px",
          "& fieldset": {
            borderColor: mode === "dark" ? "rgba(255, 255, 255, 0.23)" : "rgba(0, 0, 0, 0.23)",
            borderWidth: 2
          },
          "&:hover fieldset": {
            borderColor: mode === "dark" ? "rgba(14, 124, 255, 0.5)" : "rgba(14, 124, 255, 0.5)"
          },
          "&.Mui-focused fieldset": {
            borderColor: "#0E7CFF",
            borderWidth: 2
          }
        },
        "& .MuiInputBase-input": {
          color: mode === "dark" ? "#e2e8f0" : "#1a202c",
          lineHeight: 1.5,
          padding: "14px 0 !important",
          fontSize: "16px"
        },
        "& .MuiInputAdornment-root": {
          marginLeft: "0px",
          marginRight: "8px",
          "& .MuiSvgIcon-root": {
            fontSize: "20px"
          }
        },
        transition: "all 0.2s ease"
      }}
    />
  );
}

