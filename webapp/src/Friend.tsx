import {
  Box,
  Button,
  CircularProgress,
  Container,
  FormControlLabel,
  Modal,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AccountState,
  ToshlExpense,
  useUserAccounts,
} from "./hooks/useAccounts";

import { AddExpenseForm } from "./components/AddExpenseForm";
import { Expense, ExpenseListItem } from "./components/ExpenseListItem";
import { SplitwiseFriend } from "./Friends";
import { format, subDays } from "date-fns";

// --- State & Reducer ---

type State = {
  friend: SplitwiseFriend | null;
  expenses: Expense[];
  latestExpenseDate: string | null;
  existingEntriesOnToshl: ToshlExpense[];
  toshlCheckStatus: "idle" | "checking" | "complete";
  toshlCheckRange: { from: string; to: string } | null;
  selectedExpense: Expense | null;
  page: number;
  showInvolved: boolean;
};

type Action =
  | { type: "SET_FRIEND"; friend: SplitwiseFriend }
  | { type: "PAGE_FETCH_STARTED" }
  | { type: "SET_EXPENSES"; expenses: Expense[]; latestExpenseDate: string }
  | { type: "TOSHL_CHECK_STARTED" }
  | { type: "TOSHL_WINDOW_SCANNING"; range: { from: string; to: string }; entries: ToshlExpense[] }
  | { type: "TOSHL_CHECK_COMPLETE" }
  | { type: "SELECT_EXPENSE"; expense: Expense }
  | { type: "DESELECT_EXPENSE" }
  | { type: "PREVIOUS_EXPENSE" }
  | { type: "NEXT_EXPENSE" }
  | { type: "SET_PAGE"; page: number }
  | { type: "SET_SHOW_INVOLVED"; show: boolean };

const initialState: State = {
  friend: null,
  expenses: [],
  latestExpenseDate: null,
  existingEntriesOnToshl: [],
  toshlCheckStatus: "idle",
  toshlCheckRange: null,
  selectedExpense: null,
  page: 0,
  showInvolved: true,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_FRIEND":
      return { ...state, friend: action.friend };

    case "PAGE_FETCH_STARTED":
      return {
        ...state,
        expenses: [],
        latestExpenseDate: null,
        existingEntriesOnToshl: [],
        toshlCheckStatus: "idle",
        toshlCheckRange: null,
      };

    case "SET_EXPENSES":
      return {
        ...state,
        expenses: action.expenses,
        latestExpenseDate: action.latestExpenseDate,
      };

    case "TOSHL_CHECK_STARTED":
      return {
        ...state,
        existingEntriesOnToshl: [],
        toshlCheckStatus: "checking",
        toshlCheckRange: null,
      };

    case "TOSHL_WINDOW_SCANNING":
      return {
        ...state,
        toshlCheckRange: action.range,
        existingEntriesOnToshl: action.entries,
      };

    case "TOSHL_CHECK_COMPLETE":
      return { ...state, toshlCheckStatus: "complete" };

    case "SELECT_EXPENSE":
      return { ...state, selectedExpense: action.expense };

    case "DESELECT_EXPENSE":
      return { ...state, selectedExpense: null };

    case "PREVIOUS_EXPENSE": {
      if (!state.selectedExpense) return state;
      const list = state.showInvolved ? state.expenses.filter(e => e.involved) : state.expenses;
      const idx = list.findIndex(e => e.id === state.selectedExpense!.id);
      if (idx <= 0) return state;
      return { ...state, selectedExpense: list[idx - 1] };
    }

    case "NEXT_EXPENSE": {
      if (!state.selectedExpense) return state;
      const list = state.showInvolved ? state.expenses.filter(e => e.involved) : state.expenses;
      const idx = list.findIndex(e => e.id === state.selectedExpense!.id);
      if (idx === -1 || idx === list.length - 1) return state;
      return { ...state, selectedExpense: list[idx + 1] };
    }

    case "SET_PAGE":
      return { ...state, page: action.page };

    case "SET_SHOW_INVOLVED":
      return { ...state, showInvolved: action.show };

    default:
      return state;
  }
}

// --- Component ---

