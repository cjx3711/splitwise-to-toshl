import Typography from "@mui/material/Typography";
import { useEffect, useReducer, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Stack,
  Step,
  StepLabel,
  Stepper,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { AccountState, useUserAccounts } from "./hooks/useAccounts";
import { SplitwiseFriend } from "./Friends";
import {
  SplitwiseExpense,
  SwBulkAddState,
  SwBulkAddStep,
  SwBulkExpenseRow,
  SplitType,
  SwCategory,
} from "./components/splitwiseBulkAdd/splitwiseBulkAddTypes";
import { StepSwCsvInput } from "./components/splitwiseBulkAdd/StepSwCsvInput";
import { StepSwReview } from "./components/splitwiseBulkAdd/StepSwReview";
import { StepSwDuplicateCheck } from "./components/splitwiseBulkAdd/StepSwDuplicateCheck";
import { StepSwSummary } from "./components/splitwiseBulkAdd/StepSwSummary";

// --- Action types ---

export type SwBulkAddAction =
  | { type: "SW_SET_CSV_TEXT"; text: string }
  | { type: "SW_PARSE_CSV"; rows: SwBulkExpenseRow[]; errors: string[] }
  | { type: "SW_SET_STEP"; step: SwBulkAddStep }
  | { type: "SW_TOGGLE_SELECT"; id: string }
  | { type: "SW_SELECT_ALL" }
  | { type: "SW_DESELECT_ALL" }
  | { type: "SW_INVERT_SELECTION" }
  | { type: "SW_UPDATE_DESCRIPTION"; id: string; description: string }
  | { type: "SW_UPDATE_AMOUNT"; id: string; amount: number; currency: string }
  | {
      type: "SW_SET_ROW_CATEGORY";
      id: string;
      categoryId: number | null;
      categoryDisplay: string;
    }
  | {
      type: "SW_SET_ROW_FRIEND";
      id: string;
      friendId: number | null;
      friendDisplay: string;
    }
  | { type: "SW_SET_ROW_SPLIT_TYPE"; id: string; splitType: SplitType }
  | {
      type: "SW_SET_ROW_CUSTOM_PAYER";
      id: string;
      customPayer: "me" | "them";
    }
  | {
      type: "SW_SET_ROW_CUSTOM_SHARES";
      id: string;
      myShares: number;
      theirShares: number;
    }
  | {
      type: "SW_BULK_SET_CATEGORY";
      categoryId: number;
      categoryDisplay: string;
    }
  | {
      type: "SW_BULK_SET_FRIEND";
      friendId: number;
      friendDisplay: string;
    }
  | { type: "SW_BULK_SET_SPLIT_TYPE"; splitType: SplitType }
  | { type: "SW_TOGGLE_DUPLICATE_CHECKED"; id: string }
  | { type: "SW_SELECT_ALL_DUPLICATES" }
  | { type: "SW_DESELECT_ALL_DUPLICATES" }
  | {
      type: "SW_SET_DUPLICATE_MATCHES";
      matches: Map<string, SplitwiseExpense[]>;
    }
  | { type: "SW_SET_DUPLICATE_CHECK_LOADING"; loading: boolean }
  | { type: "SW_SET_DUPLICATE_CHECK_COMPLETE" };

// --- Initial state ---

const initialState: SwBulkAddState = {
  activeStep: 0,
  csvText: "",
  rows: [],
  selectedIds: new Set(),
  parseErrors: [],
  duplicateCheckedIds: new Set(),
  duplicateMatches: new Map(),
  isLoadingDuplicates: false,
  duplicateCheckComplete: false,
};

function updateRow(
  rows: SwBulkExpenseRow[],
  id: string,
  updater: (row: SwBulkExpenseRow) => SwBulkExpenseRow
): SwBulkExpenseRow[] {
  return rows.map((r) => (r._id === id ? updater(r) : r));
}

function reducer(state: SwBulkAddState, action: SwBulkAddAction): SwBulkAddState {
  switch (action.type) {
    case "SW_SET_CSV_TEXT":
      return { ...state, csvText: action.text };

    case "SW_PARSE_CSV":
      return {
        ...state,
        rows: action.rows,
        parseErrors: action.errors,
        selectedIds: new Set(action.rows.map((r) => r._id)),
        duplicateCheckedIds: new Set(),
        duplicateMatches: new Map(),
        duplicateCheckComplete: false,
      };

    case "SW_SET_STEP":
      return { ...state, activeStep: action.step };

    case "SW_TOGGLE_SELECT": {
      const next = new Set(state.selectedIds);
      if (next.has(action.id)) next.delete(action.id);
      else next.add(action.id);
      return { ...state, selectedIds: next };
    }

    case "SW_SELECT_ALL":
      return {
        ...state,
        selectedIds: new Set(state.rows.map((r) => r._id)),
      };

    case "SW_DESELECT_ALL":
      return { ...state, selectedIds: new Set() };

    case "SW_INVERT_SELECTION": {
      const inverted = new Set(
        state.rows.filter((r) => !state.selectedIds.has(r._id)).map((r) => r._id)
      );
      return { ...state, selectedIds: inverted };
    }

    case "SW_UPDATE_DESCRIPTION":
      return {
        ...state,
        rows: updateRow(state.rows, action.id, (r) => ({
          ...r,
          description: action.description,
        })),
      };

    case "SW_UPDATE_AMOUNT":
      return {
        ...state,
        rows: updateRow(state.rows, action.id, (r) => ({
          ...r,
          amount: action.amount,
          currency: action.currency.toUpperCase(),
        })),
      };

    case "SW_SET_ROW_CATEGORY":
      return {
        ...state,
        rows: updateRow(state.rows, action.id, (r) => ({
          ...r,
          categoryId: action.categoryId,
          categoryDisplay: action.categoryDisplay,
        })),
      };

    case "SW_SET_ROW_FRIEND":
      return {
        ...state,
        rows: updateRow(state.rows, action.id, (r) => ({
          ...r,
          friendId: action.friendId,
          friendDisplay: action.friendDisplay,
        })),
      };

    case "SW_SET_ROW_SPLIT_TYPE":
      return {
        ...state,
        rows: updateRow(state.rows, action.id, (r) => ({
          ...r,
          splitType: action.splitType,
        })),
      };

    case "SW_SET_ROW_CUSTOM_PAYER":
      return {
        ...state,
        rows: updateRow(state.rows, action.id, (r) => ({
          ...r,
          customPayer: action.customPayer,
        })),
      };

    case "SW_SET_ROW_CUSTOM_SHARES":
      return {
        ...state,
        rows: updateRow(state.rows, action.id, (r) => ({
          ...r,
          myShares: action.myShares,
          theirShares: action.theirShares,
        })),
      };

    case "SW_BULK_SET_CATEGORY":
      return {
        ...state,
        rows: state.rows.map((r) =>
          state.selectedIds.has(r._id)
            ? { ...r, categoryId: action.categoryId, categoryDisplay: action.categoryDisplay }
            : r
        ),
      };

    case "SW_BULK_SET_FRIEND":
      return {
        ...state,
        rows: state.rows.map((r) =>
          state.selectedIds.has(r._id)
            ? { ...r, friendId: action.friendId, friendDisplay: action.friendDisplay }
            : r
        ),
      };

    case "SW_BULK_SET_SPLIT_TYPE":
      return {
        ...state,
        rows: state.rows.map((r) =>
          state.selectedIds.has(r._id) ? { ...r, splitType: action.splitType } : r
        ),
      };

    case "SW_TOGGLE_DUPLICATE_CHECKED": {
      const next = new Set(state.duplicateCheckedIds);
      if (next.has(action.id)) next.delete(action.id);
      else next.add(action.id);
      return { ...state, duplicateCheckedIds: next };
    }

    case "SW_SELECT_ALL_DUPLICATES":
      return {
        ...state,
        duplicateCheckedIds: new Set(
          state.rows
            .filter((r) => state.selectedIds.has(r._id))
            .map((r) => r._id)
        ),
      };

    case "SW_DESELECT_ALL_DUPLICATES":
      return { ...state, duplicateCheckedIds: new Set() };

    case "SW_SET_DUPLICATE_MATCHES":
      return { ...state, duplicateMatches: action.matches };

    case "SW_SET_DUPLICATE_CHECK_LOADING":
      return { ...state, isLoadingDuplicates: action.loading };

    case "SW_SET_DUPLICATE_CHECK_COMPLETE":
      return { ...state, duplicateCheckComplete: true };

    default:
      return state;
  }
}

// --- Component ---

const stepLabels = ["Paste CSV", "Review & Edit", "Check Duplicates", "Submit"];

export function SplitwiseBulkAdd() {
  const navigate = useNavigate();
  const { accountState } = useUserAccounts();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [friends, setFriends] = useState<SplitwiseFriend[]>([]);
  const [categories, setCategories] = useState<SwCategory[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const {
    activeStep,
    csvText,
    rows,
    selectedIds,
    parseErrors,
    duplicateCheckedIds,
    duplicateMatches,
    isLoadingDuplicates,
    duplicateCheckComplete,
  } = state;

  useEffect(() => {
    if (
      accountState === AccountState.INVALID ||
      accountState === AccountState.UNSET
    ) {
      navigate("/settings");
    }
  }, [accountState, navigate]);

  useEffect(() => {
    if (accountState !== AccountState.SET) return;

    const splitwiseAPIKey = localStorage.getItem("splitwiseAPIKey");
    if (!splitwiseAPIKey) return;

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${splitwiseAPIKey}`,
    };

    const fetchFriends = fetch("/api/splitwise/v3.0/get_friends", {
      method: "GET",
      headers,
    }).then((r) => r.json());

    const fetchCategories = fetch("/api/splitwise/v3.0/get_categories", {
      method: "GET",
      headers,
    }).then((r) => r.json());

    Promise.all([fetchFriends, fetchCategories])
      .then(([friendsData, categoriesData]) => {
        const friendList: SplitwiseFriend[] = friendsData.friends ?? [];
        friendList.sort((a, b) => {
          const aName = [a.first_name, a.last_name].filter(Boolean).join(" ");
          const bName = [b.first_name, b.last_name].filter(Boolean).join(" ");
          return aName.localeCompare(bName);
        });
        setFriends(friendList);

        const flatCategories: SwCategory[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (categoriesData.categories ?? []).forEach((parent: any) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (parent.subcategories ?? []).forEach((sub: any) => {
            flatCategories.push({
              id: sub.id,
              name: sub.name,
              parentName: parent.name,
            });
          });
        });
        setCategories(flatCategories);
      })
      .catch(console.error)
      .finally(() => setLoadingData(false));
  }, [accountState]);

  if (loadingData && accountState === AccountState.SET) {
    return (
      <Container component="main" sx={{ mt: 4, mb: 4 }} maxWidth="lg">
        <Stack spacing={3} alignItems="center">
          <CircularProgress />
          <Typography>Loading friends and categories…</Typography>
        </Stack>
      </Container>
    );
  }

  return (
    <Container component="main" sx={{ mt: 4, mb: 4 }} maxWidth="lg">
      <Stack spacing={3}>
        <Box>
          <Button
            startIcon={<ArrowBackIcon />}
            size="small"
            onClick={() => navigate("/")}>
            Back
          </Button>
        </Box>

        <Typography variant="h4" component="h1">
          Bulk Add to Splitwise
        </Typography>

        <Stepper activeStep={activeStep} alternativeLabel>
          {stepLabels.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 0 && (
          <StepSwCsvInput
            csvText={csvText}
            parseErrors={parseErrors}
            categories={categories}
            dispatch={dispatch}
          />
        )}

        {activeStep === 1 && (
          <StepSwReview
            rows={rows}
            selectedIds={selectedIds}
            categories={categories}
            friends={friends}
            dispatch={dispatch}
          />
        )}

        {activeStep === 2 && (
          <StepSwDuplicateCheck
            rows={rows.filter((r) => selectedIds.has(r._id))}
            duplicateCheckedIds={duplicateCheckedIds}
            duplicateMatches={duplicateMatches}
            isLoadingDuplicates={isLoadingDuplicates}
            duplicateCheckComplete={duplicateCheckComplete}
            dispatch={dispatch}
          />
        )}

        {activeStep === 3 && (
          <StepSwSummary
            rows={rows}
            selectedIds={selectedIds}
            duplicateCheckedIds={duplicateCheckedIds}
            dispatch={dispatch}
          />
        )}
      </Stack>
    </Container>
  );
}
