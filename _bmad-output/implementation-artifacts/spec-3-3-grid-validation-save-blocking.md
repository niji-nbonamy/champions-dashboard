---
title: '3-3 Grid Validation & Save Blocking'
type: 'feature'
created: '2026-08-28'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'd47b0ce969d65b8c9bc86d6747ae01d6a610b889'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-testBMAD-2026-08-24/EXPERIENCE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The class grid (3.2) accepts any non-negative integers with no check against per-student word totals. Teachers can enter impossible error counts; save is not yet wired but invalid data must be blocked before persistence (FR17).

**Approach:** Add a pure `lib/domain/grid-validation` module (sum + per-category rules against word denominator). Resolve each student's word total from the dictation's matching matrix row × current level on the server page, pass denominators into `ClassGrid`, show destructive borders and inline row messages when invalid, and render a disabled **Enregistrer** button until every row is valid. No persistence, scoring, toasts, or Enter-to-save yet (story 3.4).

## Boundaries & Constraints

**Always:**
- Auth + class scope on `/dictations/[id]` unchanged (NFR1).
- Word totals come from `word_count_matrix_rows` matched to `dictation.dictationLabelKey` via `findMatchingMatrixRow` + `getWordCountForLevel(row, student.level)` — same normalization as dictation create (FR13).
- Validation rules (pure domain, reusable by 3.4 server): row invalid when `Σ category errors > wordTotal` **or** any single category count `> wordTotal` (FR17).
- Invalid row: all nine cells show destructive border on inputs (`border-destructive` / `ring-destructive` per UX-DR10); inline `role="alert"` message « Σ erreurs ({N}) > total mots ({M}) pour {prénom} » where N = Σ errors, M = word total, prénom from `getStudentFirstName` (UX-DR24).
- **Enregistrer** button visible below grid when students exist; `disabled` when any row invalid; enabled when all rows valid (FR17). No `onClick` save handler, Server Action, or Enter-to-save yet (3.4).
- Recompute validation on every cell change (client state). Default all-zero rows are always valid.
- French microcopy; do not log student names in server logs (NFR10).

**Ask First:**
- Missing matrix row at grid load (dictation exists but matrix row deleted later): default show blocking message + link to Config, no grid entry (defensive; should not happen in normal flow).

**Never:**
- `dictation_entries` table, save Server Action, scoring, snapshots, promotion (3.4–3.6).
- Success/failure toasts, optimistic lock, Enter-to-save (3.4).
- Client-authoritative word totals — denominators are server-provided props only.
- Fetching matrix inside client components — page loads row once server-side.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Valid row | All counts ≤ word total, Σ ≤ total | No destructive border; no inline message; Enregistrer enabled | N/A |
| Σ exceeds total | e.g. total=10, counts sum 12 | Row cells destructive border; inline Σ message; Enregistrer disabled | N/A |
| Single category exceeds | e.g. total=5, C=6, rest 0 | Same as Σ case (Σ=6>5); Enregistrer disabled | N/A |
| Fix invalid row | Lower counts until valid | Borders/message clear; Enregistrer becomes enabled | N/A |
| All zeros | Default grid | Valid; Enregistrer enabled | N/A |
| Missing matrix row | Dictation without matching matrix row | Blocking explanatory message + Config link; no grid | N/A |
| Empty leveled roster | Zero students | Existing empty message (3.2); no Enregistrer | N/A |

</frozen-after-approval>

## Code Map

