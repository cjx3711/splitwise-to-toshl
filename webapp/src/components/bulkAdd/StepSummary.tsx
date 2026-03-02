import {
  Alert,
  Box,
  Button,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { BulkAddAction } from "../../BulkAdd";
import { BulkExpenseRow } from "./bulkAddTypes";
import { useUserAccounts } from "../../hooks/useAccounts";

interface StepSummaryProps {
  rows: BulkExpenseRow[];
  selectedIds: Set<string>;
  duplicateCheckedIds: Set<string>;
  dispatch: React.Dispatch<BulkAddAction>;
}

export function StepSummary({
  rows,
  selectedIds,
  duplicateCheckedIds,
  dispatch,
}: StepSummaryProps) {
  const { bulkAddTag } = useUserAccounts();
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [submitResult, setSubmitResult] = useState<{
    success: number;
    failed: number;
  } | null>(null);

  const rowsToSubmit = useMemo(() => {
    return rows.filter(
      (r) =>
        selectedIds.has(r._id) &&
        duplicateCheckedIds.has(r._id) &&
        r.categoryId !== null
    );
  }, [rows, selectedIds, duplicateCheckedIds]);

  const summaryByCurrency = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rowsToSubmit) {
      const curr = r.currency;
      map.set(curr, (map.get(curr) ?? 0) + r.amount);
    }
    return map;
  }, [rowsToSubmit]);

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rowsToSubmit) {
      const cat = r.categoryDisplay || "Unknown";
      map.set(cat, (map.get(cat) ?? 0) + 1);
    }
    return map;
  }, [rowsToSubmit]);

  const handleSubmit = async () => {
    if (rowsToSubmit.length === 0 || submitting) return;
    if (!bulkAddTag) {
      alert("Please configure the Bulk Add tag in Settings.");
      return;
    }

    const toshlAPIKey = localStorage.getItem("toshlAPIKey");
    if (!toshlAPIKey) {
      alert("Toshl API key not found.");
      return;
    }

    setSubmitting(true);
    setProgress({ current: 0, total: rowsToSubmit.length });
    setSubmitResult(null);

    let success = 0;
    let failed = 0;

    for (let i = 0; i < rowsToSubmit.length; i++) {
      const row = rowsToSubmit[i];
      const tagIds = [
        ...row.tags.map((t) => t.toshlId).filter((id): id is string => id !== null),
        bulkAddTag.id,
      ];

      const data = {
        amount: -Math.abs(row.amount),
        currency: { code: row.currency },
        date: row.date,
        desc: row.description,
        category: row.categoryId,
        tags: tagIds,
      };

      try {
        const res = await fetch("/api/toshl/entries", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${toshlAPIKey}`,
          },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          success++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
      setProgress({ current: i + 1, total: rowsToSubmit.length });
    }

    setSubmitResult({ success, failed });
    setSubmitting(false);
  };

  const progressPercent =
    progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <Stack spacing={2}>
      <Typography variant="body1">
        {rowsToSubmit.length} expense(s) ready to add.
      </Typography>

      {summaryByCurrency.size > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Total by currency
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            {Array.from(summaryByCurrency.entries()).map(([curr, amt]) => (
              <Typography key={curr} variant="body2">
                {curr}: {amt.toFixed(2)}
              </Typography>
            ))}
          </Stack>
        </Box>
      )}

      {categoryBreakdown.size > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            By category
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            {Array.from(categoryBreakdown.entries()).map(([cat, count]) => (
              <Typography key={cat} variant="body2">
                {cat}: {count}
              </Typography>
            ))}
          </Stack>
        </Box>
      )}

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Currency</TableCell>
              <TableCell>Category</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rowsToSubmit.map((row) => (
              <TableRow key={row._id}>
                <TableCell>{row.date}</TableCell>
                <TableCell>{row.description}</TableCell>
                <TableCell align="right">{row.amount.toFixed(2)}</TableCell>
                <TableCell>{row.currency}</TableCell>
                <TableCell>{row.categoryDisplay}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {submitting && (
        <Box>
          <Typography variant="body2" gutterBottom>
            {progress.current} of {progress.total} added
          </Typography>
          <LinearProgress variant="determinate" value={progressPercent} />
        </Box>
      )}

      {submitResult && !submitting && (
        <Alert
          severity={submitResult.failed > 0 ? "warning" : "success"}
        >
          {submitResult.success} added successfully
          {submitResult.failed > 0 && `, ${submitResult.failed} failed`}
        </Alert>
      )}

      <Stack direction="row" spacing={2}>
        {!submitResult && (
          <>
            <Button
              onClick={() => dispatch({ type: "SET_STEP", step: 2 })}
              disabled={submitting}
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={
                submitting ||
                rowsToSubmit.length === 0 ||
                !bulkAddTag
              }
            >
              {submitting ? "Submitting…" : "Submit all"}
            </Button>
          </>
        )}
        {submitResult && (
          <Button
            variant="contained"
            onClick={() => dispatch({ type: "SET_STEP", step: 0 })}
          >
            Done
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
