import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

interface ExchangeRatesModalProps {
  open: boolean;
  onClose: () => void;
  rates: Map<string, number> | null;
  ratesStatus: "idle" | "loading" | "loaded" | "error";
}

export function ExchangeRatesModal({
  open,
  onClose,
  rates,
  ratesStatus,
}: ExchangeRatesModalProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Exchange rates</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Exchange rates are fetched from{" "}
            <Link
              href="https://api.frankfurter.app"
              target="_blank"
              rel="noopener noreferrer"
            >
              Frankfurter
            </Link>
            , a free API. Amounts are converted to USD for duplicate comparison.
          </Typography>

          {ratesStatus === "loading" && (
            <Typography variant="body2">Loading rates…</Typography>
          )}

          {ratesStatus === "error" && (
            <Typography variant="body2" color="error">
              Failed to load exchange rates. Duplicate check used fallback rates.
            </Typography>
          )}

          {ratesStatus === "loaded" && rates && rates.size > 0 && (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Currency</TableCell>
                  <TableCell align="right">Rate to USD</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.from(rates.entries())
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([curr, rate]) => (
                    <TableRow key={curr}>
                      <TableCell>{curr}</TableCell>
                      <TableCell align="right">
                        1 {curr} = {rate.toFixed(4)} USD
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
