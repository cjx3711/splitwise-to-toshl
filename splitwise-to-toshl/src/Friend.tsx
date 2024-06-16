import {
  Box,
  Button,
  Container,
  FormControlLabel,
  Modal,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
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

export function Friend() {
  const { friendId } = useParams();
  const [friend, setFriend] = useState<SplitwiseFriend | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [latestExpenseDate, setLatestExpenseDate] = useState<string | null>();
  const [existingEntriesOnToshl, setExistingEntriesOnToshl] = useState<
    ToshlExpense[]
  >([]);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [selectedExpenseIndex, setSelectedExpenseIndex] = useState<
    number | null
  >(null);
  const [page, setPage] = useState(0);
  const count = 30;
  const [showInvolved, setShowInvolved] = useState(true);

  const { userAccounts, accountState, loadUserAccounts, selectedTag } =
    useUserAccounts();
  const navigate = useNavigate();
  useEffect(() => {
    async function checkUserAccount() {
      if (accountState !== AccountState.SET) {
        if (!(await loadUserAccounts())) {
          navigate("/");
        }
      }
      return true;
    }
    checkUserAccount();
  }, [accountState, loadUserAccounts, navigate]);

  useEffect(() => {
    if (!latestExpenseDate || !selectedTag) {
      return;
    }

    console.log(
      "Getting existing entries on Toshl",
      latestExpenseDate,
      selectedTag.id
    );
    // Get exising entries on Toshl
    // Date range is latest expense - 100 days
    const endDate = format(new Date(latestExpenseDate), "yyyy-MM-dd");
    const startDate = format(
      subDays(new Date(latestExpenseDate), 100),
      "yyyy-MM-dd"
    );
    // Only get the items with the splitwise tag
    fetch(
      `/api/toshl/entries?type=expense&tags=${selectedTag.id}&from=${startDate}&to=${endDate}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("toshlAPIKey")}`,
        },
      }
    )
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setExistingEntriesOnToshl(data as ToshlExpense[]);
      });
  }, [selectedTag, latestExpenseDate]);

  useEffect(() => {
    if (friendId === undefined) {
      return;
    }

    // Get friend details
    fetch(`/api/splitwise/v3.0/get_friend/${friendId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("splitwiseAPIKey")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setFriend(data.friend as SplitwiseFriend);
      });

    // Get expenses
    fetch(
      `/api/splitwise/v3.0/get_expenses?friend_id=${friendId}&limit=${count}&offset=${
        page * count
      }`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("splitwiseAPIKey")}`,
        },
      }
    )
      .then((res) => res.json())
      .then((data) => {
        const expensesArr = data.expenses;
        const normalisedExpenseArray = [];
        for (const e of expensesArr) {
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
        setExpenses(normalisedExpenseArray);
        // Find the latest expense date
        const latestExpenseDate = normalisedExpenseArray.reduce(
          (prev, current) => (prev.date > current.date ? prev : current)
        );

        setLatestExpenseDate(latestExpenseDate.date);
      });
  }, [count, friendId, page, userAccounts.splitwise.id]);

  const checkIfExpenseExistsOnToshl = useCallback(
    (expense: Expense | null) => {
      if (!existingEntriesOnToshl) {
        return false;
      }
      if (!expense) {
        return false;
      }
      return existingEntriesOnToshl.some(
        (e) => `${e.extra.expense_id}` === `${expense.id}`
      );
    },
    [existingEntriesOnToshl]
  );

  const previousExpense = useCallback(() => {
    if (selectedExpenseIndex === null) {
      return;
    }
    if (selectedExpenseIndex === 0) {
      return;
    }
    setSelectedExpenseIndex(selectedExpenseIndex - 1);
    setSelectedExpense(expenses[selectedExpenseIndex - 1]);
  }, [selectedExpenseIndex, expenses]);

  const nextExpense = useCallback(() => {
    if (selectedExpenseIndex === null) {
      return;
    }
    if (selectedExpenseIndex === expenses.length - 1) {
      return;
    }
    setSelectedExpenseIndex(selectedExpenseIndex + 1);
    setSelectedExpense(expenses[selectedExpenseIndex + 1]);
  }, [selectedExpenseIndex, expenses]);

  return (
    <Container component="main" sx={{ mt: 8, mb: 2 }} maxWidth="sm">
      {friend ? (
        <Box>
          <Typography variant="h2" component="h1">
            {[friend.first_name, friend.last_name].filter(Boolean).join(", ")}
          </Typography>
          <Typography variant="h5" component="h2" gutterBottom>
            {friend.balance[0]?.amount && friend.balance[0]?.amount > 0 && (
              <span
                style={{
                  color: "grey",
                  marginLeft: "0.5rem",
                }}>
                (
                {friend.balance
                  .map(
                    (balance) => `${balance.amount} ${balance.currency_code}`
                  )
                  .join(", ")}
                )
              </span>
            )}
          </Typography>
          <hr />
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
                    setShowInvolved(e.target.checked);
                  }}
                  defaultChecked
                />
              }
              label="Only show expenses I have a share in"
            />
          </Stack>

          {showInvolved
            ? expenses
                .filter((e) => e.involved)
                .map((expense, i) => (
                  <ExpenseListItem
                    key={expense.description + expense.date}
                    expense={expense}
                    selectExpense={() => {
                      setSelectedExpense(expense);
                      setSelectedExpenseIndex(i);
                    }}
                    toshlExists={checkIfExpenseExistsOnToshl(expense)}
                  />
                ))
            : expenses.map((expense, i) => (
                <ExpenseListItem
                  key={expense.description + expense.date}
                  expense={expense}
                  selectExpense={() => {
                    setSelectedExpense(expense);
                    setSelectedExpenseIndex(i);
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
              onClick={() => {
                setPage(page - 1);
              }}
              disabled={page === 0}>
              Previous
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setPage(page + 1);
              }}>
              Next
            </Button>
          </Box>
        </Box>
      ) : (
        <Typography variant="h2" component="h1" gutterBottom>
          Loading...
        </Typography>
      )}
      <Modal open={!!selectedExpense}>
        <AddExpenseForm
          expense={selectedExpense}
          toshlExists={checkIfExpenseExistsOnToshl(selectedExpense)}
          closeModal={() => {
            setSelectedExpense(null);
          }}
          previousExpense={previousExpense}
          nextExpense={nextExpense}
          hasNext={
            selectedExpenseIndex !== null &&
            selectedExpenseIndex < expenses.length - 1
          }
          hasPrevious={
            selectedExpenseIndex !== null && selectedExpenseIndex > 0
          }
        />
      </Modal>
    </Container>
  );
}
