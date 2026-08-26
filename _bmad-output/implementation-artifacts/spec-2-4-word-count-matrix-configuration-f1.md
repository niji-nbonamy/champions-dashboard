---
title: '2-4 Word-Count Matrix Configuration (F1)'
type: 'feature'
created: '2026-08-26'
status: 'done'
review_loop_iteration: 0
baseline_commit: '61ec3dafe4adaef6469c66a1c1bb82067bf58224'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/specs/spec-dashboards-dictees-champions-ce2/ux-decisions.md'
  - '{project-root}/_bmad-output/specs/spec-dashboards-dictees-champions-ce2/dictation-lifecycle.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Teachers cannot define dictation × color-level word totals on Config. Global percentages will lack correct denominators and Epic 3 cannot gate dictation creation or save (FR10, FR13, UX-DR20).

**Approach:** Add `word_count_matrix_rows` table scoped to `classId`. Provide domain validation (label + four integers > 0), a transactional replace service, and an editable F1 table on Config: rows = dictation labels, columns = four CHAMPIONS levels. Expose `listWordCountMatrixRows` for Epic 3 dictation blocking.

## Boundaries & Constraints

**Always:**
- Matrix UI on Config tab below roster section (FR10, UX-DR20).
- Rows = dictation labels (free text, trimmed); columns = `yellow`, `green`, `violet`, `gold` with French headers (`jaune`, `vert`, `violet`, `or`) reusing level tokens/badges.
- Each cell must be an integer word count **> 0** before a row is considered complete.
- Persist all rows scoped to authenticated teacher's `classId` via `getTeacherClass` (NFR1, AD-1).
- Save replaces the class matrix atomically: validate full payload → delete existing rows for class → insert validated rows in one transaction (AD-3).
- Reject duplicate labels within the submitted batch (case-insensitive trim).
- Reject rows with empty label or any missing/zero/negative/non-integer cell.
- Label max length 80 characters after trim (default).
- Allow adding rows in UI and removing rows before save; empty matrix state shows add-row CTA.
- Expose `listWordCountMatrixRows(classId)` returning rows sorted by label for Config load and Epic 3 lookup.
- French microcopy; do not log dictation labels or counts in server info logs (NFR10).

**Ask First:**
- Whether teachers may save a completely empty matrix (default: allow — Epic 3 blocks dictation creation when no row matches).
- Whether label matching for future dictations is case-sensitive (default: case-insensitive trim equality).
- Max number of dictation rows per class (default: 20).

**Never:**
- Dictation creation UI or save-blocking logic (Epic 3 — only provide data layer).
- Word-count matrix CSV import (F3).
- Year-start wizard step 3 shell (story 2.5) — component may be reused later but wizard not built here.
- `dictations` table or scored dictation records.
- Client-only persistence without server re-validation.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Happy save | 2 rows, all labels + 4 counts > 0 | DB holds exactly 2 rows for class; UI shows saved values | N/A |
| Add row | Click add → fill label + counts → save | New row persisted | N/A |
| Remove row | Delete row in UI → save | Row absent from DB | N/A |
| Empty matrix save | No rows submitted | DB has zero rows for class (if allowed) | N/A or block per Ask First |
| Incomplete row | Label set but one cell empty | No DB change | French row-level error |
| Zero count | Cell value `0` | No DB change | « Chaque cellule doit être un entier supérieur à 0. » |
| Non-integer | Cell `12.5` or `abc` | No DB change | Same cell validation error |
| Duplicate labels | `Dictée 1` and `dictée 1` | No DB change | « Labels de dictée en double : … » |
| Empty label | Whitespace-only label | No DB change | « Le label de dictée est requis. » |
| Label too long | > 80 chars | No DB change | Length error |
| Unauthenticated | No session | Redirect `/login` | N/A |
| No class | Session without class | Redirect `/onboarding/class` | N/A |
| Reload | Saved matrix | Config table shows persisted rows | N/A |

</frozen-after-approval>

## Code Map

