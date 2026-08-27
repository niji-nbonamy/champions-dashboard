---
title: '3-1 Create Dictation'
type: 'feature'
created: '2026-08-27'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'c01f68263044bd42413a837f938865cbe6d150a1'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
  - '{project-root}/_bmad-output/specs/spec-dashboards-dictees-champions-ce2/dictation-lifecycle.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Dictées tab shows a disabled « Nouvelle dictée » placeholder even when roster and matrix are ready. Teachers cannot create a `Dictation` record, so Epic 3 capture cannot start (FR12, FR13).

**Approach:** Add `dictations` table and a `createDictation` service. Wire an enabled « Nouvelle dictée » flow (modal: label + date defaulting to today) on `/dictations`, list created dictations as year history, and redirect to `/dictations/[id]` placeholder after success. Block creation when no leveled active students exist or the chosen label has no matching word-count matrix row.

## Boundaries & Constraints

**Always:**
- Dictées tab hosts create UI and chronological history list (newest `dictation_date` first, then label) (FR12).
- « Nouvelle dictée » enabled only when `leveledActiveStudentCount > 0` **and** `matrixRowCount > 0` (FR13, story AC).
- Label must match an existing matrix row via `normalizeDictationLabelKey` (case-insensitive trim equality with `word_count_matrix_rows.dictation_label_key`) (FR13).
- Persist `label` (trimmed display text) and `dictation_label_key` (normalized key) plus `dictation_date` (date-only, class-local calendar day) scoped to authenticated `classId` via `getTeacherClass` (NFR1).
- Date field defaults to today in the browser; server re-validates and rejects invalid/empty dates.
- Reuse `normalizeDictationLabel`, `DICTATION_LABEL_MAX_LENGTH`, and matrix label errors from `lib/domain/word-count-matrix.ts`.
- Server Action → `createDictation` service → single insert; `revalidatePath("/dictations")`; success `redirect("/dictations/{id}")` (story 3.2 owns grid on that route).
- French microcopy; no school grade in labels (NFR14). Do not log labels or student names in server info logs (NFR10).
- Extend `reset-class-year.ts` extension point: delete `dictations` for class inside existing transaction (FR44 parity when table exists).
- Placeholder `/dictations/[id]` page: show dictation label + formatted date + « Saisie grille — prochaine étape »; auth + class scope checks; 404 when id not in class.

**Ask First:**
- Label picker UX (default: `<select>` of matrix row labels sorted A→Z — guarantees a matching row; free-text with validation is acceptable if preferred).
- Whether multiple dictations may share the same label on different dates (default: **yes** — no unique constraint on label per class).

**Never:**
- Class grid UI, error counts, scoring, snapshots, or promotion logic (stories 3.2–3.6).
- `dictation_entries` or `pending_promotions` tables.
- Dictation delete/purge (FR42).
- neon-serverless driver migration (deferred to pre-3.4 per spike).
- Client-only dictation persistence.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Happy create | Valid matrix label + date | `dictations` row inserted; appears in history; redirect `/dictations/{id}` | N/A |
| Default date | Label only, date omitted | Server uses today's UTC date | N/A |
| No leveled students | Active roster but all unassigned | « Nouvelle dictée » disabled; link to Élèves for level assignment | N/A |
| Empty roster | `activeStudentCount === 0` | Existing empty-roster pre-setup UI; button disabled | N/A |
| No matrix rows | `matrixRowCount === 0` | Button disabled; link to Config matrix | N/A |
| Unknown label | Label not in matrix | No insert | « Aucune ligne de matrice pour cette dictée. Configurez la matrice sur Config. » |
| Empty label | Whitespace label | No insert | `DICTATION_LABEL_REQUIRED_ERROR` |
| Label too long | > 80 chars | No insert | `DICTATION_LABEL_TOO_LONG_ERROR` |
| Invalid date | Unparseable date string | No insert | « Date de dictée invalide. » |
| Unauthenticated | No session | Redirect `/login` | N/A |
| No class | Teacher without class | Redirect `/onboarding/class` | N/A |
| Wrong dictation id | `/dictations/{id}` for another class | 404 via `notFound()` | N/A |

</frozen-after-approval>

## Code Map

