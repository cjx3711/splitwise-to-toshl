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
import { SplitwiseBulkAdd } from "./SplitwiseBulkAdd.tsx";
import About from "./About.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/about",
    element: <About />,
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
    path: "/splitwise-bulk-add",
    element: <SplitwiseBulkAdd />,
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
        minHeight: "100vh",
      }}>
      <AppBar position="static">
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{
            px: 3,
            py: 2,
          }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            <a
              href="/"
              style={{ textDecoration: "none", color: "inherit" }}>
              CJX3711's Finance Toolkit
            </a>
          </Typography>

          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="body2">
              <a
                href="/about"
                style={{ textDecoration: "none", color: "inherit" }}>
                About
              </a>
            </Typography>
            <Typography variant="body2">
              <a
                href="/settings"
                style={{ textDecoration: "none", color: "inherit" }}>
                Settings
              </a>
            </Typography>
            <IconButton color="inherit" onClick={toggleThemeMode} sx={{ ml: 1 }}>
              {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
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
