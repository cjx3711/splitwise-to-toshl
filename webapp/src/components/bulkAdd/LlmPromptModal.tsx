import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import { useMemo, useState } from "react";
import { ToshlCategory, ToshlTag } from "../../hooks/useAccounts";
import { normalizeName } from "./bulkAddTypes";

interface LlmPromptModalProps {
  open: boolean;
  onClose: () => void;
  categories: ToshlCategory[];
  allTags: ToshlTag[];
}

export function LlmPromptModal({
  open,
  onClose,
  categories,
  allTags,
}: LlmPromptModalProps) {
  const [includeTags, setIncludeTags] = useState(true);

  const promptText = useMemo(() => {
    const categoryList = categories
      .map((c) => `  ${normalizeName(c.name)}`)
      .join("\n");
    const tagList = allTags
      .map((t) => `  ${normalizeName(t.name)}`)
      .join("\n");

    let prompt = `Convert my expense data into the following CSV format. Output ONLY the CSV with a header row, no other text.

Columns: date,description,amount,currency,category,tags

Rules:
- date: YYYY-MM-DD format
- description: short text, no commas
- amount: positive number (e.g. 42.50)
- currency: 3-letter code (e.g. SGD, USD). Default to SGD if not specified.
- category: one of the values listed below (use snake_case names exactly)
- tags: pipe-separated (|) from the list below. Leave empty if none apply.

Available categories:
${categoryList}`;

    if (includeTags) {
      prompt += `

Available tags:
${tagList}`;
    }

    prompt += `

Example output:
date,description,amount,currency,category,tags
2024-01-15,Dinner at restaurant,42.50,SGD,food_drinks,eating_out|restaurants
2024-01-16,Grab ride,12.00,SGD,transport,grab`;

    return prompt;
  }, [categories, allTags, includeTags]);

  const handleCopy = () => {
    navigator.clipboard.writeText(promptText);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>LLM Prompt for CSV Formatting</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={includeTags}
                onChange={(e) => setIncludeTags(e.target.checked)}
              />
            }
            label="Include tags in prompt"
          />
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
