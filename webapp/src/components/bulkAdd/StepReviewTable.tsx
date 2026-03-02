import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { useMemo, useState } from "react";
import { ToshlCategory, ToshlTag } from "../../hooks/useAccounts";
import { BulkExpenseRow } from "./bulkAddTypes";
import { BulkActionToolbar } from "./BulkActionToolbar";
import { BulkAddAction } from "../../BulkAdd";
import { EditDescriptionModal } from "./EditDescriptionModal";
import { EditAmountModal } from "./EditAmountModal";

interface StepReviewTableProps {
  rows: BulkExpenseRow[];
  selectedIds: Set<string>;
  categories: ToshlCategory[];
  allTags: ToshlTag[];
  dispatch: React.Dispatch<BulkAddAction>;
}

export function StepReviewTable({
  rows,
  selectedIds,
  categories,
  allTags,
  dispatch,
}: StepReviewTableProps) {
  const [editDescriptionRow, setEditDescriptionRow] = useState<BulkExpenseRow | null>(null);
  const [editAmountRow, setEditAmountRow] = useState<BulkExpenseRow | null>(null);

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ id: c.id, label: c.name })),
    [categories]
  );

  const tagOptions = useMemo(
    () => allTags.map((t) => ({ id: t.id, label: t.name })),
    [allTags]
  );

  const allSelected = rows.length > 0 && selectedIds.size === rows.length;

  const hasUnmatchedCategory = useMemo(() => {
    return Array.from(selectedIds).some(
      (id) => rows.find((r) => r._id === id)?.categoryId === null
    );
  }, [selectedIds, rows]);

  const statusColor = (s: BulkExpenseRow["matchStatus"]) => {
    if (s === "full") return "success";
    if (s === "partial") return "warning";
    return "error";
  };

  const statusLabel = (s: BulkExpenseRow["matchStatus"]) => {
    if (s === "full") return "OK";
    if (s === "partial") return "Partial";
    return "Unmatched";
  };

  return (
    <Stack spacing={2}>
      <BulkActionToolbar
        selectedCount={selectedIds.size}
        categories={categories}
        allTags={allTags}
        dispatch={dispatch}
      />

      <TableContainer>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={allSelected}
                  indeterminate={selectedIds.size > 0 && !allSelected}
                  onChange={() =>
                    dispatch({
                      type: allSelected ? "DESELECT_ALL" : "SELECT_ALL",
                    })
                  }
                />
              </TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Tags</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row._id} hover>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedIds.has(row._id)}
                    onChange={() =>
                      dispatch({ type: "TOGGLE_SELECT", id: row._id })
                    }
                  />
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>{row.date}</TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Typography variant="body2">{row.description}</Typography>
                    <IconButton
                      size="small"
                      onClick={() => setEditDescriptionRow(row)}
                      aria-label="Edit description"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" alignItems="center" spacing={0.5} justifyContent="flex-end">
                    <Typography variant="body2">
                      {row.amount.toFixed(2)} {row.currency}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => setEditAmountRow(row)}
                      aria-label="Edit amount"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Autocomplete
                    size="small"
                    options={categoryOptions}
                    getOptionLabel={(o) => o.label}
                    value={
                      row.categoryId
                        ? categoryOptions.find((o) => o.id === row.categoryId) ?? null
                        : null
                    }
                    onChange={(_, value) =>
                      dispatch({
                        type: "SET_ROW_CATEGORY",
                        id: row._id,
                        categoryId: value?.id ?? null,
                        categoryDisplay: value?.label ?? row.categoryDisplay,
                      })
                    }
                    sx={{ minWidth: 160 }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="standard"
                        placeholder={row.categoryDisplay || "Category"}
                      />
                    )}
                  />
                </TableCell>
                <TableCell>
                  <Stack spacing={0.5}>
                    {row.tags.length > 0 && (
                      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                        {row.tags.map((tag, idx) => (
                          <Chip
                            key={idx}
                            label={tag.display}
                            size="small"
                            color={tag.toshlId ? "default" : "warning"}
                            onDelete={() =>
                              dispatch({
                                type: "BULK_REMOVE_TAG",
                                rowId: row._id,
                                tagIndex: idx,
                              })
                            }
                          />
                        ))}
                      </Box>
                    )}
                    <Autocomplete
                      size="small"
                      options={tagOptions.filter(
                        (opt) => !row.tags.some((t) => t.toshlId === opt.id)
                      )}
                      getOptionLabel={(o) => o.label}
                      onChange={(_, value) => {
                        if (value) {
                          const existingIds = new Set(row.tags.map((t) => t.toshlId));
                          if (!existingIds.has(value.id)) {
                            dispatch({
                              type: "SET_ROW_TAGS",
                              id: row._id,
                              tags: [
                                ...row.tags,
                                { toshlId: value.id, display: value.label },
                              ],
                            });
                          }
                        }
                      }}
                      value={null}
                      sx={{ minWidth: 120 }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          variant="standard"
                          placeholder="Add tag"
                        />
                      )}
                    />
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip
                    label={statusLabel(row.matchStatus)}
                    color={statusColor(row.matchStatus)}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack direction="row" spacing={2}>
        <Button onClick={() => dispatch({ type: "SET_STEP", step: 0 })}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={() => dispatch({ type: "SET_STEP", step: 2 })}
          disabled={selectedIds.size === 0 || hasUnmatchedCategory}
        >
          Continue
        </Button>
      </Stack>

      {selectedIds.size === 0 && (
        <Typography variant="body2" color="error">
          Please select at least one expense to continue.
        </Typography>
      )}
      {selectedIds.size > 0 && hasUnmatchedCategory && (
        <Typography variant="body2" color="error">
          Please assign a category to all selected expenses before continuing.
        </Typography>
      )}

      <EditDescriptionModal
        open={editDescriptionRow !== null}
        onClose={() => setEditDescriptionRow(null)}
        currentValue={editDescriptionRow?.description ?? ""}
        onSave={(value) => {
          if (editDescriptionRow) {
            dispatch({
              type: "UPDATE_DESCRIPTION",
              id: editDescriptionRow._id,
              description: value,
            });
          }
        }}
      />
      <EditAmountModal
        open={editAmountRow !== null}
        onClose={() => setEditAmountRow(null)}
        currentAmount={editAmountRow?.amount ?? 0}
        currentCurrency={editAmountRow?.currency ?? "USD"}
        onSave={(amount, currency) => {
          if (editAmountRow) {
            dispatch({
              type: "UPDATE_AMOUNT",
              id: editAmountRow._id,
              amount,
              currency,
            });
          }
        }}
      />
    </Stack>
  );
}