export function Friend() {
  const { friendId } = useParams();
  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    friend,
    expenses,
    latestExpenseDate,
    existingEntriesOnToshl,
    toshlCheckStatus,
    toshlCheckRange,
    selectedExpense,
    page,
    showInvolved,
  } = state;

  const activeList = showInvolved ? expenses.filter(e => e.involved) : expenses;
  const selectedIdx = selectedExpense ? activeList.findIndex(e => e.id === selectedExpense.id) : -1;

  const count = 30;
  // Ref keeps the current expenses list accessible inside the Toshl effect
  // without making it a dependency (which would cause a re-run on every render).
  const expensesRef = useRef<Expense[]>([]);

  const { userAccounts, accountState, loadUserAccounts, selectedTag } =
    useUserAccounts();
  const navigate = useNavigate();

  // Effect: redirect to home if accounts are not configured
  useEffect(() => {
    async function checkUserAccount() {
      if (accountState !== AccountState.SET) {
        if (!(await loadUserAccounts())) {
          navigate("/");
        }
      }
    }
    checkUserAccount();
  }, [accountState, loadUserAccounts, navigate]);

  // Effect: fetch friend details and expenses for the current page
  useEffect(() => {
    if (friendId === undefined) return;

    const controller = new AbortController();
    const splitwiseAPIKey = localStorage.getItem("splitwiseAPIKey");

    dispatch({ type: "PAGE_FETCH_STARTED" });
    expensesRef.current = [];

    fetch(`/api/splitwise/v3.0/get_friend/${friendId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${splitwiseAPIKey}`,
      },
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        dispatch({ type: "SET_FRIEND", friend: data.friend as SplitwiseFriend });
      })
      .catch((err) => {
        if (err.name !== "AbortError") console.error(err);
      });

    fetch(
      `/api/splitwise/v3.0/get_expenses?friend_id=${friendId}&limit=${count}&offset=${
        page * count
      }`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${splitwiseAPIKey}`,
        },
        signal: controller.signal,
      }
    )
      .then((res) => res.json())
      .then((data) => {
        if (controller.signal.aborted) return;

        const expensesArr = data.expenses;
        const normalisedExpenseArray: Expense[] = [];
        for (const e of expensesArr) {
          if (e.deleted_at) continue;
          const expense: Expense = {
            id: e.id,
            category: e.category.name,
            description: e.description,
            currency: e.currency_code,
            total_amount: parseFloat(e.cost),
            date: e.date.split("T")[0],
            share_amount: 0,
            friends: [],
            involved: false,
          };

          const expenseUsers = e.users;
          for (const eu of expenseUsers) {
            if (eu.user.id != userAccounts.splitwise.id) {
              const fullName = [eu.user.first_name, eu.user.last_name]
                .filter(Boolean)
                .join(" ");
              expense.friends.push(fullName);
            }
          }
          for (const eu of expenseUsers) {
            if (eu.user_id == userAccounts.splitwise.id) {
              expense.share_amount = parseFloat(eu.owed_share);
              break;
            }
          }

          if (expense.share_amount > 0) {
            expense.involved = true;
          }
          normalisedExpenseArray.push(expense);
        }

        expensesRef.current = normalisedExpenseArray;

        const latestExpense = normalisedExpenseArray.reduce(
          (prev, current) => (prev.date > current.date ? prev : current)
        );
        dispatch({
          type: "SET_EXPENSES",
          expenses: normalisedExpenseArray,
          latestExpenseDate: latestExpense.date,
        });
      })
      .catch((err) => {
        if (err.name !== "AbortError") console.error(err);
      });

    return () => controller.abort();
  }, [count, friendId, page, userAccounts.splitwise.id]);

  // Effect: scan Toshl for existing entries covering all expenses on the current page,
  // stepping backwards in 100-day windows until the earliest expense date is covered.
  useEffect(() => {
    if (!latestExpenseDate || !selectedTag || expensesRef.current.length === 0) {
      return;
    }

    const controller = new AbortController();
    const toshlAPIKey = localStorage.getItem("toshlAPIKey");
    const earliestExpenseDate = expensesRef.current.reduce(
      (prev, current) => (prev.date < current.date ? prev : current)
    ).date;

    dispatch({ type: "TOSHL_CHECK_STARTED" });

    async function fetchToshlEntries() {
      const endDate = format(new Date(latestExpenseDate!), "yyyy-MM-dd");
      let windowEnd = endDate;
      let allEntries: ToshlExpense[] = [];

      while (true) {
        const windowStart = format(subDays(new Date(windowEnd), 100), "yyyy-MM-dd");

        const res = await fetch(
          `/api/toshl/entries?type=expense&tags=${selectedTag!.id}&from=${windowStart}&to=${windowEnd}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${toshlAPIKey}`,
            },
            signal: controller.signal,
          }
        );

        const data = await res.json();

        // Guard: discard results if this effect was cleaned up while the fetch was in flight
        if (controller.signal.aborted) return;

        allEntries = [...allEntries, ...(data as ToshlExpense[])];
        dispatch({
          type: "TOSHL_WINDOW_SCANNING",
          range: { from: windowStart, to: endDate },
          entries: allEntries,
        });

        // Stop once the window covers the earliest expense on this page
        if (windowStart <= earliestExpenseDate) break;

        // Step the window back one day before the current start
        windowEnd = format(subDays(new Date(windowStart), 1), "yyyy-MM-dd");
      }

      dispatch({ type: "TOSHL_CHECK_COMPLETE" });
    }

    fetchToshlEntries().catch((err) => {
      if (err.name !== "AbortError") {
        console.error("Toshl fetch error:", err);
      }
    });

    return () => controller.abort();
  }, [selectedTag, latestExpenseDate]);

  const checkIfExpenseExistsOnToshl = useCallback(
    (expense: Expense | null) => {
      if (!existingEntriesOnToshl || !expense) return false;
      return existingEntriesOnToshl.some(
        (e) => `${e.extra.expense_id}` === `${expense.id}`
      );
    },
    [existingEntriesOnToshl]
  );

  return (
    <Container component="main" sx={{ mt: 8, mb: 2 }} maxWidth="sm">
      {friend ? (
        <Box>
          <Typography variant="h2" component="h1">
            {[friend.first_name, friend.last_name].filter(Boolean).join(", ")}
          </Typography>
          <Typography variant="h5" component="h2" gutterBottom>
            {friend.balance[0]?.amount && friend.balance[0]?.amount > 0 && (
              <Box
                component="span"
                sx={{
                  color: "text.secondary",
                  marginLeft: "0.5rem",
                }}>
                (
                {friend.balance
                  .map(
                    (balance) => `${balance.amount} ${balance.currency_code}`
                  )
                  .join(", ")}
                )
              </Box>
            )}
          </Typography>
          <hr />
          {toshlCheckStatus !== "idle" && toshlCheckRange && (
            <Typography
              variant="caption"
              sx={{ color: toshlCheckStatus === "complete" ? "success.main" : "text.secondary" }}>
              {toshlCheckStatus === "checking"
                ? `Checking Toshl: ${toshlCheckRange.from} – ${toshlCheckRange.to}...`
                : `Toshl check complete: ${toshlCheckRange.from} – ${toshlCheckRange.to} (${existingEntriesOnToshl.length} entries found)`}
            </Typography>
          )}
          <Stack
            justifyContent={"space-between"}
            direction={"row"}
            sx={{
              my: 2,
            }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Page: {page + 1}
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  value={showInvolved}
                  onChange={(e) => {
                    dispatch({ type: "SET_SHOW_INVOLVED", show: e.target.checked });
                  }}
                  defaultChecked
                />
              }
              label="Only show expenses I have a share in"
            />
          </Stack>

          {activeList.map((expense) => (
            <ExpenseListItem
              key={expense.description + expense.date}
              expense={expense}
              selectExpense={() => {
                dispatch({ type: "SELECT_EXPENSE", expense });
              }}
              toshlExists={checkIfExpenseExistsOnToshl(expense)}
            />
          ))}

          <Box
            sx={{
              mt: 5,
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
            }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => dispatch({ type: "SET_PAGE", page: page - 1 })}
              disabled={page === 0 || toshlCheckStatus === "checking"}>
              Previous
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => dispatch({ type: "SET_PAGE", page: page + 1 })}
              disabled={toshlCheckStatus === "checking"}>
              Next
            </Button>
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
          <CircularProgress />
        </Box>
      )}
      <Modal open={!!selectedExpense}>
        <AddExpenseForm
          expense={selectedExpense}
          toshlExists={checkIfExpenseExistsOnToshl(selectedExpense)}
          closeModal={() => dispatch({ type: "DESELECT_EXPENSE" })}
          previousExpense={() => dispatch({ type: "PREVIOUS_EXPENSE" })}
          nextExpense={() => dispatch({ type: "NEXT_EXPENSE" })}
          hasNext={selectedIdx !== -1 && selectedIdx < activeList.length - 1}
          hasPrevious={selectedIdx > 0}
        />
      </Modal>
    </Container>
  );
}
