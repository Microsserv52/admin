"use client";

import { useState } from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "@/components/session";
import { Telemetry } from "@/components/telemetry";

const theme = createTheme({
  cssVariables: { colorSchemeSelector: "class" },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: "#9b3d25" },
        background: { default: "#f7f5f0", paper: "#fffefa" },
        text: { primary: "#252820", secondary: "#60645c" },
      },
    },
    dark: {
      palette: {
        primary: { main: "#f0a68c" },
        background: { default: "#181b17", paper: "#22271f" },
        text: { primary: "#f4f2e9", secondary: "#b7c0b1" },
      },
    },
  },
  typography: {
    fontFamily: "Arial, Helvetica, sans-serif",
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: { borderRadius: 6 },
  components: {
    MuiOutlinedInput: { styleOverrides: { root: { minHeight: 44 } } },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { minHeight: 44 } },
    },
    MuiIconButton: {
      styleOverrides: { root: { minWidth: 44, minHeight: 44 } },
    },
  },
});
export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: (count, error) =>
              count < 1 &&
              !(
                error &&
                "status" in error &&
                [401, 403, 404].includes(Number(error.status))
              ),
          },
          mutations: { retry: false },
        },
      }),
  );
  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <ThemeProvider theme={theme} defaultMode="system">
        <CssBaseline />
        <QueryClientProvider client={client}>
          <SessionProvider>
            {children}
            <Telemetry />
          </SessionProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
