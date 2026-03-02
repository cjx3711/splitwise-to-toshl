import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import { useMemo } from "react";
import { SwCategory } from "./splitwiseBulkAddTypes";
import { normalizeName } from "../bulkAdd/bulkAddTypes";

interface SwLlmPromptModalProps {
  open: boolean;
  onClose: () => void;
  categories: SwCategory[];
}

export function SwLlmPromptModal({
  open,
  onClose,
  categories,
}: SwLlmPromptModalProps) {
  const promptText = useMemo(() => {
    const categoryList = categories
      .map((c) => `  ${normalizeName(c.name)}`)
      .join("\n");

    const ex1 = categories[0] ? normalizeName(categories[0].name) : "dining";
    const ex2 = categories[1] ? normalizeName(categories[1].name) : "transport";

    return `Convert my expense data into the following CSV format. Output ONLY the CSV with a header row, no other text.

Columns: date,description,amount,currency,category

Rules:
- date: YYYY-MM-DD format
- description: short text, no commas
- amount: positive number (e.g. 42.50)
- currency: 3-letter code (e.g. SGD, USD). Default to SGD if not specified.
- category: one of the snake_case values listed below (use exact snake_case name). Leave empty if unsure.

Available categories:
${categoryList}

Example output:
date,description,amount,currency,category
2024-01-15,Dinner at restaurant,42.50,SGD,${ex1}
2024-01-16,Grab ride,12.00,SGD,${ex2}`;
  }, [categories]);

  const handleCopy = () => {
    navigator.clipboard.writeText(promptText);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>LLM Prompt for CSV Formatting</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            multiline
            fullWidth
            rows={20}
            value={promptText}
            InputProps={{ readOnly: true }}
            sx={{ fontFamily: "monospace" }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCopy} variant="contained">
          Copy to Clipboard
        </Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
