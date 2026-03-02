import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { useState, useEffect } from "react";
import { fetchRatesToUSD } from "./currencyUtils";

const COMMON_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "SGD",
  "JPY",
  "CNY",
  "AUD",
  "CAD",
  "CHF",
  "HKD",
  "NZD",
  "KRW",
  "INR",
  "THB",
  "MYR",
  "IDR",
  "PHP",
  "VND",
];

interface EditAmountModalProps {
  open: boolean;
  onClose: () => void;
  currentAmount: number;
  currentCurrency: string;
  onSave: (amount: number, currency: string) => void;
}

export function EditAmountModal({
  open,
  onClose,
  currentAmount,
  currentCurrency,
  onSave,
}: EditAmountModalProps) {
  const [amount, setAmount] = useState(currentAmount.toString());
  const [currency, setCurrency] = useState(currentCurrency.toUpperCase());
  const [usdAmount, setUsdAmount] = useState<number | null>(null);
  const [loadingRate, setLoadingRate] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount(currentAmount.toString());
      setCurrency(currentCurrency.toUpperCase());
      setUsdAmount(null);
    }
  }, [open, currentAmount, currentCurrency]);

  useEffect(() => {
    if (!open) return;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setUsdAmount(null);
      return;
    }

    if (currency === "USD") {
      setUsdAmount(numAmount);
      return;
    }

    setLoadingRate(true);
    fetchRatesToUSD([currency])
      .then((rates) => {
        const rate = rates.get(currency.toUpperCase()) ?? 1;
        setUsdAmount(numAmount * rate);
      })
      .catch(() => {
        setUsdAmount(null);
      })
      .finally(() => {
        setLoadingRate(false);
      });
  }, [open, amount, currency]);

  const handleSave = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return;
    }
    onSave(numAmount, currency);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit amount</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            autoFocus
            label="Amount"
            type="number"
            fullWidth
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            variant="outlined"
            inputProps={{ step: "0.01", min: "0.01" }}
          />
          <TextField
            select
            label="Currency"
            fullWidth
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            variant="outlined"
          >
            {COMMON_CURRENCIES.map((curr) => (
              <MenuItem key={curr} value={curr}>
                {curr}
              </MenuItem>
            ))}
          </TextField>
          {loadingRate && (
            <Typography variant="body2" color="text.secondary">
              Loading exchange rate…
            </Typography>
          )}
          {!loadingRate && usdAmount !== null && (
            <Typography variant="body2" color="text.secondary">
              ≈ {usdAmount.toFixed(2)} USD
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isNaN(parseFloat(amount)) || parseFloat(amount) <= 0}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
