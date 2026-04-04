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
import { useCallback, useMemo, useState } from "react";
import { SwBulkAddAction } from "../../SplitwiseBulkAdd";
import { SwBulkExpenseRow, computeSplitShares } from "./splitwiseBulkAddTypes";
import { useUserAccounts } from "../../hooks/useAccounts";

function swRowsToCsv(rows: SwBulkExpenseRow[]): string {
  const header = "date,description,amount,currency,category";
  const lines = rows.map((r) =>
    `${r.date},${r.description},${r.amount},${r.currency},${r.categoryDisplay}`
  );
  return [header, ...lines].join("\n");
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

interface StepSwSummaryProps {
  rows: SwBulkExpenseRow[];
  selectedIds: Set<string>;
  duplicateCheckedIds: Set<string>;
  dispatch: React.Dispatch<SwBulkAddAction>;
}

export function StepSwSummary({
  rows,
  selectedIds,
  duplicateCheckedIds,
  dispatch,
}: StepSwSummaryProps) {
  const { userAccounts } = useUserAccounts();
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
        r.categoryId !== null &&
        r.friendId !== null
    );
  }, [rows, selectedIds, duplicateCheckedIds]);

  const summaryByCurrency = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rowsToSubmit) {
      map.set(r.currency, (map.get(r.currency) ?? 0) + r.amount);
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

    const splitwiseAPIKey = localStorage.getItem("splitwiseAPIKey");
    if (!splitwiseAPIKey) {
      alert("Splitwise API key not found.");
      return;
    }

    const myId = userAccounts.splitwise.id;
    if (!myId) {
      alert("Could not determine your Splitwise user ID.");
      return;
    }

    setSubmitting(true);
    setProgress({ current: 0, total: rowsToSubmit.length });
    setSubmitResult(null);

    let success = 0;
    let failed = 0;

    for (let i = 0; i < rowsToSubmit.length; i++) {
      const row = rowsToSubmit[i];
      const shares = computeSplitShares(row);

      const body = {
        cost: row.amount.toFixed(2),
        description: row.description,
        date: `${row.date}T00:00:00Z`,
        currency_code: row.currency,
        category_id: row.categoryId,
        users__0__user_id: myId,
        users__0__paid_share: shares.mePaidShare,
        users__0__owed_share: shares.meOwedShare,
        users__1__user_id: row.friendId,
        users__1__paid_share: shares.friendPaidShare,
        users__1__owed_share: shares.friendOwedShare,
      };

      try {
        const res = await fetch("/api/splitwise/v3.0/create_expense", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${splitwiseAPIKey}`,
          },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          success++;
        } else {
          failed++;
          const errText = await res.text();
          console.error(`Failed to create expense: ${errText}`);
        }
      } catch (err) {
        console.error("Request error:", err);
        failed++;
      }
      setProgress({ current: i + 1, total: rowsToSubmit.length });
    }

    setSubmitResult({ success, failed });
    setSubmitting(false);
  };

  const unprocessedRows = useMemo(() => {
    const submittedIds = new Set(rowsToSubmit.map((r) => r._id));
    return rows.filter((r) => !submittedIds.has(r._id));
  }, [rows, rowsToSubmit]);

  const handleDownloadUnprocessed = useCallback(() => {
    if (unprocessedRows.length === 0) return;
    const csv = swRowsToCsv(unprocessedRows);
    downloadCsv(csv, "unprocessed_splitwise_expenses.csv");
  }, [unprocessedRows]);

  const progressPercent =
    progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <Stack spacing={2}>
      <Typography variant="body1">
        {rowsToSubmit.length} expense(s) ready to add to Splitwise.
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
              <TableCell>Friend</TableCell>
              <TableCell>Split</TableCell>
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
                <TableCell>{row.friendDisplay}</TableCell>
                <TableCell>
                  {row.splitType === "i_paid_50_50" && "I paid, 50:50"}
                  {row.splitType === "they_paid_50_50" && "They paid, 50:50"}
                  {row.splitType === "they_owe_me_all" && "They owe all"}
                  {row.splitType === "i_owe_them_all" && "I owe all"}
                  {row.splitType === "custom" &&
                    `Custom (${row.myShares}:${row.theirShares}, ${row.customPayer === "me" ? "I" : "They"} paid)`}
                </TableCell>
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
        <Alert severity={submitResult.failed > 0 ? "warning" : "success"}>
          {submitResult.success} added successfully
          {submitResult.failed > 0 && `, ${submitResult.failed} failed`}
        </Alert>
      )}

      {submitResult && unprocessedRows.length > 0 && (
        <Alert severity="info">
          {unprocessedRows.length} expense(s) were not processed (unselected or
          failed duplicate check).
        </Alert>
      )}

      <Stack direction="row" spacing={2}>
        {!submitResult && (
          <>
            <Button
              onClick={() => dispatch({ type: "SW_SET_STEP", step: 2 })}
              disabled={submitting}>
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting || rowsToSubmit.length === 0}>
              {submitting ? "Submitting…" : "Submit all"}
            </Button>
          </>
        )}
        {submitResult && (
          <>
            <Button
              variant="contained"
              onClick={() => dispatch({ type: "SW_SET_STEP", step: 0 })}>
              Done
            </Button>
            {unprocessedRows.length > 0 && (
              <Button variant="outlined" onClick={handleDownloadUnprocessed}>
                Download unprocessed CSV ({unprocessedRows.length})
              </Button>
            )}
          </>
        )}
      </Stack>
    </Stack>
  );
}
