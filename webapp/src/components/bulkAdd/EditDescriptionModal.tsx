import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
} from "@mui/material";
import { useState, useEffect } from "react";

interface EditDescriptionModalProps {
  open: boolean;
  onClose: () => void;
  currentValue: string;
  onSave: (value: string) => void;
}

export function EditDescriptionModal({
  open,
  onClose,
  currentValue,
  onSave,
}: EditDescriptionModalProps) {
  const [value, setValue] = useState(currentValue);

  useEffect(() => {
    if (open) {
      setValue(currentValue);
    }
  }, [open, currentValue]);

  const handleSave = () => {
    onSave(value);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit description</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          multiline
          rows={3}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          variant="outlined"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
