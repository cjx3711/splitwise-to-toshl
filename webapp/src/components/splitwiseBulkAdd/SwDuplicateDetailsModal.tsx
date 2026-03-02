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
import { SplitwiseExpense, SwBulkExpenseRow } from "./splitwiseBulkAddTypes";

interface SwDuplicateDetailsModalProps {
  open: boolean;
  onClose: () => void;
  row: SwBulkExpenseRow | null;
  matches: SplitwiseExpense[];
}

export function SwDuplicateDetailsModal({
  open,
  onClose,
  row,
  matches,
}: SwDuplicateDetailsModalProps) {
  if (!row) return null;

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
                <TableCell>{row.categoryDisplay || "—"}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <Typography variant="subtitle2">
            Existing expenses in Splitwise
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Currency</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {matches.map((exp) => (
                <TableRow key={exp.id}>
                  <TableCell>{exp.date.slice(0, 10)}</TableCell>
                  <TableCell>{exp.description}</TableCell>
                  <TableCell align="right">
                    {parseFloat(exp.cost).toFixed(2)}
                  </TableCell>
                  <TableCell>{exp.currency_code}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
