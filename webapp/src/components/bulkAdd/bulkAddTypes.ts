import { ToshlCategory, ToshlExpense, ToshlTag } from "../../hooks/useAccounts";

// --- Types ---

export type BulkExpenseRow = {
  _id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  categoryId: string | null;
  categoryDisplay: string;
  tags: BulkTagEntry[];
  matchStatus: "full" | "partial" | "none";
};

export type BulkTagEntry = {
  toshlId: string | null;
  display: string;
};

export type BulkAddStep = 0 | 1 | 2 | 3;

export type BulkAddState = {
  activeStep: BulkAddStep;
  csvText: string;
  rows: BulkExpenseRow[];
  selectedIds: Set<string>;
  promptModalOpen: boolean;
  parseErrors: string[];
  duplicateCheckedIds: Set<string>;
  duplicateMatches: Map<string, ToshlExpense[]>;
  isLoadingDuplicates: boolean;
  duplicateCheckComplete: boolean;
};

// --- Utility functions ---

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export function matchCategory(
  csvValue: string,
  categories: ToshlCategory[]
): { id: string; name: string } | null {
  const normalized = normalizeName(csvValue);
  const found = categories.find((c) => normalizeName(c.name) === normalized);
  return found ? { id: found.id, name: found.name } : null;
}

export function matchTag(
  csvValue: string,
  allTags: ToshlTag[]
): { id: string; name: string } | null {
  const normalized = normalizeName(csvValue);
  const found = allTags.find((t) => normalizeName(t.name) === normalized);
  return found ? { id: found.id, name: found.name } : null;
}

export function computeMatchStatus(
  categoryId: string | null,
  tags: BulkTagEntry[]
): "full" | "partial" | "none" {
  const catMatched = categoryId !== null;
  const allTagsMatched = tags.length === 0 || tags.every((t) => t.toshlId !== null);
  if (catMatched && allTagsMatched) return "full";
  if (catMatched || tags.some((t) => t.toshlId !== null)) return "partial";
  return "none";
}

let rowIdCounter = 0;

export function parseCsvToRows(
  csvText: string,
  categories: ToshlCategory[],
  allTags: ToshlTag[]
): { rows: BulkExpenseRow[]; errors: string[] } {
  const errors: string[] = [];
  const rows: BulkExpenseRow[] = [];

  const lines = csvText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    errors.push("No data found.");
    return { rows, errors };
  }

  // Validate header
  const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
  const expectedHeaders = ["date", "description", "amount", "currency", "category", "tags"];
  const missingHeaders = expectedHeaders.filter((h) => !header.includes(h));
  if (missingHeaders.length > 0) {
    errors.push(`Missing headers: ${missingHeaders.join(", ")}`);
    return { rows, errors };
  }

  const colIndex: Record<string, number> = {};
  header.forEach((h, i) => {
    colIndex[h] = i;
  });

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const lineNum = i + 1;

    if (cols.length < header.length) {
      errors.push(`Line ${lineNum}: expected ${header.length} columns, got ${cols.length}`);
      continue;
    }

    const date = cols[colIndex["date"]];
    const description = cols[colIndex["description"]];
    const amountStr = cols[colIndex["amount"]];
    const currency = cols[colIndex["currency"]] || "SGD";
    const categoryVal = cols[colIndex["category"]];
    const tagsVal = cols[colIndex["tags"]] || "";

    // Validate date
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      errors.push(`Line ${lineNum}: invalid date "${date}" (expected YYYY-MM-DD)`);
      continue;
    }

    // Validate amount
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      errors.push(`Line ${lineNum}: invalid amount "${amountStr}" (expected positive number)`);
      continue;
    }

    // Match category
    const catMatch = matchCategory(categoryVal, categories);

    // Match tags
    const tagNames = tagsVal
      .split("|")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    const tagEntries: BulkTagEntry[] = tagNames.map((tn) => {
      const tagMatch = matchTag(tn, allTags);
      return {
        toshlId: tagMatch ? tagMatch.id : null,
        display: tagMatch ? tagMatch.name : tn,
      };
    });

    const row: BulkExpenseRow = {
      _id: `bulk_${++rowIdCounter}`,
      date,
      description,
      amount,
      currency: currency.toUpperCase(),
      categoryId: catMatch ? catMatch.id : null,
      categoryDisplay: catMatch ? catMatch.name : categoryVal,
      tags: tagEntries,
      matchStatus: computeMatchStatus(catMatch ? catMatch.id : null, tagEntries),
    };

    rows.push(row);
  }

  if (rows.length === 0 && errors.length === 0) {
    errors.push("No valid data rows found.");
  }

  return { rows, errors };
}
