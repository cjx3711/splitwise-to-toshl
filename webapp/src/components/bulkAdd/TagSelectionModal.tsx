import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import { ToshlTag } from "../../hooks/useAccounts";

interface TagSelectionModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  tags: ToshlTag[];
  currentTag: ToshlTag | undefined;
  onSave: (tagId: string) => void;
}

export function TagSelectionModal({
  open,
  onClose,
  title,
  tags,
  currentTag,
  onSave,
}: TagSelectionModalProps) {
  const [selected, setSelected] = useState<ToshlTag | null>(currentTag ?? null);

  useEffect(() => {
    if (open) {
      setSelected(currentTag ?? null);
    }
  }, [open, currentTag]);

  const handleSave = () => {
    if (selected) {
      onSave(selected.id);
      onClose();
    }
  };

  const tagOptions = tags.map((t) => ({ id: t.id, label: t.name }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Autocomplete
          options={tagOptions}
          getOptionLabel={(o) => o.label}
          value={
            selected
              ? { id: selected.id, label: selected.name }
              : null
          }
          onChange={(_, value) => {
            setSelected(
              value ? tags.find((t) => t.id === value.id) ?? null : null
            );
          }}
          renderInput={(params) => (
            <TextField {...params} label="Tag" variant="outlined" />
          )}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={!selected}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
