---
title: '3-2 Class Grid UI with Keyboard Navigation (A2)'
type: 'feature'
created: '2026-08-27'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'c01c7f3f73f1e8e330d500ae523cf0c0c0870ac6'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
  - '{project-root}/_bmad-output/specs/spec-dashboards-dictees-champions-ce2/error-categories.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `/dictations/[id]` is a placeholder (« Saisie grille — prochaine étape »). Teachers cannot enter per-student CHAMPIONS error counts on a condensed class grid, blocking the core dictation workflow (FR14–FR16).

**Approach:** Replace the placeholder with a client-side class grid: rows from `listLeveledActiveStudents`, nine fixed C→S columns from a new domain constant module, in-memory non-negative integer counts per cell, keyboard-first navigation (Tab/Shift+Tab row-major, arrows, digits 0–9), category header tooltips, and accessible cell labels. No persistence, validation blocking, or save yet (stories 3.3–3.4).

## Boundaries & Constraints

**Always:**
- Auth + class scope unchanged on `/dictations/[id]` (`auth`, `getTeacherClass`, `isValidUuidV4`, `getDictationById`, `notFound`) (NFR1).
- Grid rows = `listLeveledActiveStudents(classId)` only — active, leveled, non-archived, sorted `fr` (FR14).
- Nine columns in fixed order C, H, A, M, P, I, O, N, S with single-letter headers; full name + definition on hover/tap per `error-categories.md` (FR16).
- Each cell holds a non-negative integer; empty displays as `0`; reject negatives, decimals, and non-digits on input.
- Tab / Shift+Tab moves focus row-major: C→S within a student, then first cell of next student (FR15).
- Arrow keys move focus between adjacent cells when a cell is focused (FR15).
- Digit keys 0–9 set the focused cell value directly (replace, not append) (FR15).
- Cells min 44×40px via `--spacing-grid-cell-min` / `--spacing-grid-row-height`; horizontal scroll when viewport narrower than name + 9 columns (UX-DR4, UX-DR10, UX-DR14).
- Cell `aria-label` = « {displayName}, {catégorie}, {valeur} erreurs » using the stored student name as-is (trim only on input; UX-DR25).
- Centered integers in cells (`.text-data-lg` or equivalent mono styling).
- Counts live in client React state only — refresh clears unsaved data (acceptable until 3.4).
- French UI microcopy; do not log student names in server logs (NFR10).

**Ask First:**
- Prénom extraction from `displayName` (default: substring after last whitespace — `"DUPONT Marie"` → `"Marie"`).
- Category header tooltip UX on touch (default: `title` for hover + tap/click toggles a small absolutely-positioned definition popover; `Escape` dismisses).
- Show `LevelBadge` in the name column (default: **yes** — aids teacher orientation, no scoring dependency).

**Never:**
- `dictation_entries` table, Server Actions for save, scoring, snapshots, or promotion logic (3.4–3.6).
- Row validation (Σ > word total, destructive borders, disabled Enregistrer) — story 3.3.
- Enregistrer button, Enter-to-save, optimistic lock, or success/failure toasts — story 3.4.
- Promotion indicators (⬆️, +) — story 3.6.
- Fetching word-count matrix denominators for display or validation — not required for pure entry UI.
- Mobile per-student form — Epic 5.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Grid load | Valid dictation + leveled students | Table with student name column + 9 category columns; all counts 0 | N/A |
| Empty leveled roster | Dictation exists, zero leveled students | Message « Aucun élève nivelé. » + link to Élèves; no grid | N/A |
| Tab navigation | Focus on cell (student i, C) | Tab → D…→S → student i+1 C | Wraps at last cell of last student |
| Shift+Tab | Focus mid-row | Reverse row-major order | N/A |
| Arrow keys | Focused cell | Up/down = prev/next student same column; left/right = prev/next column | Stays within grid bounds |
| Digit entry | Cell focused, key `3` | Cell shows `3` | N/A |
| Invalid char | Letters or `-` typed | Ignored; value unchanged | N/A |
| Narrow viewport | Width < grid | `overflow-x-auto` scroll; cells keep min size | N/A |
| Header hover | Pointer over `C` | Tooltip/popover shows « Conjugaison » + definition | N/A |
| Unauthenticated / wrong id | Existing guards | Redirect or 404 unchanged | Same as 3.1 |

</frozen-after-approval>

## Code Map

