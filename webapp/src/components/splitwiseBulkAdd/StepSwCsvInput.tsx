import { Alert, Box, Button, Stack, TextField } from "@mui/material";
import { useMemo, useState } from "react";
import { SwBulkAddAction } from "../../SplitwiseBulkAdd";
import { SwCategory, parseCsvToSwRows } from "./splitwiseBulkAddTypes";
import { SwLlmPromptModal } from "./SwLlmPromptModal";
import { normalizeName } from "../bulkAdd/bulkAddTypes";

interface StepSwCsvInputProps {
  csvText: string;
  parseErrors: string[];
  categories: SwCategory[];
  dispatch: React.Dispatch<SwBulkAddAction>;
}

export function StepSwCsvInput({
  csvText,
  parseErrors,
  categories,
  dispatch,
}: StepSwCsvInputProps) {
  const [promptOpen, setPromptOpen] = useState(false);

  const exampleCsv = useMemo(() => {
    const find = (keywords: string[]) => {
      const cat = categories.find((c) =>
        keywords.some((kw) => normalizeName(c.name).includes(kw))
      );
      return cat ? normalizeName(cat.name) : null;
    };
    const foodCat =
      find(["restaurant", "dining", "food", "eating", "meal", "groceries"]) ??
      (categories[0] ? normalizeName(categories[0].name) : "dining");
    const transportCat =
      find(["taxi", "transport", "car", "bus", "travel", "uber", "grab", "ride"]) ??
      (categories[1] ? normalizeName(categories[1].name) : "transport");
    return `date,description,amount,currency,category\n2024-01-15,Dinner at restaurant,42.50,SGD,${foodCat}\n2024-01-16,Taxi home,18.00,SGD,${transportCat}`;
  }, [categories]);

  const handleParse = () => {
    const { rows, errors } = parseCsvToSwRows(csvText, categories);
    if (errors.length > 0) {
      dispatch({ type: "SW_PARSE_CSV", rows: [], errors });
    } else {
      dispatch({ type: "SW_PARSE_CSV", rows, errors: [] });
      dispatch({ type: "SW_SET_STEP", step: 1 });
    }
  };

  return (
    <Stack spacing={2}>
      <Alert severity="warning">
        <strong>Limitation:</strong> each expense can only involve one other
        friend. For more complex splits, use the Splitwise webapp.
      </Alert>

      <Alert severity="info">
        Use an LLM to format your data into CSV. The prompt includes your
        Splitwise categories so the LLM can pre-fill them automatically.
      </Alert>

      <Button
        variant="outlined"
        onClick={() => setPromptOpen(true)}
        sx={{ alignSelf: "flex-start" }}>
        Show LLM Prompt
      </Button>

      <Box
        component="pre"
        sx={{
          bgcolor: "action.hover",
          borderRadius: 1,
          p: 2,
          fontSize: "0.85rem",
          overflowX: "auto",
        }}>
        {exampleCsv}
      </Box>

      <TextField
        label="CSV content"
        multiline
        rows={12}
        fullWidth
        value={csvText}
        onChange={(e) =>
          dispatch({ type: "SW_SET_CSV_TEXT", text: e.target.value })
        }
        placeholder="date,description,amount,currency,category"
      />

      {parseErrors.map((err, i) => (
        <Alert severity="error" key={i}>
          {err}
        </Alert>
      ))}

      <Box>
        <Button variant="contained" onClick={handleParse}>
          Parse & Continue
        </Button>
      </Box>

      <SwLlmPromptModal
        open={promptOpen}
        onClose={() => setPromptOpen(false)}
        categories={categories}
      />
    </Stack>
  );
}
