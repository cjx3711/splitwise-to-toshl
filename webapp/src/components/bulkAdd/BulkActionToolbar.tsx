import { Autocomplete, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { useMemo } from "react";
import { ToshlCategory, ToshlTag } from "../../hooks/useAccounts";
import { BulkAddAction } from "../../BulkAdd";

interface BulkActionToolbarProps {
  selectedCount: number;
  categories: ToshlCategory[];
  allTags: ToshlTag[];
  dispatch: React.Dispatch<BulkAddAction>;
}

export function BulkActionToolbar({
  selectedCount,
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
          color="error"
          variant="outlined"
          onClick={() => dispatch({ type: "REMOVE_SELECTED_ROWS" })}>
          Remove Selected
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={() => dispatch({ type: "DESELECT_ALL" })}>
          Deselect All
        </Button>
      </Stack>
    </Paper>
  );
}
