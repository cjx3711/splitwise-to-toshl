import Typography from "@mui/material/Typography";
import { useEffect, useReducer } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Stack,
  Step,
  StepLabel,
  Stepper,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { AccountState, useUserAccounts } from "./hooks/useAccounts";
import {
  BulkAddState,
  BulkAddStep,
  BulkExpenseRow,
  BulkTagEntry,
  computeMatchStatus,
} from "./components/bulkAdd/bulkAddTypes";
import { StepCsvInput } from "./components/bulkAdd/StepCsvInput";
import { StepReviewTable } from "./components/bulkAdd/StepReviewTable";
import { StepDuplicateCheck } from "./components/bulkAdd/StepDuplicateCheck";
import { StepSummary } from "./components/bulkAdd/StepSummary";
import { LlmPromptModal } from "./components/bulkAdd/LlmPromptModal";

// --- Reducer ---

export type BulkAddAction =
  | { type: "SET_CSV_TEXT"; text: string }
  | { type: "PARSE_CSV"; rows: BulkExpenseRow[]; errors: string[] }
  | { type: "SET_STEP"; step: BulkAddStep }
  | { type: "TOGGLE_PROMPT_MODAL" }
  | { type: "TOGGLE_SELECT"; id: string }
  | { type: "SELECT_ALL" }
  | { type: "DESELECT_ALL" }
  | { type: "UPDATE_DESCRIPTION"; id: string; description: string }
  | {
      type: "SET_ROW_CATEGORY";
      id: string;
      categoryId: string | null;
      categoryDisplay: string;
    }
  | { type: "SET_ROW_TAGS"; id: string; tags: BulkTagEntry[] }
  | {
      type: "BULK_SET_CATEGORY";
      categoryId: string;
      categoryDisplay: string;
    }
  | { type: "BULK_ADD_TAGS"; tags: BulkTagEntry[] }
  | { type: "BULK_REMOVE_TAG"; rowId: string; tagIndex: number }
  | { type: "REMOVE_SELECTED_ROWS" };

const initialState: BulkAddState = {
  activeStep: 0,
  csvText: "",
  rows: [],
  selectedIds: new Set(),
  promptModalOpen: false,
  parseErrors: [],
};

function updateRow(
  rows: BulkExpenseRow[],
  id: string,
  updater: (row: BulkExpenseRow) => BulkExpenseRow
): BulkExpenseRow[] {
  return rows.map((r) => (r._id === id ? updater(r) : r));
}

function reducer(state: BulkAddState, action: BulkAddAction): BulkAddState {
  switch (action.type) {
    case "SET_CSV_TEXT":
      return { ...state, csvText: action.text };

    case "PARSE_CSV":
      return {
        ...state,
        rows: action.rows,
        parseErrors: action.errors,
        selectedIds: new Set(),
      };

    case "SET_STEP":
      return { ...state, activeStep: action.step };

    case "TOGGLE_PROMPT_MODAL":
      return { ...state, promptModalOpen: !state.promptModalOpen };

    case "TOGGLE_SELECT": {
      const next = new Set(state.selectedIds);
      if (next.has(action.id)) next.delete(action.id);
      else next.add(action.id);
      return { ...state, selectedIds: next };
    }

    case "SELECT_ALL":
      return {
        ...state,
        selectedIds: new Set(state.rows.map((r) => r._id)),
      };

    case "DESELECT_ALL":
      return { ...state, selectedIds: new Set() };

    case "UPDATE_DESCRIPTION":
      return {
        ...state,
        rows: updateRow(state.rows, action.id, (r) => ({
          ...r,
          description: action.description,
        })),
      };

    case "SET_ROW_CATEGORY":
      return {
        ...state,
        rows: updateRow(state.rows, action.id, (r) => {
          const updated = {
            ...r,
            categoryId: action.categoryId,
            categoryDisplay: action.categoryDisplay,
          };
          updated.matchStatus = computeMatchStatus(
            updated.categoryId,
            updated.tags
          );
          return updated;
        }),
      };

    case "SET_ROW_TAGS":
      return {
        ...state,
        rows: updateRow(state.rows, action.id, (r) => {
          const updated = { ...r, tags: action.tags };
          updated.matchStatus = computeMatchStatus(
            updated.categoryId,
            updated.tags
          );
          return updated;
        }),
      };

    case "BULK_SET_CATEGORY":
      return {
        ...state,
        rows: state.rows.map((r) => {
          if (!state.selectedIds.has(r._id)) return r;
          const updated = {
            ...r,
            categoryId: action.categoryId,
            categoryDisplay: action.categoryDisplay,
          };
          updated.matchStatus = computeMatchStatus(
            updated.categoryId,
            updated.tags
          );
          return updated;
        }),
      };

    case "BULK_ADD_TAGS":
      return {
        ...state,
        rows: state.rows.map((r) => {
          if (!state.selectedIds.has(r._id)) return r;
          // Add only tags not already present
          const existingIds = new Set(r.tags.map((t) => t.toshlId));
          const newTags = action.tags.filter(
            (t) => !existingIds.has(t.toshlId)
          );
          const tags = [...r.tags, ...newTags];
          return {
            ...r,
            tags,
            matchStatus: computeMatchStatus(r.categoryId, tags),
          };
        }),
      };

    case "BULK_REMOVE_TAG":
      return {
        ...state,
        rows: updateRow(state.rows, action.rowId, (r) => {
          const tags = r.tags.filter((_, i) => i !== action.tagIndex);
          return {
            ...r,
            tags,
            matchStatus: computeMatchStatus(r.categoryId, tags),
          };
        }),
      };

    case "REMOVE_SELECTED_ROWS":
      return {
        ...state,
        rows: state.rows.filter((r) => !state.selectedIds.has(r._id)),
        selectedIds: new Set(),
      };

    default:
      return state;
  }
}

// --- Component ---

const stepLabels = ["Paste CSV", "Review & Edit", "Check Duplicates", "Submit"];

export function BulkAdd() {
  const navigate = useNavigate();
  const { accountState, categories, allTags } = useUserAccounts();
  const [state, dispatch] = useReducer(reducer, initialState);
  const { activeStep, csvText, rows, selectedIds, promptModalOpen, parseErrors } = state;

  useEffect(() => {
    if (
      accountState === AccountState.INVALID ||
      accountState === AccountState.UNSET
    ) {
      navigate("/settings");
    }
  }, [accountState, navigate]);

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
          Bulk Add to Toshl
        </Typography>

        <Stepper activeStep={activeStep} alternativeLabel>
          {stepLabels.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 0 && (
          <StepCsvInput
            csvText={csvText}
            parseErrors={parseErrors}
            categories={categories}
            allTags={allTags}
            dispatch={dispatch}
          />
        )}

        {activeStep === 1 && (
          <StepReviewTable
            rows={rows}
            selectedIds={selectedIds}
            categories={categories}
            allTags={allTags}
            dispatch={dispatch}
          />
        )}

        {activeStep === 2 && (
          <StepDuplicateCheck rowCount={rows.length} dispatch={dispatch} />
        )}

        {activeStep === 3 && (
          <StepSummary rowCount={rows.length} dispatch={dispatch} />
        )}
      </Stack>

      <LlmPromptModal
        open={promptModalOpen}
        onClose={() => dispatch({ type: "TOGGLE_PROMPT_MODAL" })}
        categories={categories}
        allTags={allTags}
      />
    </Container>
  );
}
