import { BulkExpenseRow } from "./bulkAddTypes";
import { ToshlExpense } from "../../hooks/useAccounts";

export function convertToUSD(
  amount: number,
  currencyCode: string,
  rateToUSD: number
): number {
  if (currencyCode.toUpperCase() === "USD") return Math.abs(amount);
  return Math.abs(amount) * rateToUSD;
}

const RATES_CACHE: Map<string, number> = new Map();

/**
 * Fetches exchange rates to USD from Frankfurter (https://api.frankfurter.app),
 * a free API that does not require an API key.
 */
export async function fetchRatesToUSD(
  currencies: string[]
): Promise<Map<string, number>> {
  const unique = [...new Set(currencies.map((c) => c.toUpperCase()))].filter(
    (c) => c !== "USD"
  );
  if (unique.length === 0) {
    const result = new Map<string, number>();
    result.set("USD", 1);
    return result;
  }

  const toFetch = unique.filter((c) => !RATES_CACHE.has(c));
  if (toFetch.length > 0) {
    try {
      const res = await fetch(
        `https://api.frankfurter.app/latest?from=USD&to=${toFetch.join(",")}`
      );
      const data = await res.json();
      if (data.rates) {
        for (const [curr, rate] of Object.entries(data.rates)) {
          RATES_CACHE.set(curr, 1 / (rate as number));
        }
      }
    } catch {
      for (const c of toFetch) {
        RATES_CACHE.set(c, 1);
      }
    }
  }

  RATES_CACHE.set("USD", 1);
  const result = new Map<string, number>();
  for (const c of currencies.map((x) => x.toUpperCase())) {
    result.set(c, RATES_CACHE.get(c) ?? 1);
  }
  return result;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function findDuplicates(
  row: BulkExpenseRow,
  existingExpenses: ToshlExpense[],
  ratesToUSD: Map<string, number>
): ToshlExpense[] {
  const rowDate = new Date(row.date).getTime();
  const rowAmountUSD = convertToUSD(
    row.amount,
    row.currency,
    ratesToUSD.get(row.currency.toUpperCase()) ?? 1
  );

  return existingExpenses.filter((exp) => {
    const expDate = new Date(exp.date).getTime();
    const daysDiff = Math.abs(rowDate - expDate) / DAY_MS;
    if (daysDiff > 2) return false;

    const expRate =
      ratesToUSD.get(exp.currency.code.toUpperCase()) ??
      exp.currency.rate ??
      exp.currency.main_rate ??
      1;
    const expAmountUSD = convertToUSD(
      Math.abs(exp.amount),
      exp.currency.code,
      expRate
    );
    const maxAmount = Math.max(rowAmountUSD, expAmountUSD, 0.01);
    const amountDiff = Math.abs(rowAmountUSD - expAmountUSD) / maxAmount;
    return amountDiff <= 0.1;
  });
}
