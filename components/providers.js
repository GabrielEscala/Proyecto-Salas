"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import { CssBaseline, ThemeProvider as MuiThemeProvider } from "@mui/material";
import { ThemeProvider } from "@/lib/theme-context";
import { lightTheme, darkTheme } from "@/lib/theme";
import { useTheme } from "@/lib/theme-context";

function MuiThemeWrapper({ children }) {
  const { mode } = useTheme();
  const theme = mode === "dark" ? darkTheme : lightTheme;

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}

export default function Providers({ children }) {
  return (
    <ThemeProvider>
      <AppRouterCacheProvider options={{ enableCssLayer: true }}>
        <MuiThemeWrapper>{children}</MuiThemeWrapper>
      </AppRouterCacheProvider>
    </ThemeProvider>
  );
}

