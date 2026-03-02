# Code styleguide (webapp)

Reviewers should use this as a checklist for code quality and consistency in the `webapp/` directory (Vite + React + TypeScript + MUI).

---

## 1. TypeScript

- **Strict mode**: The project uses `strict: true`. No `any` without a justified eslint-disable and a short comment; prefer typing API responses (e.g. with a dedicated type or `unknown` + type guards) instead of `any`.
- **Equality**: Use `===` and `!==`. Avoid `==` / `!=`.
- **Null/undefined**: Use optional chaining and nullish coalescing where it improves clarity. Avoid non-null assertions (`!`) unless the invariant is guaranteed (e.g. after an explicit check).

**Not yet compliant:**  
`hooks/useAccounts.tsx` uses `any` for Toshl API response parsing (with eslint-disable). `Friend.tsx` uses `==` and `!=` when comparing user ids.

---

## 2. React & JSX

- **Component exports**: Prefer named exports for components (e.g. `export function StepCsvInput(...)`) for consistency and refactoring. Default exports are acceptable for route-level pages if the project keeps that convention.
- **Props**: Type every component’s props with an `interface` (e.g. `StepCsvInputProps`) rather than inline object types.
- **Keys**: Use stable, unique keys in lists (e.g. `row._id`, `tag.id`). Avoid keys that can repeat (e.g. `description + date`) when a unique id exists.
- **Accessibility**: Use semantic heading levels in order: a single `h1` per page, then `h2`, `h3`, etc. Do not use a lower-level heading (e.g. `h3`) without a parent `h2`; do not use `component="h2"` or `component="h3"` on typography that is not actually a heading. Prefer MUI’s `component` prop to reflect the real heading level.

**Not yet compliant:**  
`AddExpenseForm.tsx` uses `Typography variant="body2" component="h3"` for the date (heading level skip). `Settings.tsx` uses `Typography variant="body2" component="h2"` for body copy (wrong semantics). `Friend.tsx` uses `key={expense.description + expense.date}`; prefer `expense.id` if available.

---

## 3. Styling (MUI)

- **Spacing**: Prefer flex-based spacing: `Stack` with `spacing`, or `Box` with `gap`, `display: "flex"`. Use margin only when it’s the clearest option (e.g. consistent with existing patterns in the same file).
- **sx**: Prefer theme-aware values (e.g. `theme.palette.*`, `spacing()`) and MUI shorthand (e.g. `py`, `px`, `mb`) when they improve readability.
- **Invalid values**: Do not pass empty or invalid MUI props (e.g. `color=""`); omit the prop or use a valid value.

**Not yet compliant:**  
Several components use `marginLeft`, `marginTop`, or `mb`/`mt` where flex spacing could be used. `AddExpenseForm.tsx` and `ExpenseListItem.tsx` use `color=""`. `Copyright.tsx` uses `marginLeft` and nests a `Typography` inside another `Typography` (invalid HTML).

---

## 4. Copy and UI text

- **Buttons**: Use sentence case for button labels (e.g. “Open tool”, “Parse & continue”, “Back”), not “Open Tool” or “Prev” unless it’s a standard abbreviation.
- **Consistency**: Keep terminology consistent (e.g. “Bulk add” vs “Bulk Add”) and align with existing screens.

**Not yet compliant:**  
Some buttons use title case (e.g. “Open Tool”, “Parse & Continue”). “Prev” should be “Previous” per sentence-case and clarity.

---

## 5. State and side effects

- **Complex state**: Use a reducer (`useReducer`) for state with multiple transitions or derived updates (e.g. BulkAdd, Friend). Keep action types in a single union type.
- **Effects**: Prefer `useCallback` for handlers passed to children or used in effect dependency arrays. List all real dependencies in hooks; avoid broad eslint-disables for exhaustive-deps unless there’s a documented reason (e.g. ref-based “latest value” pattern).
- **Global mutable state**: Avoid module-level mutable variables (e.g. counters) when they make functions impure or hard to test; prefer parameters or a small closure.

**Not yet compliant:**  
`bulkAddTypes.ts` uses a module-level `let rowIdCounter` inside `parseCsvToRows`, which makes the function impure and harder to test. `AddExpenseForm.tsx` disables react-hooks/exhaustive-deps for the keydown effect; the dependency array should be corrected or the pattern documented.

---

## 6. General quality

- **Comments**: Add comments only for non-obvious logic (e.g. business rules, workarounds). Remove or replace comments that only restate what the code does.
- **Debugging**: No `console.log` (or similar) left in production code; use proper logging or remove.
- **Errors**: Prefer user-visible error handling (e.g. MUI Snackbar, inline error state) over `alert()` where it fits the rest of the app.

**Not yet compliant:**  
`AddExpenseForm.tsx` contains `console.log` calls and uses `alert()` for errors. Some files have redundant comments (e.g. “// Sort by entries”).

---

## 7. File and project layout

- **Types**: Shared types used by more than one component live in a dedicated file (e.g. `bulkAddTypes.ts`). Types used only in one file can be defined in that file.
- **Imports**: Prefer explicit file extensions (`.ts`/`.tsx`) where the project already uses them; keep import order consistent (e.g. external first, then internal).
- **Lint**: Code must pass `yarn lint` (ESLint with TypeScript and react-hooks).

---

When reviewing, treat the “Not yet compliant” items as technical debt: existing code may still violate them; new or touched code should follow the styleguide and, where practical, fix violations in the same area.
