import { Box, Typography, Chip, Button } from "@mui/material";

export type Expense = {
  category: string;
  description: string;
  currency: string;
  total_amount: number;
  date: string;
  share_amount: number;
  friends: string[];
  involved: boolean;
};

export const ExpenseListItem = ({
  expense,
  selectExpense,
}: {
  expense: Expense;
  selectExpense: () => void;
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        borderBottom: "1px solid #ccc",
        padding: "1rem",
      }}>
      <Box
        sx={{
          flexGrow: 1,
        }}>
        <Typography variant="h6" component="h3" align="left">
          {expense.description}
        </Typography>
        <Typography variant="body2" component="h3" align="left">
          {expense.date}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
        }}>
        <Typography variant="body1" color="" align="right">
          Total: {expense.total_amount} {expense.currency}
        </Typography>
        {expense.involved ? (
          <Typography variant="body1" color="primary" align="right">
            My Share: {expense.share_amount} {expense.currency}
          </Typography>
        ) : (
          <Chip label="No share" />
        )}
      </Box>
      {expense.involved && (
        <Button
          variant="contained"
          color="primary"
          sx={{
            marginLeft: "1rem",
          }}
          onClick={selectExpense}>
          Add
        </Button>
      )}
    </Box>
  );
};
