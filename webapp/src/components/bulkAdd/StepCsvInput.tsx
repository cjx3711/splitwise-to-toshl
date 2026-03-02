import { Alert, Box, Button, Stack, TextField } from "@mui/material";
import { ToshlCategory, ToshlTag } from "../../hooks/useAccounts";
import { parseCsvToRows } from "./bulkAddTypes";
import { BulkAddAction } from "../../BulkAdd";

interface StepCsvInputProps {
  csvText: string;
  parseErrors: string[];
  categories: ToshlCategory[];
  allTags: ToshlTag[];
  dispatch: React.Dispatch<BulkAddAction>;
}

export function StepCsvInput({
  csvText,
  parseErrors,
  categories,
  allTags,
  dispatch,
}: StepCsvInputProps) {
  const handleParse = () => {
    const { rows, errors } = parseCsvToRows(csvText, categories, allTags);
    if (errors.length > 0) {
      dispatch({ type: "PARSE_CSV", rows: [], errors });
    } else {
      dispatch({ type: "PARSE_CSV", rows, errors: [] });
      dispatch({ type: "SET_STEP", step: 1 });
    }
  };

  return (
    <Stack spacing={2}>
      <Alert severity="info">
        Use an LLM to format your data into the expected CSV format.
      </Alert>

      <Button
        variant="outlined"
        onClick={() => dispatch({ type: "TOGGLE_PROMPT_MODAL" })}
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
        {`date,description,amount,currency,category,tags\n2024-01-15,Dinner at restaurant,42.50,SGD,food_drinks,eating_out|restaurants`}
      </Box>

      <TextField
        label="CSV content"
        multiline
        rows={12}
        fullWidth
        value={csvText}
        onChange={(e) =>
          dispatch({ type: "SET_CSV_TEXT", text: e.target.value })
        }
        placeholder="date,description,amount,currency,category,tags"
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
    </Stack>
  );
}