- `champions-app/app/(dashboard)/dictations/[id]/page.tsx` -- **MODIFY** fetch `listLeveledActiveStudents`, render `ClassGrid` instead of placeholder. [`page.tsx:58`](../../champions-app/app/(dashboard)/dictations/[id]/page.tsx#L58)
- `champions-app/app/(dashboard)/dictations/[id]/page.test.tsx` -- **MODIFY** assert grid renders with mocked students; keep auth/404 tests. [`page.test.tsx:101`](../../champions-app/app/(dashboard)/dictations/[id]/page.test.tsx#L101)
- `champions-app/lib/services/list-leveled-active-students.ts` -- **READ** `LeveledActiveStudent` shape + filters. [`list-leveled-active-students.ts:7`](../../champions-app/lib/services/list-leveled-active-students.ts#L7)
- `champions-app/lib/domain/error-categories.ts` -- **CREATE** ordered C→S constants: letter, French name, definition (from error-categories.md).
- `champions-app/lib/domain/error-categories.test.ts` -- **CREATE** order length 9, known letter/name pairs.
- `champions-app/lib/domain/student-display-name.ts` -- **READ** `normalizeDisplayName` only; aria-labels use full `displayName` (no name split).
- `champions-app/lib/domain/student-display-name.test.ts` -- **READ** display-name validation tests (no name-split helpers).
- `champions-app/components/grid/class-grid.tsx` -- **CREATE** `"use client"` grid: state map, keyboard handlers, scroll container.
- `champions-app/components/grid/grid-cell.tsx` -- **CREATE** single numeric cell input with sizing tokens + aria-label.
- `champions-app/components/grid/category-header.tsx` -- **CREATE** letter header + hover/tap definition.
- `champions-app/components/grid/class-grid.test.tsx` -- **CREATE** Tab order, arrows, digit entry, aria-labels (Testing Library + userEvent).
- `champions-app/lib/design/tokens.ts` -- **READ** `SPACING.gridCellMin`, `gridRowHeight`. [`tokens.ts:26`](../../champions-app/lib/design/tokens.ts#L26)
- `champions-app/app/globals.css` -- **READ** `--spacing-grid-cell-min`, `--spacing-grid-row-height`, `.text-data-lg`. [`globals.css:119`](../../champions-app/app/globals.css#L119)
- `champions-app/app/(dashboard)/config/word-count-matrix-form.tsx` -- **READ** scrollable `<table>` + numeric input pattern. [`word-count-matrix-form.tsx:186`](../../champions-app/app/(dashboard)/config/word-count-matrix-form.tsx#L186)
- `champions-app/components/ui/level-badge.tsx` -- **READ** optional name-column badge.

## Tasks & Acceptance

**Execution:**
- [x] `champions-app/lib/domain/error-categories.ts` -- Define nine fixed categories -- FR14/FR16 source of truth.
- [x] `champions-app/lib/domain/error-categories.test.ts` -- Unit tests -- guard column order.
- [x] `champions-app/lib/domain/student-display-name.ts` -- full `displayName` in grid aria-labels -- UX-DR25 (supersedes original `getStudentFirstName` task; see Spec Change Log).
- [x] `champions-app/lib/domain/student-display-name.test.ts` -- Prénom cases -- helper coverage.
- [x] `champions-app/components/grid/grid-cell.tsx` -- Sized numeric cell -- UX-DR10 cell component.
- [x] `champions-app/components/grid/category-header.tsx` -- Letter + definition tooltip -- FR16.
- [x] `champions-app/components/grid/class-grid.tsx` -- Grid state + keyboard nav -- FR15 core UX.
- [x] `champions-app/components/grid/class-grid.test.tsx` -- Keyboard + a11y tests -- FR15/UX-DR25 regression.
- [x] `champions-app/app/(dashboard)/dictations/[id]/page.tsx` -- Wire grid + empty state -- replace placeholder.
- [x] `champions-app/app/(dashboard)/dictations/[id]/page.test.tsx` -- Page integration tests -- grid vs placeholder.

**Acceptance Criteria:**
- Given I open a dictation from the Dictées tab, when the class grid loads, then rows show active leveled non-archived students only and columns show C H A M P I O N S (FR14).
- Given a focused grid cell, when I press Tab or Shift+Tab, then focus moves between cells in row-major order C→S then next student (FR15).
- Given a focused grid cell, when I press arrow keys or digit keys 0–9, then focus moves between cells or the cell value updates to that non-negative integer (FR15).
- Given a column header, when I hover or tap it, then I see the full category name and definition (FR16).
- Given a narrow viewport, when the grid renders, then cells respect min 44×40px and the table scrolls horizontally (UX-DR4, UX-DR10, UX-DR14).
- Given any grid cell, when inspected, then its `aria-label` matches « {displayName}, {catégorie}, {valeur} erreurs » (UX-DR25).

### Review Findings

- [x] [Review][Decision] Per-category header background colors — **resolved: keep official CHAMPIONS colors** (1A). DESIGN.md tension accepted; method colors take precedence for grid headers.
- [x] [Review][Decision] Grid cell typography — **resolved: keep `.text-data-md`** (2A). 24px bold mono retained for grid legibility.
- [x] [Review][Patch] FR15 digit keys must replace, not append [`grid-cell.tsx:70`]
- [x] [Review][Patch] FR16 tap/click tooltip with `title`, toggle popover, Escape dismiss [`category-header.tsx:11`]
- [x] [Review][Patch] Empty roster message should match spec I/O matrix [`class-grid.tsx:128`]
- [x] [Review][Patch] Select cell value on focus (mouse click) to support digit replace [`grid-cell.tsx:111`]
- [x] [Review][Patch] Add keyboard digit replacement test (not setInputValue) [`class-grid.test.tsx`]
- [x] [Review][Patch] Add tests rejecting `-1` and `1.5` in cells [`class-grid.test.tsx`]
- [x] [Review][Patch] Add tooltip hover visibility test (opacity after mouseenter) [`class-grid.test.tsx`]
- [x] [Review][Patch] Assert min cell dimension classes on GridCell inputs [`class-grid.test.tsx`]
- [x] [Review][Patch] Add arrow boundary tests (ArrowLeft/Up/Down at grid edges) [`class-grid.test.tsx`]
- [x] [Review][Defer] Grid counts not resynced when `students` prop changes [`class-grid.tsx:42`] — deferred, pre-existing pattern; page is server-rendered with static student list for now
- [x] [Review][Defer] Missing `headers` attribute linking inputs to row/column `<th>` [`grid-cell.tsx:111`] — deferred, aria-label sufficient for MVP

## Spec Change Log

- Post-delivery (2026-09-01): Student microcopy uses full `displayName` everywhere; removed `getStudentFirstName`. Grid cell aria-labels now « {displayName}, {catégorie}, {valeur} erreurs ». Frozen intent line 32 superseded by this entry.

## Design Notes

Grid state shape: `Record<studentId, Record<CategoryLetter, number>>` initialized to zeros. Use `inputMode="numeric"` + controlled string display for single-digit UX; parse with `parseInt` clamped ≥ 0. Roving `tabIndex={0}` only on active cell optional — prefer native tab order via sequential inputs matching visual order. Name column sticky left (`sticky left-0 bg-background`) improves horizontal scroll readability.

## Verification

**Commands:**
- `cd champions-app && npm test` -- expected: all tests pass including new domain, grid, and page tests.
- `cd champions-app && npm run build` -- expected: production build succeeds.

**Manual checks (if no CLI):**
- Open dictation with leveled students → grid visible, Tab through C→S across two students, arrows move orthogonally, typing `5` sets cell to 5.
- Resize browser < 1024px → horizontal scroll appears; cells stay readable.
- Hover/tap `H` header → homophone definition visible.

## Suggested Review Order

**Grid entry point (page → client grid)**

- Server page loads leveled students and mounts the grid
  [`page.tsx:44`](../../champions-app/app/(dashboard)/dictations/[id]/page.tsx#L44)

- Client grid orchestrates state, focus, and category tooltips
  [`class-grid.tsx:41`](../../champions-app/components/grid/class-grid.tsx#L41)

**CHAMPIONS domain constants**

- Nine fixed C→S categories with French definitions for headers
  [`error-categories.ts:18`](../../champions-app/lib/domain/error-categories.ts#L18)

- Prénom extraction for accessible cell labels
  [`student-display-name.ts:44`](../../champions-app/lib/domain/student-display-name.ts#L44)

**Keyboard navigation & cells**

- Cell input: non-negative integers, arrows, Tab wrap at edges
  [`grid-cell.tsx:64`](../../champions-app/components/grid/grid-cell.tsx#L64)

- Category header tooltips: hover title + tap popover, Escape dismiss
  [`category-header.tsx:44`](../../champions-app/components/grid/category-header.tsx#L44)

**Tests**

- Grid keyboard, a11y, and tooltip behavior
  [`class-grid.test.tsx:53`](../../champions-app/components/grid/class-grid.test.tsx#L53)

- Page integration: grid render and empty roster state
  [`page.test.tsx:107`](../../champions-app/app/(dashboard)/dictations/[id]/page.test.tsx#L107)
