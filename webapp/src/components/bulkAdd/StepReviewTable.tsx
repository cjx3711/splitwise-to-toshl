import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import { useMemo } from "react";
import { ToshlCategory, ToshlTag } from "../../hooks/useAccounts";
import { BulkExpenseRow } from "./bulkAddTypes";
import { BulkActionToolbar } from "./BulkActionToolbar";
import { BulkAddAction } from "../../BulkAdd";

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
  const categoryOptions = useMemo(
    () => categories.map((c) => ({ id: c.id, label: c.name })),
    [categories]
  );

  const tagOptions = useMemo(
    () => allTags.map((t) => ({ id: t.id, label: t.name })),
    [allTags]
  );

  const allSelected = rows.length > 0 && selectedIds.size === rows.length;

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
      {selectedIds.size > 0 && (
        <BulkActionToolbar
          selectedCount={selectedIds.size}
          categories={categories}
          allTags={allTags}
          dispatch={dispatch}
        />
      )}

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
              <TableCell>Currency</TableCell>
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
                  <TextField
                    variant="standard"
                    size="small"
                    defaultValue={row.description}
                    onBlur={(e) =>
                      dispatch({
                        type: "UPDATE_DESCRIPTION",
                        id: row._id,
                        description: e.target.value,
                      })
                    }
                    sx={{ minWidth: 120 }}
                  />
                </TableCell>
                <TableCell align="right">{row.amount.toFixed(2)}</TableCell>
                <TableCell>{row.currency}</TableCell>
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
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", alignItems: "center" }}>
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
                    <Autocomplete
                      size="small"
                      options={tagOptions}
                      getOptionLabel={(o) => o.label}
                      onChange={(_, value) => {
                        if (value) {
                          dispatch({
                            type: "SET_ROW_TAGS",
                            id: row._id,
                            tags: [
                              ...row.tags,
                              { toshlId: value.id, display: value.label },
                            ],
                          });
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
                  </Box>
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
          onClick={() => dispatch({ type: "SET_STEP", step: 2 })}>
          Continue
        </Button>
      </Stack>
    </Stack>
  );
}
