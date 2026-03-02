import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

// Define the shape of your context state
type UserAccounts = {
  splitwise: {
    id: number;
    email: string;
  };
  toshl: {
    id: number;
    email: string;
  };
};

export type ToshlCategory = {
  // Should only contain non deleted categories and expense categories
  id: string;
  name: string;
  entries: number;
};

export type ToshlTag = {
  // Should only contain non deleted tags and expense categories
  id: string;
  category_id: string;
  name: string;
  entries: number;
};

export type ToshlExpense = {
  id: string;
  amount: number;
  currency: {
    code: string;
    rate: number;
    main_rate: number;
    fixed: boolean;
  };
  date: string;
  desc: string;
  account: string;
  category: string;
  tags: string[];
  created: string;
  modified: string;
  completed: boolean;
  deleted: boolean;
  extra: {
    expense_id?: number;
    friends?: string[];
  };
};

export enum AccountState {
  UNSET,
  LOADING,
  SET,
  INVALID,
}

type UserAccountsContextType = {
  userAccounts: UserAccounts;
  accountState: AccountState;
  loadUserAccounts: () => Promise<boolean>;
  setSelectedTag(id: string): void;
  selectedTag: ToshlTag | undefined;
  totalTags: number;
  totalCategories: number;
  categories: ToshlCategory[];
  allTags: ToshlTag[];
};

// Create the context
const UserAccountsContext = createContext<UserAccountsContextType | undefined>(
  undefined
);

// Create a provider component
export const UserAccountsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [userAccounts, setUserAccounts] = useState<UserAccounts>({
    splitwise: {
      id: 0,
      email: "",
    },
    toshl: {
      id: 0,
      email: "",
    },
  });

  const [categories, setCategories] = useState<ToshlCategory[]>([]);
  const [tags, setTags] = useState<ToshlTag[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<string>(
    localStorage.getItem("selectedTag") || ""
  );

  const [accountState, setAccountState] = useState<AccountState>(
    AccountState.UNSET
  );

  const loadUserAccounts = useCallback(async (): Promise<boolean> => {
    const splitwiseAPIKey = localStorage.getItem("splitwiseAPIKey");
    const toshlAPIKey = localStorage.getItem("toshlAPIKey");

    if (splitwiseAPIKey && toshlAPIKey) {
      setAccountState(AccountState.LOADING);

      const fetchSplitwiseUser = fetch(`/api/splitwise/v3.0/get_current_user`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${splitwiseAPIKey}`,
        },
      }).then((response) => response.json());

      const fetchToshlUser = fetch(`/api/toshl/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${toshlAPIKey}`,
        },
      }).then((response) => response.json());

      const fetchToshlCategories = fetch(`/api/toshl/categories?per_page=500`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${toshlAPIKey}`,
        },
      }).then((response) => response.json());

      const fetchToshlTags = fetch(`/api/toshl/tags?per_page=500`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${toshlAPIKey}`,
        },
      }).then((response) => response.json());

      try {
        const [splitwiseUser, toshlUser, toshlCategories, toshlTags] =
          await Promise.all([
            fetchSplitwiseUser,
            fetchToshlUser,
            fetchToshlCategories,
            fetchToshlTags,
          ]);

        // Check if these are valid
        if (
          !splitwiseUser?.user?.id ||
          !splitwiseUser?.user?.email ||
          !toshlUser?.id ||
          !toshlUser?.email
        ) {
          setAccountState(AccountState.INVALID);
          return false;
        }

        setUserAccounts((prev) => ({
          ...prev,
          splitwise: {
            id: splitwiseUser.user.id,
            email: splitwiseUser.user.email,
          },
          toshl: {
            id: toshlUser.id,
            email: toshlUser.email,
          },
        }));

        const filteredCategories: ToshlCategory[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        toshlCategories.forEach((c: any) => {
          if (!c?.deleted && c?.type === "expense") {
            filteredCategories.push({
              id: c?.id,
              name: c?.name,
              entries: c?.counts?.entries,
            });
          }
        });
        setCategories(filteredCategories);

        const filteredTags: ToshlTag[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        toshlTags.forEach((t: any) => {
          if (!t?.deleted && t?.type === "expense") {
            filteredTags.push({
              id: t?.id,
              category_id: t?.category,
              name: t?.name,
              entries: t?.counts?.entries,
            });
          }
        });
        setTags(filteredTags);
      } catch (e) {
        console.error(e);
        setAccountState(AccountState.INVALID);
        return false;
      }

      setAccountState(AccountState.SET);
      return true;
    }
    return false;
  }, []);

  const totalTags = useMemo(() => {
    return tags.length;
  }, [tags]);

  const totalCategories = useMemo(() => {
    return categories.length;
  }, [categories]);

  const cats = useMemo(() => {
    const cat = categories;
    // Sort by entries
    cat.sort((a, b) => b.entries - a.entries);
    return cat;
  }, [categories]);

  const setSelectedTag = useCallback(
    (id: string) => {
      // Check if tag exists
      const tag = tags.find((t) => t.id === id);
      if (!tag) {
        return;
      }

      setSelectedTagId(id);
      localStorage.setItem("selectedTag", id);
    },
    [tags]
  );

  const selectedTag = useMemo(() => {
    return tags.find((t) => t.id === selectedTagId);
  }, [tags, selectedTagId]);

  const allTags = useMemo(() => {
    return tags;
  }, [tags]);

  const value = {
    userAccounts,
    loadUserAccounts,
    accountState,
    totalTags,
    totalCategories,
    categories: cats,
    setSelectedTag,
    selectedTag,
    allTags,
  };

  return (
    <UserAccountsContext.Provider value={value}>
      {children}
    </UserAccountsContext.Provider>
  );
};

// Create a custom hook to use the context
export const useUserAccounts = () => {
  const context = useContext(UserAccountsContext);
  if (context === undefined) {
    throw new Error(
      "useUserAccounts must be used within a UserAccountsProvider"
    );
  }
  return context;
};
