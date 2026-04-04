import {
  Autocomplete,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo } from "react";
import { SplitwiseFriend } from "../../Friends";
import { SwBulkAddAction } from "../../SplitwiseBulkAdd";
import { SwCategory, SplitType, SwBulkExpenseRow } from "./splitwiseBulkAddTypes";

interface SwBulkActionToolbarProps {
  selectedCount: number;
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
];

function swRowsToCsv(rows: SwBulkExpenseRow[]): string {
  const header = "date,description,amount,currency,category";
  const lines = rows.map((r) =>
    `${r.date},${r.description},${r.amount},${r.currency},${r.categoryDisplay}`
  );
  return [header, ...lines].join("\n");
}

export function SwBulkActionToolbar({
  selectedCount,
  rows,
  selectedIds,
  categories,
  friends,
  dispatch,
}: SwBulkActionToolbarProps) {
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

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        display: "flex",
        alignItems: "center",
        gap: 2,
        flexWrap: "wrap",
      }}>
      <Typography
        variant="body2"
        sx={{ fontWeight: "bold", whiteSpace: "nowrap" }}>
        {selectedCount} selected
      </Typography>

      <Autocomplete
        size="small"
        options={categoryOptions}
        getOptionLabel={(o) => o.label}
        sx={{ minWidth: 220 }}
        disabled={selectedCount === 0}
        onChange={(_, value) => {
          if (value) {
            dispatch({
              type: "SW_BULK_SET_CATEGORY",
              categoryId: value.id,
              categoryDisplay: value.label,
            });
          }
        }}
        renderInput={(params) => (
          <TextField {...params} label="Set Category" />
        )}
      />

      <Autocomplete
        size="small"
        options={friendOptions}
        getOptionLabel={(o) => o.label}
        sx={{ minWidth: 180 }}
        disabled={selectedCount === 0}
        onChange={(_, value) => {
          if (value) {
            dispatch({
              type: "SW_BULK_SET_FRIEND",
              friendId: value.id,
              friendDisplay: value.label,
            });
          }
        }}
        renderInput={(params) => <TextField {...params} label="Set Friend" />}
      />

      <TextField
        select
        size="small"
        label="Set Split"
        sx={{ minWidth: 220 }}
        disabled={selectedCount === 0}
        defaultValue=""
        onChange={(e) => {
          const val = e.target.value as SplitType;
          if (val) {
            dispatch({ type: "SW_BULK_SET_SPLIT_TYPE", splitType: val });
          }
        }}>
        <MenuItem value="" disabled>
          — pick split —
        </MenuItem>
        {SPLIT_OPTIONS.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </TextField>

      <Stack direction="row" spacing={1} sx={{ ml: "auto" }}>
        <Button
          size="small"
          variant="outlined"
          onClick={() => dispatch({ type: "SW_INVERT_SELECTION" })}
        >
          Invert Selection
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={() => {
            const selected = rows.filter((r) => selectedIds.has(r._id));
            if (selected.length === 0) return;
            const csv = swRowsToCsv(selected);
            navigator.clipboard.writeText(csv);
          }}
          disabled={selectedCount === 0}
        >
          Copy Selection as CSV
        </Button>
      </Stack>
    </Paper>
  );
}
