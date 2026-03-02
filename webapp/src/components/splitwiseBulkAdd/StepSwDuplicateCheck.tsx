import {
  Alert,
  Button,
  Checkbox,
  CircularProgress,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useCallback, useEffect, useState } from "react";
import { SwBulkAddAction } from "../../SplitwiseBulkAdd";
import { SplitwiseExpense, SwBulkExpenseRow } from "./splitwiseBulkAddTypes";
import { fetchRatesToUSD } from "../bulkAdd/currencyUtils";
import { SwDuplicateDetailsModal } from "./SwDuplicateDetailsModal";
import { ExchangeRatesModal } from "../bulkAdd/ExchangeRatesModal";

interface StepSwDuplicateCheckProps {
  rows: SwBulkExpenseRow[];
  duplicateCheckedIds: Set<string>;
  duplicateMatches: Map<string, SplitwiseExpense[]>;
  isLoadingDuplicates: boolean;
  duplicateCheckComplete: boolean;
  dispatch: React.Dispatch<SwBulkAddAction>;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function StepSwDuplicateCheck({
  rows,
  duplicateCheckedIds,
  duplicateMatches,
  isLoadingDuplicates,
  duplicateCheckComplete,
  dispatch,
}: StepSwDuplicateCheckProps) {
  const [ratesStatus, setRatesStatus] = useState<
    "idle" | "loading" | "loaded" | "error"
  >("idle");
  const [ratesLoaded, setRatesLoaded] = useState<Map<string, number> | null>(null);
  const [ratesModalOpen, setRatesModalOpen] = useState(false);
  const [detailsRow, setDetailsRow] = useState<SwBulkExpenseRow | null>(null);

  const runDuplicateCheck = useCallback(async () => {
    if (rows.length === 0) {
      dispatch({ type: "SW_SET_DUPLICATE_CHECK_LOADING", loading: false });
      dispatch({ type: "SW_SET_DUPLICATE_CHECK_COMPLETE" });
      return;
    }

    const dates = rows.map((r) => r.date).sort();
    const minDate = addDays(dates[0], -2);
    const maxDate = addDays(dates[dates.length - 1], 2);

    dispatch({ type: "SW_SET_DUPLICATE_CHECK_LOADING", loading: true });

    const splitwiseAPIKey = localStorage.getItem("splitwiseAPIKey");
    if (!splitwiseAPIKey) {
      dispatch({ type: "SW_SET_DUPLICATE_CHECK_LOADING", loading: false });
      dispatch({ type: "SW_SET_DUPLICATE_CHECK_COMPLETE" });
      return;
    }

    try {
      const res = await fetch(
        `/api/splitwise/v3.0/get_expenses?dated_after=${minDate}&dated_before=${maxDate}&limit=500`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${splitwiseAPIKey}`,
          },
        }
      );
      const data = await res.json();
      const existingExpenses: SplitwiseExpense[] = Array.isArray(data.expenses)
        ? data.expenses
        : [];

      const currencies = [
        ...new Set([
          ...rows.map((r) => r.currency),
          ...existingExpenses.map((e) => e.currency_code),
        ]),
      ];

      setRatesStatus("loading");
      let ratesToUSD: Map<string, number>;
      try {
        ratesToUSD = await fetchRatesToUSD(currencies);
        setRatesLoaded(ratesToUSD);
        setRatesStatus("loaded");
      } catch {
        setRatesStatus("error");
        ratesToUSD = new Map(currencies.map((c) => [c.toUpperCase(), 1]));
      }

      const matches = new Map<string, SplitwiseExpense[]>();
      for (const row of rows) {
        const rowDate = new Date(row.date).getTime();
        const rowRate = ratesToUSD.get(row.currency.toUpperCase()) ?? 1;
        const rowAmountUSD = row.amount * rowRate;

        const dups = existingExpenses.filter((exp) => {
          const expDate = new Date(exp.date).getTime();
          const daysDiff = Math.abs(rowDate - expDate) / DAY_MS;
          if (daysDiff > 2) return false;

          const expCost = parseFloat(exp.cost);
          const expRate =
            ratesToUSD.get(exp.currency_code.toUpperCase()) ?? 1;
          const expAmountUSD = expCost * expRate;

          const maxAmt = Math.max(rowAmountUSD, expAmountUSD, 0.01);
          return Math.abs(rowAmountUSD - expAmountUSD) / maxAmt <= 0.1;
        });

        if (dups.length > 0) {
          matches.set(row._id, dups);
        }
      }

      dispatch({ type: "SW_SET_DUPLICATE_MATCHES", matches });
      dispatch({ type: "SW_SELECT_ALL_DUPLICATES" });
    } catch (err) {
      console.error("Duplicate check failed:", err);
    } finally {
      dispatch({ type: "SW_SET_DUPLICATE_CHECK_LOADING", loading: false });
      dispatch({ type: "SW_SET_DUPLICATE_CHECK_COMPLETE" });
    }
  }, [rows, dispatch]);

  useEffect(() => {
    if (rows.length > 0 && !duplicateCheckComplete && !isLoadingDuplicates) {
      runDuplicateCheck();
    }
  }, [rows.length, duplicateCheckComplete, isLoadingDuplicates, runDuplicateCheck]);

  const allChecked =
    rows.length > 0 && duplicateCheckedIds.size === rows.length;

  if (rows.length === 0) {
    return (
      <Stack spacing={2}>
        <Alert severity="info">
          No rows selected. Go back and select the rows you want to add.
        </Alert>
        <Button onClick={() => dispatch({ type: "SW_SET_STEP", step: 1 })}>
          Back
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      {isLoadingDuplicates && (
        <Alert severity="info" icon={<CircularProgress size={20} />}>
          <Typography variant="body2">
            Checking for duplicates in Splitwise…
          </Typography>
        </Alert>
      )}

      {!isLoadingDuplicates && duplicateCheckComplete && (
        <Alert severity="info">
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
            <Typography variant="body2">
              Expenses within 10% amount and 2 days are flagged as potential
              duplicates. Review any warnings before continuing.
            </Typography>
            <Button
              size="small"
              variant="text"
              onClick={() => setRatesModalOpen(true)}>
              Exchange rate details
            </Button>
          </Stack>
        </Alert>
      )}

      <TableContainer>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={allChecked}
                  indeterminate={duplicateCheckedIds.size > 0 && !allChecked}
                  onChange={() =>
                    dispatch({
                      type: allChecked
                        ? "SW_DESELECT_ALL_DUPLICATES"
                        : "SW_SELECT_ALL_DUPLICATES",
                    })
                  }
                />
              </TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Friend</TableCell>
              <TableCell>Duplicates</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const matches = duplicateMatches.get(row._id) ?? [];
              const hasDuplicates = matches.length > 0;
              return (
                <TableRow key={row._id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={duplicateCheckedIds.has(row._id)}
                      onChange={() =>
                        dispatch({
                          type: "SW_TOGGLE_DUPLICATE_CHECKED",
                          id: row._id,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {row.date}
                  </TableCell>
                  <TableCell>{row.description}</TableCell>
                  <TableCell align="right">
                    {row.amount.toFixed(2)} {row.currency}
                  </TableCell>
                  <TableCell>{row.categoryDisplay || "—"}</TableCell>
                  <TableCell>{row.friendDisplay || "—"}</TableCell>
                  <TableCell>
                    {hasDuplicates ? (
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.5}>
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => setDetailsRow(row)}
                          aria-label={`${matches.length} possible duplicate(s)`}>
                          <WarningAmberIcon />
                        </IconButton>
                        <Typography variant="caption" color="text.secondary">
                          {matches.length} possible
                        </Typography>
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        —
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack direction="row" spacing={2}>
        <Button onClick={() => dispatch({ type: "SW_SET_STEP", step: 1 })}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={() => dispatch({ type: "SW_SET_STEP", step: 3 })}>
          Continue
        </Button>
      </Stack>

      <SwDuplicateDetailsModal
        open={detailsRow !== null}
        onClose={() => setDetailsRow(null)}
        row={detailsRow}
        matches={detailsRow ? (duplicateMatches.get(detailsRow._id) ?? []) : []}
      />
      <ExchangeRatesModal
        open={ratesModalOpen}
        onClose={() => setRatesModalOpen(false)}
        rates={ratesLoaded}
        ratesStatus={ratesStatus}
      />
    </Stack>
  );
}
