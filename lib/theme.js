import { createTheme } from "@mui/material/styles";

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0E7CFF",
      dark: "#0A56B3",
      light: "#5BA8FF"
    },
    secondary: {
      main: "#0B1727"
    },
    background: {
      default: "#f4f6fb",
      paper: "#ffffff"
    }
  },
  shape: {
    borderRadius: 12
  },
  typography: {
    fontFamily: [
      "Inter",
      "system-ui",
      "-apple-system",
      "BlinkMacSystemFont",
      "Segoe UI",
      "sans-serif"
    ].join(",")
  }
});

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#5BA8FF",
      dark: "#0E7CFF",
      light: "#8BC5FF"
    },
    secondary: {
      main: "#E0E7FF"
    },
    background: {
      default: "#0F172A",
      paper: "#1E293B"
    },
    text: {
      primary: "#F1F5F9",
      secondary: "#CBD5E1"
    }
  },
  shape: {
    borderRadius: 12
  },
  typography: {
    fontFamily: [
      "Inter",
      "system-ui",
      "-apple-system",
      "BlinkMacSystemFont",
      "Segoe UI",
      "sans-serif"
    ].join(",")
  }
});

export default lightTheme;

