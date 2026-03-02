import { Alert, Button, Stack, Typography } from "@mui/material";
import { BulkAddAction } from "../../BulkAdd";

interface StepSummaryProps {
  rowCount: number;
  dispatch: React.Dispatch<BulkAddAction>;
}

export function StepSummary({ rowCount, dispatch }: StepSummaryProps) {
  return (
    <Stack spacing={2}>
      <Alert severity="info">Submission coming in a future update.</Alert>
      <Typography variant="body2">{rowCount} rows ready to submit.</Typography>
      <Stack direction="row" spacing={2}>
        <Button onClick={() => dispatch({ type: "SET_STEP", step: 2 })}>
          Back
        </Button>
        <Button variant="contained" disabled>
          Submit All
        </Button>
      </Stack>
    </Stack>
  );
}
