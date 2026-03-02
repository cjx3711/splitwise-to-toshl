import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import React from "react";
import ReactDOM from "react-dom/client";
import Home from "./Home.tsx";

import { AppBar, IconButton, Stack } from "@mui/material";
import Box from "@mui/material/Box";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Copyright } from "./Copyright.tsx";
import { Friend } from "./Friend.tsx";
import { Friends } from "./Friends.tsx";
import { UserAccountsProvider } from "./hooks/useAccounts.tsx";
import { ThemeModeProvider, useThemeMode } from "./hooks/useThemeMode.tsx";
import { Settings } from "./Settings.tsx";
import { BulkAdd } from "./BulkAdd.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/settings",
    element: <Settings />,
  },
  {
    path: "/friends",
    element: <Friends />,
  },
  {
    path: "/friend/:friendId",
    element: <Friend />,
  },
  {
    path: "/bulk-add",
    element: <BulkAdd />,
  },
  {
    path: "*",
    element: <div>Not Found</div>,
  },
]);

function App() {
  const { mode, toggleThemeMode } = useThemeMode();

  return (
    <Stack
      sx={{
        margin: "0 auto",
        textAlign: "center",
        minHeight: "100vh",
      }}>
      <AppBar position="static">
        <Stack
          direction="row"
          justifyContent="center"
          alignItems="center"
          spacing={2}>
          <Stack
            sx={{
              width: "100%",
              maxWidth: "960px",
              padding: "1rem 1rem",
            }}
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            spacing={2}>
            <Typography variant="h6" component="div">
              <a
                href="/"
                style={{ textDecoration: "none", color: "inherit" }}>
                Splitwise to Toshl
              </a>
            </Typography>

            <Stack direction="row" alignItems="center" spacing={1}>
              <IconButton color="inherit" onClick={toggleThemeMode}>
                {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
              <Typography variant="h6" component="div">
                <a
                  href="/settings"
                  style={{ textDecoration: "none", color: "inherit" }}>
                  Settings
                </a>
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </AppBar>
      <RouterProvider router={router} />

      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: "auto",
          backgroundColor: (theme) =>
            theme.palette.mode === "light"
              ? theme.palette.grey[200]
              : theme.palette.grey[800],
        }}>
        <Container maxWidth="sm">
          <Typography variant="body1">
            Coded haphazardly by CJX3711
          </Typography>
          <Copyright />
        </Container>
      </Box>
    </Stack>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeModeProvider>
      <UserAccountsProvider>
        <App />
      </UserAccountsProvider>
    </ThemeModeProvider>
  </React.StrictMode>
);
