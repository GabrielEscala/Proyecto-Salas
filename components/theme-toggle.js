"use client";

import { IconButton, Tooltip } from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { useTheme } from "@/lib/theme-context";

export default function ThemeToggle() {
  const { mode, toggleMode } = useTheme();

  return (
    <Tooltip 
      title={mode === "light" ? "Activar modo oscuro" : "Activar modo claro"}
      arrow
    >
      <IconButton
        onClick={toggleMode}
        className="text-slate-700 dark:text-slate-200 transition-all duration-200"
        sx={{
          backgroundColor: "rgba(0, 0, 0, 0.02)",
          "&:hover": {
            backgroundColor: mode === "light" ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.1)",
            transform: "scale(1.1)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)"
          },
          transition: "all 0.2s ease"
        }}
        aria-label={mode === "light" ? "Activar modo oscuro" : "Activar modo claro"}
        aria-pressed={mode === "dark"}
      >
        {mode === "light" ? (
          <DarkModeIcon aria-hidden="true" />
        ) : (
          <LightModeIcon aria-hidden="true" />
        )}
      </IconButton>
    </Tooltip>
  );
}

