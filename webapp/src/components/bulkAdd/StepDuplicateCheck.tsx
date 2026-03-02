import { Alert, Button, Stack, Typography } from "@mui/material";
import { BulkAddAction } from "../../BulkAdd";

interface StepDuplicateCheckProps {
  rowCount: number;
  dispatch: React.Dispatch<BulkAddAction>;
}

export function StepDuplicateCheck({
  rowCount,
  dispatch,
}: StepDuplicateCheckProps) {
  return (
    <Stack spacing={2}>
      <Alert severity="info">
        Duplicate checking coming in a future update.
      </Alert>
      <Typography variant="body2">{rowCount} rows ready to submit.</Typography>
      <Stack direction="row" spacing={2}>
        <Button onClick={() => dispatch({ type: "SET_STEP", step: 1 })}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={() => dispatch({ type: "SET_STEP", step: 3 })}>
          Continue
        </Button>
      </Stack>
    </Stack>
  );
}
