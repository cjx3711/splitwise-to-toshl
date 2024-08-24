import React from "react";
import ReactDOM from "react-dom/client";
import Home from "./Home.tsx";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";

import CssBaseline from "@mui/material/CssBaseline";
// import { createTheme, ThemeProvider } from "@mui/material/styles";
import Box from "@mui/material/Box";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider } from "@emotion/react";
import { AppBar, colors, createTheme, Stack } from "@mui/material";
import { Copyright } from "./Copyright.tsx";
import { Settings } from "./Settings.tsx";
import { Friends } from "./Friends.tsx";
import { Friend } from "./Friend.tsx";
import { UserAccountsProvider } from "./hooks/useAccounts.tsx";

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
    path: "*",
    element: <div>Not Found</div>,
  },
]);

const defaultTheme = createTheme({
  components: {
    MuiButton: {
      styleOverrides: {
        containedInfo: {
          background: "#fff",
          color: "#000",
          "&:hover": {
            background: "#eee",
            color: "#000",
          },
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={defaultTheme}>
      <UserAccountsProvider>
        <Stack
          sx={{
            margin: "0 auto",
            textAlign: "center",
            minHeight: "100vh",
          }}>
          <CssBaseline />

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

                <Typography variant="h6" component="div">
                  <a
                    href="/settings"
                    style={{ textDecoration: "none", color: "inherit" }}>
                    Settings
                  </a>
                </Typography>
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
              <Typography variant="body1">Hello, I am a footer</Typography>
              <Copyright />
            </Container>
          </Box>
        </Stack>
      </UserAccountsProvider>
    </ThemeProvider>
  </React.StrictMode>
);
