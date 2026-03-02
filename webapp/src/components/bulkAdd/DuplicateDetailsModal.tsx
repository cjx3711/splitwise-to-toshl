import {
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { BulkExpenseRow } from "./bulkAddTypes";
import { ToshlCategory, ToshlExpense, ToshlTag } from "../../hooks/useAccounts";

interface DuplicateDetailsModalProps {
  open: boolean;
  onClose: () => void;
  row: BulkExpenseRow | null;
  matches: ToshlExpense[];
  categories: ToshlCategory[];
  allTags: ToshlTag[];
}

export function DuplicateDetailsModal({
  open,
  onClose,
  row,
  matches,
  categories,
  allTags,
}: DuplicateDetailsModalProps) {
  if (!row) return null;

  const categoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? id;
  const tagNames = (ids: string[]) =>
    ids.map((id) => allTags.find((t) => t.id === id)?.name ?? id).join(", ");

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Possible duplicates</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography variant="subtitle2">New expense (from CSV)</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Currency</TableCell>
                <TableCell>Category</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>{row.date}</TableCell>
                <TableCell>{row.description}</TableCell>
                <TableCell align="right">{row.amount.toFixed(2)}</TableCell>
                <TableCell>{row.currency}</TableCell>
                <TableCell>{row.categoryDisplay}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <Typography variant="subtitle2">Existing expenses in Toshl</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Currency</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Tags</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {matches.map((exp) => (
                <TableRow key={exp.id}>
                  <TableCell>{exp.date}</TableCell>
                  <TableCell>{exp.desc}</TableCell>
                  <TableCell align="right">
                    {Math.abs(exp.amount).toFixed(2)}
                  </TableCell>
                  <TableCell>{exp.currency.code}</TableCell>
                  <TableCell>{categoryName(exp.category)}</TableCell>
                  <TableCell>{exp.tags?.length ? tagNames(exp.tags) : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
