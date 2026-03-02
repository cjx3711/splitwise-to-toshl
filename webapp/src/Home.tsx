import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
} from "@mui/material";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import { AccountState, useUserAccounts } from "./hooks/useAccounts";

function Home() {
  const navigate = useNavigate();
  const {
    accountState,
    loadUserAccounts,
    userAccounts,
    totalCategories,
    totalTags,
    selectedTag,
  } = useUserAccounts();
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    if (
      accountState !== AccountState.SET &&
      accountState !== AccountState.INVALID
    ) {
      loadUserAccounts();
    }
  }, [accountState, loadUserAccounts]);

  const accountsReady = accountState === AccountState.SET;

  return (
    <Container component="main" sx={{ mt: 4, mb: 4 }} maxWidth="md">
      {/* Hero section */}
      <Box sx={{ mb: 6 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <img src="/logo.png" alt="logo" width={60} height={60} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            CJX3711's Finance Toolkit
          </Typography>
        </Stack>
        <Stack spacing={1}>
          <Typography variant="body1" color="text.secondary" component="div">
            My Personal Finance Toolkit. Sync Splitwise with Toshl and use AI to
            extract expenses from receipts and bank CSVs.{" "}
            <Link to="/about" style={{ color: "inherit", fontWeight: 500 }}>
              About
            </Link>
          </Typography>
          <Typography variant="body2" color="text.secondary" component="div">
            No data is stored on the server—everything is stored locally. The
            server is just a proxy.{" "}
            <a
              href="https://github.com/cjx3711/splitwise-to-toshl"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "inherit",
                fontWeight: 500,
                textDecoration: "none",
              }}>
              Open source
            </a>
          </Typography>
        </Stack>
      </Box>

      {/* Account status bar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 4,
          flexWrap: "wrap",
        }}>
        {accountState === AccountState.LOADING ? (
          <>
            <CircularProgress size={16} />
            <Typography variant="body2" color="text.secondary">
              Loading accounts…
            </Typography>
          </>
        ) : accountState === AccountState.SET ? (
          <Typography variant="body2" color="success.main">
            Accounts connected
          </Typography>
        ) : accountState === AccountState.INVALID ? (
          <Typography variant="body2" color="error">
            Could not reach Toshl or Splitwise — check your API keys
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            API keys not set
          </Typography>
        )}
        {accountsReady && (
          <>
            <Typography variant="body2" color="text.secondary">·</Typography>
            <Button
              size="small"
              variant="text"
              onClick={() => setDetailsOpen(true)}>
              Details
            </Button>
          </>
        )}
        <Typography variant="body2" color="text.secondary">·</Typography>
        <Button
          size="small"
          variant="text"
          onClick={() => navigate("/settings")}>
          Settings
        </Button>
      </Box>

      {/* Tool cards */}
      <Grid container spacing={3} justifyContent="center">
        {/* Card 1 — Splitwise to Toshl */}
        <Grid item xs={12} sm={6}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <SwapHorizIcon color="primary" fontSize="large" />
                <Typography variant="h6">Splitwise to Toshl</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Transfer your Splitwise expenses to Toshl.
              </Typography>
            </CardContent>
            <CardActions sx={{ px: 2, pb: 2 }}>
              <Button
                variant="contained"
                size="small"
                disabled={!accountsReady}
                onClick={() => navigate("/friends")}>
                Open Tool
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Card 2 — Bulk Add to Toshl */}
        <Grid item xs={12} sm={6}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <PlaylistAddIcon color="primary" fontSize="large" />
                <Typography variant="h6">Bulk Add to Toshl</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Paste a CSV to bulk-add expenses into Toshl.
              </Typography>
            </CardContent>
            <CardActions sx={{ px: 2, pb: 2 }}>
              <Button
                variant="contained"
                size="small"
                disabled={!accountsReady}
                onClick={() => navigate("/bulk-add")}>
                Open Tool
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Card 3 — Bulk Add to Splitwise */}
        <Grid item xs={12} sm={6}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <GroupAddIcon color="primary" fontSize="large" />
                <Typography variant="h6">Bulk Add to Splitwise</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Paste a CSV to bulk-add shared expenses into Splitwise.
              </Typography>
            </CardContent>
            <CardActions sx={{ px: 2, pb: 2 }}>
              <Button
                variant="contained"
                size="small"
                disabled={!accountsReady}
                onClick={() => navigate("/splitwise-bulk-add")}>
                Open Tool
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      {/* Account details modal */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)}>
        <DialogTitle>Account Details</DialogTitle>
        <DialogContent>
          <Stack spacing={1}>
            <Typography variant="body2">
              <strong>Splitwise:</strong> {userAccounts.splitwise.email}
            </Typography>
            <Typography variant="body2">
              <strong>Toshl:</strong> {userAccounts.toshl.email}
            </Typography>
            <Typography variant="body2">
              <strong>Total Categories:</strong> {totalCategories}
            </Typography>
            <Typography variant="body2">
              <strong>Total Tags:</strong> {totalTags}
            </Typography>
            {selectedTag && (
              <Typography variant="body2">
                <strong>Selected Tag:</strong> {selectedTag.name} ({selectedTag.id})
              </Typography>
            )}
          </Stack>
        </DialogContent>
      </Dialog>
    </Container>
  );
}

export default Home;
