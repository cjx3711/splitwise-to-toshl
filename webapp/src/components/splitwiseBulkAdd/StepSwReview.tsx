import {
  Autocomplete,
  Button,
  Checkbox,
  IconButton,
  MenuItem,
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
import { SplitwiseFriend } from "../../Friends";
import { SwBulkAddAction } from "../../SplitwiseBulkAdd";
import { SwBulkExpenseRow, SwCategory, SplitType } from "./splitwiseBulkAddTypes";
import { EditDescriptionModal } from "../bulkAdd/EditDescriptionModal";
import { EditAmountModal } from "../bulkAdd/EditAmountModal";
import { SwBulkActionToolbar } from "./SwBulkActionToolbar";

interface StepSwReviewProps {
  rows: SwBulkExpenseRow[];
  selectedIds: Set<string>;
  categories: SwCategory[];
  friends: SplitwiseFriend[];
  dispatch: React.Dispatch<SwBulkAddAction>;
}

const SPLIT_OPTIONS: { value: SplitType; label: string }[] = [
  { value: "i_paid_50_50", label: "I paid, 50:50 split" },
  { value: "they_paid_50_50", label: "They paid, 50:50 split" },
  { value: "they_owe_me_all", label: "Other party owes me everything" },
  { value: "i_owe_them_all", label: "I owe other party everything" },
  { value: "custom", label: "Custom" },
];

export function StepSwReview({
  rows,
  selectedIds,
  categories,
  friends,
  dispatch,
}: StepSwReviewProps) {
  const [editDescriptionRow, setEditDescriptionRow] =
    useState<SwBulkExpenseRow | null>(null);
  const [editAmountRow, setEditAmountRow] =
    useState<SwBulkExpenseRow | null>(null);

  const categoryOptions = useMemo(
    () =>
      categories.map((c) => ({
        id: c.id,
        label: c.parentName ? `${c.parentName} › ${c.name}` : c.name,
      })),
    [categories]
  );

  const friendOptions = useMemo(
    () =>
      friends.map((f) => ({
        id: Number(f.id),
        label: [f.first_name, f.last_name].filter(Boolean).join(" "),
      })),
    [friends]
  );

  const allSelected = rows.length > 0 && selectedIds.size === rows.length;

  const hasUnassigned = useMemo(() => {
    return Array.from(selectedIds).some((id) => {
      const row = rows.find((r) => r._id === id);
      return !row || row.categoryId === null || row.friendId === null;
    });
  }, [selectedIds, rows]);

  return (
    <Stack spacing={2}>
      <SwBulkActionToolbar
        selectedCount={selectedIds.size}
        categories={categories}
        friends={friends}
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
                      type: allSelected ? "SW_DESELECT_ALL" : "SW_SELECT_ALL",
                    })
                  }
                />
              </TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell sx={{ minWidth: 180 }}>Category</TableCell>
              <TableCell sx={{ minWidth: 160 }}>Friend</TableCell>
              <TableCell sx={{ minWidth: 200 }}>Split</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row._id} hover>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedIds.has(row._id)}
                    onChange={() =>
                      dispatch({ type: "SW_TOGGLE_SELECT", id: row._id })
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
                      aria-label="Edit description">
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </TableCell>

                <TableCell align="right">
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={0.5}
                    justifyContent="flex-end">
                    <Typography variant="body2">
                      {row.amount.toFixed(2)} {row.currency}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => setEditAmountRow(row)}
                      aria-label="Edit amount">
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
                      row.categoryId !== null
                        ? (categoryOptions.find((o) => o.id === row.categoryId) ??
                          null)
                        : null
                    }
                    onChange={(_, value) =>
                      dispatch({
                        type: "SW_SET_ROW_CATEGORY",
                        id: row._id,
                        categoryId: value?.id ?? null,
                        categoryDisplay: value?.label ?? "",
                      })
                    }
                    sx={{ minWidth: 160 }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="standard"
                        placeholder="Category"
                        error={
                          selectedIds.has(row._id) && row.categoryId === null
                        }
                      />
                    )}
                  />
                </TableCell>

                <TableCell>
                  <Autocomplete
                    size="small"
                    options={friendOptions}
                    getOptionLabel={(o) => o.label}
                    value={
                      row.friendId !== null
                        ? (friendOptions.find((o) => o.id === row.friendId) ??
                          null)
                        : null
                    }
                    onChange={(_, value) =>
                      dispatch({
                        type: "SW_SET_ROW_FRIEND",
                        id: row._id,
                        friendId: value?.id ?? null,
                        friendDisplay: value?.label ?? "",
                      })
                    }
                    sx={{ minWidth: 140 }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="standard"
                        placeholder="Friend"
                        error={
                          selectedIds.has(row._id) && row.friendId === null
                        }
                      />
                    )}
                  />
                </TableCell>

                <TableCell>
                  <Stack spacing={0.5}>
                    <TextField
                      select
                      size="small"
                      variant="standard"
                      value={row.splitType}
                      onChange={(e) =>
                        dispatch({
                          type: "SW_SET_ROW_SPLIT_TYPE",
                          id: row._id,
                          splitType: e.target.value as SplitType,
                        })
                      }
                      sx={{ minWidth: 190 }}>
                      {SPLIT_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </TextField>

                    {row.splitType === "custom" && (
                      <Stack spacing={0.5}>
                        <TextField
                          select
                          size="small"
                          variant="standard"
                          label="Payer"
                          value={row.customPayer}
                          onChange={(e) =>
                            dispatch({
                              type: "SW_SET_ROW_CUSTOM_PAYER",
                              id: row._id,
                              customPayer: e.target.value as "me" | "them",
                            })
                          }>
                          <MenuItem value="me">Me</MenuItem>
                          <MenuItem value="them">
                            {row.friendDisplay || "Friend"}
                          </MenuItem>
                        </TextField>
                        <Stack direction="row" spacing={1}>
                          <TextField
                            size="small"
                            variant="standard"
                            label="My shares"
                            type="number"
                            value={row.myShares}
                            onChange={(e) =>
                              dispatch({
                                type: "SW_SET_ROW_CUSTOM_SHARES",
                                id: row._id,
                                myShares: Math.max(0, Number(e.target.value)),
                                theirShares: row.theirShares,
                              })
                            }
                            inputProps={{ min: 0, step: 1 }}
                            sx={{ width: 80 }}
                          />
                          <TextField
                            size="small"
                            variant="standard"
                            label="Their shares"
                            type="number"
                            value={row.theirShares}
                            onChange={(e) =>
                              dispatch({
                                type: "SW_SET_ROW_CUSTOM_SHARES",
                                id: row._id,
                                myShares: row.myShares,
                                theirShares: Math.max(0, Number(e.target.value)),
                              })
                            }
                            inputProps={{ min: 0, step: 1 }}
                            sx={{ width: 80 }}
                          />
                        </Stack>
                      </Stack>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack direction="row" spacing={2}>
        <Button onClick={() => dispatch({ type: "SW_SET_STEP", step: 0 })}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={() => dispatch({ type: "SW_SET_STEP", step: 2 })}
          disabled={selectedIds.size === 0 || hasUnassigned}>
          Continue
        </Button>
      </Stack>

      {selectedIds.size === 0 && (
        <Typography variant="body2" color="error">
          Please select at least one expense to continue.
        </Typography>
      )}
      {selectedIds.size > 0 && hasUnassigned && (
        <Typography variant="body2" color="error">
          Please assign a category and friend to all selected expenses before
          continuing.
        </Typography>
      )}

      <EditDescriptionModal
        open={editDescriptionRow !== null}
        onClose={() => setEditDescriptionRow(null)}
        currentValue={editDescriptionRow?.description ?? ""}
        onSave={(value) => {
          if (editDescriptionRow) {
            dispatch({
              type: "SW_UPDATE_DESCRIPTION",
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
              type: "SW_UPDATE_AMOUNT",
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
