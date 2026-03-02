import {
  Alert,
  Button,
  Checkbox,
  Chip,
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
import { useUserAccounts } from "../../hooks/useAccounts";
import { BulkAddAction } from "../../BulkAdd";
import { BulkExpenseRow } from "./bulkAddTypes";
import { DuplicateDetailsModal } from "./DuplicateDetailsModal";
import { ExchangeRatesModal } from "./ExchangeRatesModal";
import {
  fetchRatesToUSD,
  findDuplicates,
} from "./currencyUtils";
import { ToshlExpense } from "../../hooks/useAccounts";

interface StepDuplicateCheckProps {
  rows: BulkExpenseRow[];
  duplicateCheckedIds: Set<string>;
  duplicateMatches: Map<string, ToshlExpense[]>;
  isLoadingDuplicates: boolean;
  duplicateCheckComplete: boolean;
  dispatch: React.Dispatch<BulkAddAction>;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function StepDuplicateCheck({
  rows,
  duplicateCheckedIds,
  duplicateMatches,
  isLoadingDuplicates,
  duplicateCheckComplete,
  dispatch,
}: StepDuplicateCheckProps) {
  const { categories, allTags } = useUserAccounts();
  const [duplicateModalRow, setDuplicateModalRow] = useState<BulkExpenseRow | null>(null);
  const [ratesModalOpen, setRatesModalOpen] = useState(false);
  const [ratesStatus, setRatesStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [ratesLoaded, setRatesLoaded] = useState<Map<string, number> | null>(null);

  const runDuplicateCheck = useCallback(async () => {
    const rowsToCheck = rows;
    if (rowsToCheck.length === 0) {
      dispatch({ type: "SET_DUPLICATE_CHECK_LOADING", loading: false });
      dispatch({ type: "SET_DUPLICATE_CHECK_COMPLETE" });
      return;
    }

    const dates = rowsToCheck.map((r) => r.date).sort();
    const minDate = addDays(dates[0], -1);
    const maxDate = addDays(dates[dates.length - 1], 1);

    dispatch({ type: "SET_DUPLICATE_CHECK_LOADING", loading: true });

    const toshlAPIKey = localStorage.getItem("toshlAPIKey");
    if (!toshlAPIKey) {
      dispatch({ type: "SET_DUPLICATE_CHECK_LOADING", loading: false });
      dispatch({ type: "SET_DUPLICATE_CHECK_COMPLETE" });
      return;
    }

    try {
      const res = await fetch(
        `/api/toshl/entries?type=expense&from=${minDate}&to=${maxDate}&per_page=500`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${toshlAPIKey}`,
          },
        }
      );
      const data = await res.json();
      const existingExpenses: ToshlExpense[] = Array.isArray(data) ? data : [];

      const currencies = [
        ...new Set([
          ...rowsToCheck.map((r) => r.currency),
          ...existingExpenses.map((e) => e.currency.code),
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

      const matches = new Map<string, ToshlExpense[]>();
      for (const row of rowsToCheck) {
        const dups = findDuplicates(row, existingExpenses, ratesToUSD);
        if (dups.length > 0) {
          matches.set(row._id, dups);
        }
      }

      dispatch({ type: "SET_DUPLICATE_MATCHES", matches });
      dispatch({ type: "SELECT_ALL_DUPLICATES" });
    } catch (err) {
      console.error("Duplicate check failed:", err);
    } finally {
      dispatch({ type: "SET_DUPLICATE_CHECK_LOADING", loading: false });
      dispatch({ type: "SET_DUPLICATE_CHECK_COMPLETE" });
    }
  }, [rows, dispatch]);

  useEffect(() => {
    if (rows.length > 0 && !duplicateCheckComplete && !isLoadingDuplicates) {
      runDuplicateCheck();
    }
  }, [rows.length, duplicateCheckComplete, isLoadingDuplicates, runDuplicateCheck]);

  const allChecked = rows.length > 0 && duplicateCheckedIds.size === rows.length;

  if (rows.length === 0) {
    return (
      <Stack spacing={2}>
        <Alert severity="info">
          No rows selected. Go back to Step 2 and select the rows you want to add.
        </Alert>
        <Button onClick={() => dispatch({ type: "SET_STEP", step: 1 })}>
          Back
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      {isLoadingDuplicates && (
        <Alert
          severity="info"
          icon={<CircularProgress size={20} />}
        >
          <Typography variant="body2">
            Checking for duplicates…
          </Typography>
        </Alert>
      )}

      {!isLoadingDuplicates && duplicateCheckComplete && (
        <Alert severity="info">
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
            <Typography variant="body2">
              Expenses within 10% amount and 2 days are flagged. Review any warnings before continuing.
            </Typography>
            <Button
              size="small"
              variant="text"
              onClick={() => setRatesModalOpen(true)}
            >
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
                  indeterminate={
                    duplicateCheckedIds.size > 0 && !allChecked
                  }
                  onChange={() =>
                    dispatch({
                      type: allChecked
                        ? "DESELECT_ALL_DUPLICATES"
                        : "SELECT_ALL_DUPLICATES",
                    })
                  }
                />
              </TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Category & Tags</TableCell>
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
                          type: "TOGGLE_DUPLICATE_CHECKED",
                          id: row._id,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{row.date}</TableCell>
                  <TableCell>{row.description}</TableCell>
                  <TableCell align="right">{row.amount.toFixed(2)} {row.currency}</TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography variant="body2">
                        {row.categoryDisplay || "—"}
                      </Typography>
                      {row.tags.filter((t) => t.toshlId !== null).length > 0 && (
                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                          {row.tags
                            .filter((t) => t.toshlId !== null)
                            .map((tag, idx) => (
                              <Chip
                                key={idx}
                                label={tag.display}
                                size="small"
                              />
                            ))}
                        </Stack>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {hasDuplicates ? (
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => setDuplicateModalRow(row)}
                          aria-label={`${matches.length} possible duplicate(s)`}
                        >
                          <WarningAmberIcon />
                        </IconButton>
                        <Typography variant="caption" color="text.secondary">
                          {matches.length}
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
        <Button onClick={() => dispatch({ type: "SET_STEP", step: 1 })}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={() => dispatch({ type: "SET_STEP", step: 3 })}
        >
          Continue
        </Button>
      </Stack>

      <DuplicateDetailsModal
        open={duplicateModalRow !== null}
        onClose={() => setDuplicateModalRow(null)}
        row={duplicateModalRow}
        matches={duplicateModalRow ? duplicateMatches.get(duplicateModalRow._id) ?? [] : []}
        categories={categories}
        allTags={allTags}
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
