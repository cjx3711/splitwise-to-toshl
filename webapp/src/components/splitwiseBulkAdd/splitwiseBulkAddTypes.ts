// --- Types ---

export type SplitType =
  | "they_owe_me_all"
  | "i_owe_them_all"
  | "i_paid_50_50"
  | "they_paid_50_50"
  | "custom";

export type SwBulkExpenseRow = {
  _id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  categoryId: number | null;
  categoryDisplay: string;
  friendId: number | null;
  friendDisplay: string;
  splitType: SplitType;
  customPayer: "me" | "them";
  myShares: number;
  theirShares: number;
};

export type SwCategory = {
  id: number;
  name: string;
  parentName?: string;
};

export type SwBulkAddStep = 0 | 1 | 2 | 3;

export type SwBulkAddState = {
  activeStep: SwBulkAddStep;
  csvText: string;
  rows: SwBulkExpenseRow[];
  selectedIds: Set<string>;
  parseErrors: string[];
  duplicateCheckedIds: Set<string>;
  duplicateMatches: Map<string, SplitwiseExpense[]>;
  isLoadingDuplicates: boolean;
  duplicateCheckComplete: boolean;
};

export type SplitwiseExpense = {
  id: number;
  cost: string;
  description: string;
  date: string;
  currency_code: string;
  users: {
    user_id: number;
    paid_share: string;
    owed_share: string;
  }[];
};

// --- Split calculation ---

export type SwSplitShares = {
  mePaidShare: string;
  meOwedShare: string;
  friendPaidShare: string;
  friendOwedShare: string;
};

export function computeSplitShares(
  row: SwBulkExpenseRow
): SwSplitShares {
  const cost = row.amount;
  const fmt = (n: number) => n.toFixed(2);

  switch (row.splitType) {
    case "they_owe_me_all":
      return {
        mePaidShare: fmt(cost),
        meOwedShare: fmt(0),
        friendPaidShare: fmt(0),
        friendOwedShare: fmt(cost),
      };
    case "i_owe_them_all":
      return {
        mePaidShare: fmt(0),
        meOwedShare: fmt(cost),
        friendPaidShare: fmt(cost),
        friendOwedShare: fmt(0),
      };
    case "i_paid_50_50":
      return {
        mePaidShare: fmt(cost),
        meOwedShare: fmt(cost / 2),
        friendPaidShare: fmt(0),
        friendOwedShare: fmt(cost / 2),
      };
    case "they_paid_50_50":
      return {
        mePaidShare: fmt(0),
        meOwedShare: fmt(cost / 2),
        friendPaidShare: fmt(cost),
        friendOwedShare: fmt(cost / 2),
      };
    case "custom": {
      const total = row.myShares + row.theirShares;
      if (total <= 0) {
        return {
          mePaidShare: fmt(0),
          meOwedShare: fmt(0),
          friendPaidShare: fmt(0),
          friendOwedShare: fmt(0),
        };
      }
      const myOwed = (cost * row.myShares) / total;
      const theirOwed = (cost * row.theirShares) / total;
      if (row.customPayer === "me") {
        return {
          mePaidShare: fmt(cost),
          meOwedShare: fmt(myOwed),
          friendPaidShare: fmt(0),
          friendOwedShare: fmt(theirOwed),
        };
      } else {
        return {
          mePaidShare: fmt(0),
          meOwedShare: fmt(myOwed),
          friendPaidShare: fmt(cost),
          friendOwedShare: fmt(theirOwed),
        };
      }
    }
  }
}

// --- CSV parsing ---

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function matchSwCategory(
  csvValue: string,
  categories: SwCategory[]
): SwCategory | null {
  const normalized = normalizeName(csvValue);
  return (
    categories.find((c) => normalizeName(c.name) === normalized) ?? null
  );
}

let rowIdCounter = 0;

export function parseCsvToSwRows(
  csvText: string,
  categories: SwCategory[] = []
): { rows: SwBulkExpenseRow[]; errors: string[] } {
  const errors: string[] = [];
  const rows: SwBulkExpenseRow[] = [];

  const lines = csvText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    errors.push("No data found.");
    return { rows, errors };
  }

  const header = lines[0]
    .toLowerCase()
    .split(",")
    .map((h) => h.trim());
  const expectedHeaders = ["date", "description", "amount", "currency"];
  const missingHeaders = expectedHeaders.filter((h) => !header.includes(h));
  if (missingHeaders.length > 0) {
    errors.push(`Missing headers: ${missingHeaders.join(", ")}`);
    return { rows, errors };
  }

  const colIndex: Record<string, number> = {};
  header.forEach((h, i) => {
    colIndex[h] = i;
  });

  const hasCategoryCol = "category" in colIndex;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const lineNum = i + 1;

    if (cols.length < 4) {
      errors.push(
        `Line ${lineNum}: expected at least 4 columns, got ${cols.length}`
      );
      continue;
    }

    const date = cols[colIndex["date"]];
    const description = cols[colIndex["description"]];
    const amountStr = cols[colIndex["amount"]];
    const currency = (cols[colIndex["currency"]] || "SGD").toUpperCase();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      errors.push(
        `Line ${lineNum}: invalid date "${date}" (expected YYYY-MM-DD)`
      );
      continue;
    }

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      errors.push(
        `Line ${lineNum}: invalid amount "${amountStr}" (expected positive number)`
      );
      continue;
    }

    let categoryId: number | null = null;
    let categoryDisplay = "";
    if (hasCategoryCol) {
      const catVal = cols[colIndex["category"]] ?? "";
      if (catVal) {
        const match = matchSwCategory(catVal, categories);
        if (match) {
          categoryId = match.id;
          categoryDisplay = match.parentName
            ? `${match.parentName} › ${match.name}`
            : match.name;
        } else {
          categoryDisplay = catVal;
        }
      }
    }

    const row: SwBulkExpenseRow = {
      _id: `sw_bulk_${++rowIdCounter}`,
      date,
      description,
      amount,
      currency,
      categoryId,
      categoryDisplay,
      friendId: null,
      friendDisplay: "",
      splitType: "i_paid_50_50",
      customPayer: "me",
      myShares: 1,
      theirShares: 1,
    };

    rows.push(row);
  }

  if (rows.length === 0 && errors.length === 0) {
    errors.push("No valid data rows found.");
  }

  return { rows, errors };
}
