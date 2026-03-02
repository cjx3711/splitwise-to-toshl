import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

type ThemeModeContextType = {
  mode: "light" | "dark";
  toggleThemeMode: () => void;
};

const ThemeModeContext = createContext<ThemeModeContextType | undefined>(
  undefined
);

function getInitialMode(): "light" | "dark" {
  const stored = localStorage.getItem("themeMode");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export const ThemeModeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [mode, setMode] = useState<"light" | "dark">(getInitialMode);

  const toggleThemeMode = useCallback(() => {
    setMode((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("themeMode", next);
      return next;
    });
  }, []);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              containedInfo: {
                background: mode === "light" ? "#fff" : "#424242",
                color: mode === "light" ? "#000" : "#fff",
                "&:hover": {
                  background: mode === "light" ? "#eee" : "#616161",
                  color: mode === "light" ? "#000" : "#fff",
                },
              },
            },
          },
        },
      }),
    [mode]
  );

  return (
    <ThemeModeContext.Provider value={{ mode, toggleThemeMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
};

export const useThemeMode = () => {
  const context = useContext(ThemeModeContext);
  if (context === undefined) {
    throw new Error("useThemeMode must be used within a ThemeModeProvider");
  }
  return context;
};
