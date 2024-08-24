import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

import CloseIcon from "@mui/icons-material/Close";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { useUserAccounts } from "../hooks/useAccounts";
import { Expense } from "./ExpenseListItem";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "80%",
  maxWidth: 800,
  bgcolor: "background.paper",
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
};

interface AddExpenseFormProps {
  expense: Expense | null;
  toshlExists: boolean;
  closeModal: () => void;
  previousExpense: () => void;
  nextExpense: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

export function AddExpenseForm({
  expense,
  toshlExists,
  closeModal,
  previousExpense,
  nextExpense,
  hasPrevious,
  hasNext,
}: AddExpenseFormProps) {
  const { categories, allTags, selectedTag } = useUserAccounts();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [addingExpense, setAddingExpense] = useState(false);
  // useEffect(() => {
  //   console.log("Adding event listener");
  //   window.addEventListener("keydown", (e) => {
  //     if (e.key.toLowerCase().includes("left")) {
  //       if (hasPrevious) {
  //         previousExpense();
  //       }
  //     }
  //     if (e.key.toLowerCase().includes("right")) {
  //       if (hasNext) {
  //         nextExpense();
  //       }
  //     }
  //   });
  //   return () => {
  //     console.log("Removing event listener");
  //     window.removeEventListener("keydown", () => {});
  //   };
  // }, [closeModal, hasNext, hasPrevious, nextExpense, previousExpense]);

  const addExpenseToToshl = async () => {
    if (toshlExists) {
      if (!window.confirm("This expense already exists in Toshl. Continue?")) {
        return;
      }
    }
    if (expense === null) {
      alert("Error: No expense selected");
      return;
    }
    setAddingExpense(true);
    const data = {
      amount: -Math.abs(expense.share_amount),
      currency: { code: expense.currency },
      date: expense.date,
      desc: expense.description,
      category: selectedCategory,
      extra: {
        expense_id: expense.id,
        friends: expense.friends,
      },
      tags: [selectedTag?.id, ...selectedTags].filter((t) => t),
    };

    try {
      const res = await fetch("/api/toshl/entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("toshlAPIKey")}`,
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setAddingExpense(false);
        nextExpense();
      } else {
        alert("Error adding expense to Toshl");
      }
    } catch (e) {
      console.error(e);
      alert("Error adding expense to Toshl");
    }
    setAddingExpense(false);
  };

  const categoryOptions = useMemo(
    () =>
      categories
        ? categories.map((c) => {
            return { id: c.id, label: c.name };
          })
        : [],
    [categories]
  );

  const tagOptions = useMemo(() => {
    if (selectedCategory === null) {
      const tags = allTags;

      tags.sort((a, b) => b.entries - a.entries);

      return tags.map((tag) => {
        return { id: tag.id, label: tag.name };
      });
    }
    // Sort tags by entries
    const categoryTags = allTags.filter(
      (tag) => tag.category_id === selectedCategory
    );
    categoryTags.sort((a, b) => b.entries - a.entries);
    // Get tags that are not part of the selected category
    const otherTags = allTags.filter(
      (tag) => tag.category_id !== selectedCategory
    );
    // Sort tags by entries
    otherTags.sort((a, b) => b.entries - a.entries);

    return [
      ...categoryTags.map((tag) => {
        return { id: tag.id, label: tag.name };
      }),
      ...otherTags.map((tag) => {
        return { id: tag.id, label: tag.name };
      }),
    ];
  }, [allTags, selectedCategory]);

  if (expense === null) {
    return <>Error: No expense selected</>;
  }
  return (
    <Box sx={modalStyle}>
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="overline">
          <strong>Add Expense</strong>
        </Typography>
        <Button tabIndex={4} onClick={closeModal} size="large">
          <CloseIcon />
        </Button>
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
        }}>
        <Box
          sx={{
            flexGrow: 1,
          }}>
          <Typography variant="h4" component="h1" align="left">
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
          <Typography variant="body1" color="primary" align="right">
            My Share: {expense.share_amount} {expense.currency}
          </Typography>
        </Box>
      </Box>
      <Stack
        sx={{
          my: 4,
        }}
        spacing={2}>
        <Autocomplete
          disableClearable
          disablePortal
          id="category"
          getOptionLabel={(option) => option.label}
          options={categoryOptions}
          sx={{ width: "100%" }}
          onChange={(_, value) => {
            setSelectedCategory(value?.id);
          }}
          autoHighlight={true}
          tabIndex={0}
          renderInput={(params) => <TextField {...params} label="Category" />}
        />

        <Autocomplete
          multiple
          id="tags-standard"
          options={tagOptions}
          getOptionLabel={(option) => option.label}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          onChange={(_, value) => {
            setSelectedTags(value.map((v) => v.id));
          }}
          autoHighlight={true}
          tabIndex={1}
          renderInput={(params) => (
            <TextField {...params} label="Tags" placeholder="Select tags" />
          )}
        />
        <Stack
          direction={"row"}
          justifyContent={"space-between"}
          alignItems={"end"}
          gap={1}>
          <Stack gap={1}>
            <Stack direction={"row"} gap={1} alignItems={"center"}>
              <Typography variant="subtitle1" component="div">
                Splitwise tag
              </Typography>
              <Tooltip
                title="This category will automatically be added to every expense. You can change this in the settings"
                placement="top">
                <HelpOutlineIcon />
              </Tooltip>
            </Stack>

            <Chip label={selectedTag?.name} />
          </Stack>

          {toshlExists ? (
            <Typography
              variant="body2"
              component="div"
              align="right"
              color={"error"}
              sx={{
                flexGrow: 1,
              }}>
              Already exists in Toshl
            </Typography>
          ) : (
            <Box
              sx={{
                flexGrow: 1,
              }}></Box>
          )}
          <Button
            disabled={!hasPrevious || addingExpense}
            size="large"
            variant="contained"
            color="secondary"
            tabIndex={3}
            sx={{
              px: 4,
            }}
            onClick={() => {
              previousExpense();
            }}>
            Prev
          </Button>
          <Button
            disabled={!hasNext || addingExpense}
            size="large"
            variant="contained"
            color="secondary"
            tabIndex={3}
            sx={{
              px: 4,
            }}
            onClick={() => {
              nextExpense();
            }}>
            Next
          </Button>
          <Button
            disabled={!selectedCategory || addingExpense}
            size="large"
            variant="contained"
            color="primary"
            tabIndex={3}
            sx={{
              px: 4,
            }}
            onClick={() => {
              addExpenseToToshl();
            }}>
            {addingExpense ? "Adding..." : "Add"}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