- `champions-app/lib/db/schema.ts` -- **MODIFY** add `dictations` (`class_id` FK, `label`, `dictation_label_key`, `dictation_date` date, `created_at`). [`schema.ts:63`](../../champions-app/lib/db/schema.ts#L63)
- `champions-app/lib/domain/dictation-readiness.ts` -- **MODIFY** add `leveledActiveStudentCount` to input; gate on leveled + matrix counts. [`dictation-readiness.ts:11`](../../champions-app/lib/domain/dictation-readiness.ts#L11)
- `champions-app/lib/domain/dictation.ts` -- **CREATE** label/date validation, matrix-row lookup helper, French errors.
- `champions-app/lib/domain/dictation.test.ts` -- **CREATE** I/O matrix unit tests.
- `champions-app/lib/domain/word-count-matrix.ts` -- **READ** `normalizeDictationLabel`, `normalizeDictationLabelKey`, label constants. [`word-count-matrix.ts:65`](../../champions-app/lib/domain/word-count-matrix.ts#L65)
- `champions-app/lib/services/list-leveled-active-students.ts` -- **READ** leveled roster for gate + future grid. [`list-leveled-active-students.ts:13`](../../champions-app/lib/services/list-leveled-active-students.ts#L13)
- `champions-app/lib/services/count-leveled-active-students.ts` -- **CREATE** count-only query for readiness gate.
- `champions-app/lib/services/list-dictations.ts` -- **CREATE** class-scoped history list sorted by date desc, label asc.
- `champions-app/lib/services/create-dictation.ts` -- **CREATE** validate label against matrix rows → insert dictation.
- `champions-app/lib/services/create-dictation.test.ts` -- **CREATE** success, missing matrix row, validation errors.
- `champions-app/lib/services/reset-class-year.ts` -- **MODIFY** delete `dictations` in transaction extension point. [`reset-class-year.ts:32`](../../champions-app/lib/services/reset-class-year.ts#L32)
- `champions-app/lib/services/get-year-start-wizard-status.ts` -- **MODIFY** expose `leveledActiveStudentCount` (or parallel fetch on Dictées page).
- `champions-app/app/(dashboard)/dictations/page.tsx` -- **MODIFY** load history + wire create modal; remove placeholder copy. [`page.tsx:11`](../../champions-app/app/(dashboard)/dictations/page.tsx#L11)
- `champions-app/app/(dashboard)/dictations/create-dictation-dialog.tsx` -- **CREATE** client modal (`<dialog>`) with label select + date input + `useActionState`.
- `champions-app/app/(dashboard)/dictations/actions.ts` -- **CREATE** `createDictationAction` with auth, validation, redirect.
- `champions-app/app/(dashboard)/dictations/actions.test.ts` -- **CREATE** auth, validation, success redirect paths.
- `champions-app/app/(dashboard)/dictations/[id]/page.tsx` -- **CREATE** scoped placeholder detail for post-create redirect.
- `champions-app/app/(dashboard)/dictations/page.test.tsx` -- **MODIFY** history list, enabled button, blocking states.
- `champions-app/app/(dashboard)/config/year-reset-section.tsx` -- **READ** native `<dialog>` + `useActionState` pattern. [`year-reset-section.tsx:28`](../../champions-app/app/(dashboard)/config/year-reset-section.tsx#L28)

## Tasks & Acceptance

**Execution:**
- [x] `champions-app/lib/db/schema.ts` -- Add `dictations` table -- FR12 persistence.
- [x] `champions-app/lib/domain/dictation.ts` -- Label/date validation + matrix match -- domain guard.
- [x] `champions-app/lib/domain/dictation.test.ts` -- Unit tests -- I/O matrix coverage.
- [x] `champions-app/lib/domain/dictation-readiness.ts` -- Require leveled students -- FR13 gate fix.
- [x] `champions-app/lib/services/count-leveled-active-students.ts` -- Count service -- readiness input.
- [x] `champions-app/lib/services/list-dictations.ts` -- History query -- year list.
- [x] `champions-app/lib/services/create-dictation.ts` -- Insert with matrix validation -- core mutation.
- [x] `champions-app/lib/services/create-dictation.test.ts` -- Service tests -- happy + error paths.
- [x] `champions-app/lib/services/reset-class-year.ts` -- Delete dictations on reset -- FR44 extension.
- [x] `champions-app/app/(dashboard)/dictations/create-dictation-dialog.tsx` -- Modal create UI -- FR12 surface.
- [x] `champions-app/app/(dashboard)/dictations/actions.ts` -- `createDictationAction` -- server entry point.
- [x] `champions-app/app/(dashboard)/dictations/page.tsx` -- History list + enabled button -- Dictées tab.
- [x] `champions-app/app/(dashboard)/dictations/[id]/page.tsx` -- Placeholder detail -- post-create redirect target.
- [x] `champions-app/app/(dashboard)/dictations/actions.test.ts` -- Action tests -- auth + redirect.
- [x] `champions-app/app/(dashboard)/dictations/page.test.tsx` -- Page regression tests -- blocking + list states.

**Acceptance Criteria:**
- Given my roster has leveled students and the word-count matrix is configured, when I click « Nouvelle dictée », enter a label matching a matrix row and a date (default today), and submit, then a Dictation record is created scoped to my Class and I am redirected to its detail page (FR12).
- Given one or more dictations exist, when I view the Dictées tab, then they appear in the year history list ordered by date (newest first).
- Given my roster is empty or has no leveled students, when I view Dictées, then creation is blocked with an explanatory message (FR13).
- Given no matrix row matches the submitted label, when I try to create, then no record is created and I see a French error explaining the matrix requirement (FR13).

## Design Notes

Matrix label `<select>` options come from `listWordCountMatrixRows(classId)` using each row's `dictationLabelKey` for value and stored display label for option text. `dictation_date` stored as Postgres `date`; format displayed with `fr-FR` locale. History list: simple bordered list with link to `/dictations/{id}` per row.

## Verification

**Commands:**
- `cd champions-app && npm run db:push` -- expected: `dictations` table created in Neon (run locally before manual UI test).
- `cd champions-app && npm test` -- expected: all tests pass including new domain, service, action, and page tests.
- `cd champions-app && npm run build` -- expected: production build succeeds.

**Manual checks (if no CLI):**
- Config matrix with label « Dictée 1 » → Dictées → create with that label → appears in list → lands on placeholder detail.
- Submit unknown label → French matrix error, no DB row.
- Roster with only unassigned students → button disabled with level-assignment guidance.

## Spec Change Log

## Suggested Review Order

**Dictation creation flow**

- Server action gates creation on leveled roster + matrix readiness before insert
  [`actions.ts:22`](../../champions-app/app/(dashboard)/dictations/actions.ts#L22)

- Core insert validates label against complete matrix rows only
  [`create-dictation.ts:31`](../../champions-app/lib/services/create-dictation.ts#L31)

- Dictées page wires history list, readiness messaging, and create modal
  [`page.tsx:21`](../../champions-app/app/(dashboard)/dictations/page.tsx#L21)

**Domain & readiness**

- Label/date validation and matrix-row matching helpers
  [`dictation.ts:36`](../../champions-app/lib/domain/dictation.ts#L36)

- Readiness gate now requires leveled students, not just active roster count
  [`dictation-readiness.ts:11`](../../champions-app/lib/domain/dictation-readiness.ts#L11)

- Shared complete-matrix-row check reused by wizard and creation
  [`word-count-matrix.ts:47`](../../champions-app/lib/domain/word-count-matrix.ts#L47)

**Schema & data lifecycle**

- New `dictations` table scoped to class with label key and date
  [`schema.ts:85`](../../champions-app/lib/db/schema.ts#L85)

- Year reset deletes dictations inside existing transaction
  [`reset-class-year.ts:37`](../../champions-app/lib/services/reset-class-year.ts#L37)

**UI surfaces**

- Native dialog modal for label select + date with server action
  [`create-dictation-dialog.tsx:32`](../../champions-app/app/(dashboard)/dictations/create-dictation-dialog.tsx#L32)

- Placeholder detail page for post-create redirect (grid in story 3.2)
  [`page.tsx:22`](../../champions-app/app/(dashboard)/dictations/[id]/page.tsx#L22)

**Tests**

- Service and action tests cover matrix match, incomplete rows, readiness guard
  [`create-dictation.test.ts:39`](../../champions-app/lib/services/create-dictation.test.ts#L39)

- Page tests cover blocking states and history ordering
  [`page.test.tsx:48`](../../champions-app/app/(dashboard)/dictations/page.test.tsx#L48)
