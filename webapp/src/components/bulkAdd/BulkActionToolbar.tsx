import { Autocomplete, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { useMemo } from "react";
import { ToshlCategory, ToshlTag } from "../../hooks/useAccounts";
import { BulkAddAction } from "../../BulkAdd";
import { BulkExpenseRow } from "./bulkAddTypes";

interface BulkActionToolbarProps {
  selectedCount: number;
  rows: BulkExpenseRow[];
  selectedIds: Set<string>;
  categories: ToshlCategory[];
  allTags: ToshlTag[];
  dispatch: React.Dispatch<BulkAddAction>;
}

function rowsToCsv(rows: BulkExpenseRow[]): string {
  const header = "date,description,amount,currency,category,tags";
  const lines = rows.map((r) => {
    const tags = r.tags.map((t) => t.display).join("|");
    return `${r.date},${r.description},${r.amount},${r.currency},${r.categoryDisplay},${tags}`;
  });
  return [header, ...lines].join("\n");
}

export function BulkActionToolbar({
  selectedCount,
  rows,
  selectedIds,
  categories,
  allTags,
  dispatch,
}: BulkActionToolbarProps) {
  const categoryOptions = useMemo(
    () => categories.map((c) => ({ id: c.id, label: c.name })),
    [categories]
  );

  const tagOptions = useMemo(
    () => allTags.map((t) => ({ id: t.id, label: t.name })),
    [allTags]
  );

  return (
    <Paper
      elevation={2}
      sx={{ p: 2, mb: 2, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
      <Typography variant="body2" sx={{ fontWeight: "bold", whiteSpace: "nowrap" }}>
        {selectedCount} selected
      </Typography>

      <Autocomplete
        size="small"
        options={categoryOptions}
        getOptionLabel={(o) => o.label}
        sx={{ minWidth: 200 }}
        onChange={(_, value) => {
          if (value) {
            dispatch({
              type: "BULK_SET_CATEGORY",
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
        multiple
        size="small"
        options={tagOptions}
        getOptionLabel={(o) => o.label}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        sx={{ minWidth: 200 }}
        onChange={(_, values) => {
          if (values.length > 0) {
            dispatch({
              type: "BULK_ADD_TAGS",
              tags: values.map((v) => ({ toshlId: v.id, display: v.label })),
            });
          }
        }}
        renderInput={(params) => <TextField {...params} label="Add Tags" />}
      />

      <Stack direction="row" spacing={1} sx={{ ml: "auto" }}>
        <Button
          size="small"
          variant="outlined"
          onClick={() => dispatch({ type: "INVERT_SELECTION" })}
        >
          Invert Selection
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={() => {
            const selected = rows.filter((r) => selectedIds.has(r._id));
            if (selected.length === 0) return;
            const csv = rowsToCsv(selected);
            navigator.clipboard.writeText(csv);
          }}
          disabled={selectedCount === 0}
        >
          Copy Selection as CSV
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={() => dispatch({ type: "DESELECT_ALL" })}
          disabled={selectedCount === 0}
        >
          Deselect All
        </Button>
      </Stack>
    </Paper>
  );
}
