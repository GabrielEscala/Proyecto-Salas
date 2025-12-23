"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({
  mode: "light",
  toggleMode: () => {}
});

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedMode = localStorage.getItem("theme-mode") || "light";
    setMode(savedMode);
    document.documentElement.classList.toggle("dark", savedMode === "dark");
  }, []);

  const toggleMode = () => {
    const newMode = mode === "light" ? "dark" : "light";
    setMode(newMode);
    localStorage.setItem("theme-mode", newMode);
    document.documentElement.classList.toggle("dark", newMode === "dark");
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ mode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

