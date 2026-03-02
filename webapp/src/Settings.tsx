import {
  Box,
  Button,
  Chip,
  Container,
  Input,
  InputLabel,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TagSelectionModal } from "./components/bulkAdd/TagSelectionModal";
import { useUserAccounts } from "./hooks/useAccounts";

const last10Characters = (str: string | null) => {
  if (!str) {
    return "";
  }
  return `*************${str.slice(-10)}`;
};

export function Settings() {
  const [saved, setSaved] = useState(false);
  const [splitwiseAPIKey, setSplitwiseAPIKey] = useState("");
  const [toshlAPIKey, setToshlAPIKey] = useState("");

  const placeholderSplitwise = localStorage.getItem("splitwiseAPIKey") || "";
  const placeholderToshl = localStorage.getItem("toshlAPIKey") || "";

  const {
    selectedTag,
    setSelectedTag,
    bulkAddTag,
    setBulkAddTag,
    allTags,
    loadUserAccounts,
  } = useUserAccounts();

  const [splitwiseTagModalOpen, setSplitwiseTagModalOpen] = useState(false);
  const [bulkAddTagModalOpen, setBulkAddTagModalOpen] = useState(false);

  useEffect(() => {
    loadUserAccounts();
  }, [loadUserAccounts]);

  const navigate = useNavigate();
  const saveKeys = () => {
    if (saved) return;
    if (!splitwiseAPIKey || !toshlAPIKey) {
      alert("Please fill in both API keys.");
      return;
    }
    localStorage.setItem("splitwiseAPIKey", splitwiseAPIKey);
    localStorage.setItem("toshlAPIKey", toshlAPIKey);
    setSaved(true);
  };

  const done = () => {
    navigate("/");
  };
  return (
    <Container component="main" sx={{ mt: 8, mb: 2 }} maxWidth="sm">
      <Typography variant="h2" component="h1" gutterBottom>
        Settings
      </Typography>
      <Typography variant="h5" component="h2" gutterBottom>
        {"Configure your Splitwise and Toshl API keys."}
      </Typography>
      <Box sx={{ m: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        <InputLabel>Splitwise API Key</InputLabel>
        <Input
          value={splitwiseAPIKey}
          onChange={(e) => {
            setSplitwiseAPIKey(e.target.value);
            setSaved(false);
          }}
          placeholder={
            placeholderSplitwise ? last10Characters(placeholderSplitwise) : ""
          }
          fullWidth
        />
        <InputLabel>Toshl API Key</InputLabel>
        <Input
          value={toshlAPIKey}
          onChange={(e) => {
            setToshlAPIKey(e.target.value);
            setSaved(false);
          }}
          placeholder={
            placeholderToshl ? last10Characters(placeholderToshl) : ""
          }
          fullWidth
        />
        <Button
          variant="contained"
          color="primary"
          onClick={saveKeys}
          disabled={saved}
        >
          {saved ? "Saved" : "Save"}
        </Button>
        <Button variant="contained" color="primary" onClick={done}>
          Back
        </Button>
      </Box>
      <Typography variant="body2" component="h2" gutterBottom>
        These keys are stored on your local machine, and are not sent to the
        server.
      </Typography>
      <Typography variant="body2" component="h2" gutterBottom>
        If you clear your cache these will be deleted{" "}
      </Typography>

      <Typography variant="body2" component="h2" gutterBottom>
        Tag to append to expenses
      </Typography>

      <Stack spacing={2}>
        <Box>
          <Button
            variant="outlined"
            onClick={() => setSplitwiseTagModalOpen(true)}
          >
            Configure Splitwise-to-Toshl tag
          </Button>
          {selectedTag && (
            <Chip
              label={selectedTag.name}
              size="small"
              sx={{ ml: 2 }}
            />
          )}
        </Box>
        <Box>
          <Button
            variant="outlined"
            onClick={() => setBulkAddTagModalOpen(true)}
          >
            Configure Bulk Add tag
          </Button>
          {bulkAddTag && (
            <Chip
              label={bulkAddTag.name}
              size="small"
              sx={{ ml: 2 }}
            />
          )}
        </Box>
      </Stack>

      <TagSelectionModal
        open={splitwiseTagModalOpen}
        onClose={() => setSplitwiseTagModalOpen(false)}
        title="Splitwise-to-Toshl tag"
        tags={allTags}
        currentTag={selectedTag}
        onSave={(id) => setSelectedTag(id)}
      />
      <TagSelectionModal
        open={bulkAddTagModalOpen}
        onClose={() => setBulkAddTagModalOpen(false)}
        title="Bulk Add tag"
        tags={allTags}
        currentTag={bulkAddTag}
        onSave={(id) => setBulkAddTag(id)}
      />
    </Container>
  );
}