- `champions-app/lib/domain/grid-validation.ts` -- **CREATE** `sumCategoryErrors`, `validateGridRow`, `formatGridRowValidationMessage`, types for row validation result.
- `champions-app/lib/domain/grid-validation.test.ts` -- **CREATE** Σ overflow, single-category overflow, valid edge (Σ=total), zero row.
- `champions-app/lib/domain/word-count-matrix.ts` -- **MODIFY** add `getWordCountForLevel(row, level)` mapping yellow/green/violet/gold → column ints. [`word-count-matrix.ts:47`](../../champions-app/lib/domain/word-count-matrix.ts#L47)
- `champions-app/lib/domain/word-count-matrix.test.ts` -- **MODIFY** level→count mapping cases.
- `champions-app/lib/domain/dictation.ts` -- **READ** `findMatchingMatrixRow`. [`dictation.ts:108`](../../champions-app/lib/domain/dictation.ts#L108)
- `champions-app/lib/services/list-word-count-matrix-rows.ts` -- **READ** row record shape. [`list-word-count-matrix-rows.ts:6`](../../champions-app/lib/services/list-word-count-matrix-rows.ts#L6)
- `champions-app/components/grid/grid-cell.tsx` -- **MODIFY** `hasValidationError` prop → destructive input border classes. [`grid-cell.tsx:132`](../../champions-app/components/grid/grid-cell.tsx#L132)
- `champions-app/components/grid/class-grid.tsx` -- **MODIFY** accept `wordTotalsByStudentId`, derive validation per row, inline alert, Enregistrer disabled state. [`class-grid.tsx:41`](../../champions-app/components/grid/class-grid.tsx#L41)
- `champions-app/components/grid/class-grid.test.tsx` -- **MODIFY** validation UI, Enregistrer disabled/enabled, message text.
- `champions-app/app/(dashboard)/dictations/[id]/page.tsx` -- **MODIFY** load matrix rows, resolve denominators, pass to `ClassGrid`; handle missing row. [`page.tsx:44`](../../champions-app/app/(dashboard)/dictations/[id]/page.tsx#L44)
- `champions-app/app/(dashboard)/dictations/[id]/page.test.tsx` -- **MODIFY** matrix fetch mock, word totals passed, missing-row state.
- `champions-app/components/ui/button.tsx` -- **READ** primary variant for Enregistrer styling.

## Tasks & Acceptance

**Execution:**
- [x] `champions-app/lib/domain/word-count-matrix.ts` -- `getWordCountForLevel` -- denominator lookup by student level.
- [x] `champions-app/lib/domain/word-count-matrix.test.ts` -- Level mapping tests -- guard denominator helper.
- [x] `champions-app/lib/domain/grid-validation.ts` -- Pure validation + message formatter -- FR17 domain source of truth.
- [x] `champions-app/lib/domain/grid-validation.test.ts` -- I/O matrix unit tests -- regression on rules.
- [x] `champions-app/components/grid/grid-cell.tsx` -- Destructive border when invalid -- UX-DR10.
- [x] `champions-app/components/grid/class-grid.tsx` -- Row validation, inline message, Enregistrer disabled -- FR17/UX-DR24 UI.
- [x] `champions-app/components/grid/class-grid.test.tsx` -- Validation + button state tests -- AC coverage.
- [x] `champions-app/app/(dashboard)/dictations/[id]/page.tsx` -- Server denominators + missing-row guard -- data wiring.
- [x] `champions-app/app/(dashboard)/dictations/[id]/page.test.tsx` -- Page integration tests -- server props.

**Acceptance Criteria:**
- Given I edit the class grid, when any student row has Σ category errors > their word total for this dictation, then offending cells show a destructive border, an inline message « Σ erreurs ({N}) > total mots ({M}) pour {prénom} », and Enregistrer is disabled (FR17, UX-DR24).
- Given I edit the class grid, when any single category error count > word total for that student, then save is blocked with the same visual treatment and Enregistrer disabled (FR17).
- Given all grid rows are valid, when I inspect the grid, then Enregistrer is enabled (but does not persist until story 3.4).
- Given word totals per student, when validation runs, then denominators match the matrix row for this dictation label × each student's current level (FR13).

## Spec Change Log

## Design Notes

Validation runs in `ClassGrid` via `useMemo` over `counts` + `wordTotalsByStudentId`, calling `validateGridRow` from domain. Keep `GridCounts` shape unchanged for 3.4 handoff. Enregistrer: `type="button"`, mint primary styling, `disabled={!allRowsValid}` — no form submit.

## Verification

**Commands:**
- `cd champions-app && npm test` -- expected: all tests pass including new domain and grid validation tests.
- `cd champions-app && npm run build` -- expected: production build succeeds.

**Manual checks (if no CLI):**
- Open dictation with leveled students → enter counts exceeding a student's word total → red borders + message + disabled Enregistrer; fix counts → enabled Enregistrer.

## Suggested Review Order

**Domain validation**

- Sum and per-category rules + French message formatter
  [`grid-validation.ts`](../../champions-app/lib/domain/grid-validation.ts)

- Level → word count from matrix row
  [`word-count-matrix.ts`](../../champions-app/lib/domain/word-count-matrix.ts)

**Grid UI**

- Validation state, inline alerts, Enregistrer disabled logic
  [`class-grid.tsx`](../../champions-app/components/grid/class-grid.tsx)

- Destructive border on invalid cells
  [`grid-cell.tsx`](../../champions-app/components/grid/grid-cell.tsx)

**Server wiring**

- Matrix row lookup and denominators per student
  [`page.tsx`](../../champions-app/app/(dashboard)/dictations/[id]/page.tsx)

- Shared builder for per-student word totals from matrix × level
  [`word-count-matrix.ts`](../../champions-app/lib/domain/word-count-matrix.ts)

### Review Findings

- [x] [Review][Decision] `ring-destructive/20` vs `ring-destructive` literal — **Resolved: accept `ring-destructive/20`** as sufficient visual treatment; consistent with design system (`button.tsx` uses same opacity pattern). Dismissed.

- [x] [Review][Patch] Missing FR13 page integration test [`page.test.tsx`](../../champions-app/app/(dashboard)/dictations/[id]/page.test.tsx) — added mock ClassGrid assertion for matrix × level word totals.

- [x] [Review][Patch] Redundant "Config" microcopy [`page.tsx:84-89`](../../champions-app/app/(dashboard)/dictations/[id]/page.tsx) — inline sentence with single linked « Config » word.

- [x] [Review][Defer] No try/catch around `listWordCountMatrixRows` [`page.tsx:52`](../../champions-app/app/(dashboard)/dictations/[id]/page.tsx) — deferred, pre-existing — DB fetch failures surface as unhandled server error; consistent with other pages in this epic.

- [x] [Review][Defer] Accessibility: cells not linked to inline alert via `aria-describedby` [`class-grid.tsx:669-676`](../../champions-app/components/grid/class-grid.tsx) — deferred, pre-existing — screen readers get `aria-invalid` but may not hear the Σ message without explicit association.
