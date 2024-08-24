import Typography from "@mui/material/Typography";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, CircularProgress, Container } from "@mui/material";
import { AccountState, useUserAccounts } from "./hooks/useAccounts";

function Home() {
  const splitwiseAPIKey = localStorage.getItem("splitwiseAPIKey");
  const toshlAPIKey = localStorage.getItem("toshlAPIKey");

  const navigate = useNavigate();
  const {
    userAccounts,
    loadUserAccounts,
    accountState,
    totalCategories,
    totalTags,
    selectedTag,
  } = useUserAccounts();

  useEffect(() => {
    if (
      accountState !== AccountState.SET &&
      accountState !== AccountState.INVALID
    ) {
      loadUserAccounts();
    }
  }, [accountState, loadUserAccounts, navigate, splitwiseAPIKey, toshlAPIKey]);

  return (
    <Container component="main" sx={{ mt: 8, mb: 2 }} maxWidth="sm">
      <Typography variant="h2" component="h1" gutterBottom>
        Splitwise to Toshl
      </Typography>

      <Typography variant="h6" component="h2" gutterBottom>
        This is a tool to transfer your Splitwise transactions to Toshl.
      </Typography>
      <Typography variant="h6" component="h2" gutterBottom>
        All processing is done on your machine.
      </Typography>
      <Typography variant="h6" component="h2" gutterBottom>
        No data is stored on the server.
      </Typography>
      <Typography variant="body1" component="p" gutterBottom>
        This tool is open source. You can view the code{" "}
        <a href="https://github.com/cjx3711/splitwise-to-toshl" target="_blank">
          here
        </a>
        .
      </Typography>

      <Box sx={{ mt: 5 }}>
        {accountState === AccountState.INVALID && (
          <Typography variant="body1" component="div" gutterBottom color="red">
            <div>Could not reach toshl or splitwise servers</div>
            <div>
              Either your keys are invalid, or the internet isn't working
            </div>
          </Typography>
        )}
        {accountState === AccountState.LOADING ? (
          <Box>
            <CircularProgress />
            <Typography>Loading Accounts...</Typography>
          </Box>
        ) : accountState === AccountState.SET ? (
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              navigate("/friends");
            }}>
            Start
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              navigate("/settings");
            }}>
            Set API Keys
          </Button>
        )}
      </Box>

      {accountState === AccountState.SET && (
        <Box sx={{ mt: 5 }}>
          <Typography variant="body1" component="div" gutterBottom>
            <div>Accounts:</div>
            <div>Splitwise: {userAccounts.splitwise.email} </div>
            <div>Toshl: {userAccounts.toshl.email} </div>
            <div>Total Categories: {totalCategories}</div>
            <div>Total Tags: {totalTags}</div>
            <div>
              Selected Tag: {selectedTag?.name} ({selectedTag?.id})
            </div>
            <a href="/settings">Settings</a>
          </Typography>
        </Box>
      )}
    </Container>
  );
}

export default Home;