- `champions-app/lib/db/schema.ts` -- **MODIFY** add `wordCountMatrixRows` (`class_id` FK, `dictation_label_key`, `words_yellow`, `words_green`, `words_violet`, `words_gold` integers). [`schema.ts:37`](../../champions-app/lib/db/schema.ts#L37)
- `champions-app/lib/domain/word-count-matrix.ts` -- **CREATE** row/matrix validation, French errors, label normalize for duplicate check.
- `champions-app/lib/domain/word-count-matrix.test.ts` -- **CREATE** I/O matrix unit tests.
- `champions-app/lib/domain/champions-level.ts` -- **READ** `CHAMPIONS_LEVELS` + French labels for column headers. [`champions-level.ts:3`](../../champions-app/lib/domain/champions-level.ts#L3)
- `champions-app/lib/services/list-word-count-matrix-rows.ts` -- **CREATE** class-scoped read, sorted by label — Epic 3 gate.
- `champions-app/lib/services/list-word-count-matrix-rows.test.ts` -- **CREATE** mocked DB tests.
- `champions-app/lib/services/replace-word-count-matrix.ts` -- **CREATE** validate → transaction delete+insert for class.
- `champions-app/lib/services/replace-word-count-matrix.test.ts` -- **CREATE** success, validation reject, transaction paths.
- `champions-app/lib/services/get-teacher-class.ts` -- **READ** `classId` resolution. [`get-teacher-class.ts:12`](../../champions-app/lib/services/get-teacher-class.ts#L12)
- `champions-app/app/(dashboard)/config/page.tsx` -- **MODIFY** load matrix rows; add « Matrice mots » section. [`page.tsx:44`](../../champions-app/app/(dashboard)/config/page.tsx#L44)
- `champions-app/app/(dashboard)/config/actions.ts` -- **MODIFY** add `saveWordCountMatrixAction`; `revalidatePath("/config")`.
- `champions-app/app/(dashboard)/config/word-count-matrix-form.tsx` -- **CREATE** client editable table: add/remove rows, number inputs, save button, `useActionState`.
- `champions-app/app/(dashboard)/config/csv-import-form.tsx` -- **READ** `useActionState` + alert pattern. [`csv-import-form.tsx:17`](../../champions-app/app/(dashboard)/config/csv-import-form.tsx#L17)
- `champions-app/components/ui/level-badge.tsx` -- **READ** level color semantics for column headers. [`level-badge.tsx:10`](../../champions-app/components/ui/level-badge.tsx#L10)
- `champions-app/app/(dashboard)/students/roster-list.tsx` -- **READ** bordered list/table styling reference. [`roster-list.tsx:21`](../../champions-app/app/(dashboard)/students/roster-list.tsx#L21)

## Tasks & Acceptance

**Execution:**
- [x] `champions-app/lib/db/schema.ts` -- Add `word_count_matrix_rows` table -- FR10 persistence.
- [x] `champions-app/lib/domain/word-count-matrix.ts` -- Matrix row validation + French errors -- domain guard.
- [x] `champions-app/lib/domain/word-count-matrix.test.ts` -- Unit tests -- I/O matrix coverage.
- [x] `champions-app/lib/services/list-word-count-matrix-rows.ts` -- Read service -- Config load + Epic 3 lookup.
- [x] `champions-app/lib/services/list-word-count-matrix-rows.test.ts` -- Mocked read tests -- query accuracy.
- [x] `champions-app/lib/services/replace-word-count-matrix.ts` -- Transactional replace service -- AD-3 mutation.
- [x] `champions-app/lib/services/replace-word-count-matrix.test.ts` -- Service tests -- validation + atomic replace.
- [x] `champions-app/app/(dashboard)/config/word-count-matrix-form.tsx` -- F1 editable table UI -- UX-DR20.
- [x] `champions-app/app/(dashboard)/config/actions.ts` -- `saveWordCountMatrixAction` -- server entry point.
- [x] `champions-app/app/(dashboard)/config/page.tsx` -- Wire matrix section on Config tab -- FR10 surface.
- [x] `champions-app/app/(dashboard)/config/actions.test.ts` -- **CREATE** action auth/validation/revalidate tests.
- [x] `champions-app/app/(dashboard)/config/page.test.tsx` -- Extend tests -- matrix section present.
- [x] `champions-app/app/(dashboard)/config/word-count-matrix-form.test.tsx` -- **CREATE** static markup / interaction tests.

**Acceptance Criteria:**
- Given I am on the Config tab, when I view the word-count matrix section, then I see an editable table with dictation label rows and four color-level columns (yellow, green, violet, gold) (FR10, UX-DR20).
- Given I enter integer word counts > 0 for all four levels on a row, when I save, then the matrix is persisted scoped to my Class.
- Given I save a matrix with multiple dictation labels, when I reload Config, then all rows and cell values match what I saved.
- Given a cell value is 0, negative, or non-integer, when I save, then no change is persisted and I see a French validation error.
- Given duplicate dictation labels in my submission, when I save, then no change is persisted and I see a duplicate-label error.
- Given a complete matrix exists, when Epic 3 later queries by dictation label and student level, then `listWordCountMatrixRows` supplies the stored denominators (data path only — blocking logic is Epic 3).

## Design Notes

Use a native `<table>` with responsive wrapper (`overflow-x-auto`) — no shadcn Table installed. Column headers: small `LevelBadge` or colored dot + French label. Row actions: text button « Supprimer ». Primary « Enregistrer la matrice » at section footer. Serialize rows as indexed FormData fields (`rows[0].label`, `rows[0].words_yellow`, …) parsed in the action.

## Verification

**Commands:**
- `cd champions-app && npm run db:push` -- expected: `word_count_matrix_rows` table created in Neon (run locally before manual UI test).
- `cd champions-app && npm test` -- expected: all tests pass including new domain, service, action, and UI tests.
- `cd champions-app && npm run build` -- expected: production build succeeds.

**Manual checks (if no CLI):**
- Config → add two dictation rows with valid counts → save → reload → values persist.
- Submit row with one empty cell → French error, DB unchanged.
- Submit duplicate labels → error, DB unchanged.

## Suggested Review Order

**Matrix persistence core**

- Transactional replace: validate full payload, delete class rows, bulk insert
  [`replace-word-count-matrix.ts:17`](../../champions-app/lib/services/replace-word-count-matrix.ts#L17)

- Domain validation: integers > 0, duplicate labels, max 20 rows
  [`word-count-matrix.ts:124`](../../champions-app/lib/domain/word-count-matrix.ts#L124)

- Class-scoped read sorted by label for Config and Epic 3
  [`list-word-count-matrix-rows.ts:14`](../../champions-app/lib/services/list-word-count-matrix-rows.ts#L14)

**Schema**

- New `word_count_matrix_rows` table with four level integer columns
  [`schema.ts:48`](../../champions-app/lib/db/schema.ts#L48)

**Config UI (F1)**

- Server page loads matrix rows and wires form `initialRows`
  [`page.tsx:24`](../../champions-app/app/(dashboard)/config/page.tsx#L24)

- Editable table: add/remove rows, level column headers, save action
  [`word-count-matrix-form.tsx:86`](../../champions-app/app/(dashboard)/config/word-count-matrix-form.tsx#L86)

- Server action parses FormData rows and revalidates Config
  [`actions.ts:39`](../../champions-app/app/(dashboard)/config/actions.ts#L39)

**Tests**

- Domain I/O matrix: cell validation, duplicates, empty matrix allowed
  [`word-count-matrix.test.ts:97`](../../champions-app/lib/domain/word-count-matrix.test.ts#L97)

- Replace service multi-row insert and validation reject paths
  [`replace-word-count-matrix.test.ts:52`](../../champions-app/lib/services/replace-word-count-matrix.test.ts#L52)

- Action auth, empty save, duplicate label error surfacing
  [`actions.test.ts:201`](../../champions-app/app/(dashboard)/config/actions.test.ts#L201)
