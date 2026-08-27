---
title: '2-8 Annual Year Reset'
type: 'feature'
created: '2026-08-27'
status: 'done'
baseline_commit: 'f90027711f5fdd9751c5a81c7d2463f7cc533045'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-testBMAD-2026-08-24/EXPERIENCE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** At year end, teachers have no way to wipe class-scoped data and start a new school year. Prior stories deferred reset (2.5–2.7); Config hosts import and matrix only (FR43–FR45).

**Approach:** Add a Config « Remettre à zéro pour la nouvelle année » section with a confirmation modal (FR43). On confirm, run a class-scoped `resetClassYear` service inside one DB transaction: delete level history, students, word matrix; clear wizard timestamps on `classes`; optionally update `schoolYearLabel`; then redirect to year-start wizard step 1 (FR44, FR45).

## Boundaries & Constraints

**Always:**
- Trigger only from Config tab; button label « Remettre à zéro pour la nouvelle année » (FR43).
- Confirmation modal warns irreversibility: all students, dictations, levels, and settings will be permanently deleted — use French copy aligned with epics AC (FR43).
- Optional new school year label in modal; blank = keep current `schoolYearLabel`; non-blank must pass `validateSchoolYearLabel` / `getSchoolYearLabelValidationError`.
- Atomic delete in one `db.transaction`: (1) `level_history_entries` for class students, (2) `students` where `class_id`, (3) `word_count_matrix_rows` where `class_id`, (4) `UPDATE classes` set `year_start_roster_confirmed_at` and `year_start_wizard_completed_at` to `NULL`, update `school_year_label` when provided (FR44).
- Preserve `teachers` row and `classes` row (same `id`, `teacher_id`, `created_at`).
- Post-reset: `revalidatePath` on `/config`, `/onboarding/year-start`, `/dictations`, `/students`; `redirect("/onboarding/year-start?step=1")` (FR45) — mirror `importRosterCsvAction` and `WIZARD_AFFECTED_PATHS`.
- Auth: `auth` → `getTeacherClass`; no session → `/login`; no class → `/onboarding/class`.
- Server Action → service → transaction; typed errors; `isRedirectError` rethrow.
- French microcopy; no school grade in labels (NFR14). Do not log student names (NFR10).
- Epic 3 tables (`dictations`, `dictation_entries`, `pending_promotions`) do not exist yet — no schema change this story; document extension point in service for future tables.

**Ask First:**
- Modal implementation style (default: native `<dialog>` client component with focus trap — first real modal in app; FR43 requires modal, not bare `window.confirm`).
- Exact modal warning body copy if UX team wants wording beyond epics AC paraphrase.
- Whether to migrate `lib/db/index.ts` from `neon-http` to `neon-serverless` if integration tests show transaction batching issues (story 2.1 flagged this decision point).

**Never:**
- Delete or recreate `teachers` or `classes` rows.
- Partial reset leaving orphaned level history or matrix rows.
- Client-only reset without server persistence.
- Unarchive or preserve individual students/dictations across reset.
- Year-start wizard UI changes beyond post-reset redirect consumption (story 2.5 owns wizard).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Open modal | Click reset button on Config | Modal opens with irreversibility warning + optional label field + confirm/cancel | N/A |
| Cancel modal | Click cancel or backdrop | Modal closes; no DB changes | N/A |
| Confirm reset — full class | Students + matrix + wizard complete | All class-scoped child data deleted; wizard timestamps null; redirect `/onboarding/year-start?step=1` | N/A |
| Confirm reset — empty class | No students, no matrix | Transaction succeeds; timestamps cleared; redirect wizard step 1 | N/A |
| Optional label — valid | New label e.g. « 2026-2027 » | `school_year_label` updated | N/A |
| Optional label — blank | Empty field | Keep existing `school_year_label` | N/A |
| Optional label — invalid | Whitespace-only or >64 chars | No reset; modal shows validation error | `getSchoolYearLabelValidationError` message |
| Unauthenticated | No session | Redirect `/login` | N/A |
| No class | Teacher without class | Redirect `/onboarding/class` | N/A |
| Wrong class scope | Tampered class id (future) | Service scoped by authenticated `getTeacherClass` id only | « Classe introuvable. » |
| Transaction failure | DB error mid-transaction | Full rollback; user stays on Config | Generic « Réinitialisation impossible. Réessayez. » |

</frozen-after-approval>

## Code Map

- `champions-app/lib/db/schema.ts` -- **READ** class-scoped tables: `students`, `levelHistoryEntries`, `wordCountMatrixRows`, `classes` wizard fields. [`schema.ts:20`](../../champions-app/lib/db/schema.ts#L20)
- `champions-app/lib/db/index.ts` -- **READ** `neon-http` driver; transaction re-evaluation point per story 2.1. [`index.ts:1`](../../champions-app/lib/db/index.ts#L1)
- `champions-app/lib/domain/class.ts` -- **READ** `validateSchoolYearLabel`, `getSchoolYearLabelValidationError`. [`class.ts:9`](../../champions-app/lib/domain/class.ts#L9)
- `champions-app/lib/services/reset-class-year.ts` -- **CREATE** transactional cascade delete + class timestamp reset + optional label update.
- `champions-app/lib/services/reset-class-year.test.ts` -- **CREATE** delete order, label update/keep, class-not-found, transaction rollback mock.
- `champions-app/lib/services/replace-word-count-matrix.ts` -- **READ** `db.transaction` pattern reference. [`replace-word-count-matrix.ts:39`](../../champions-app/lib/services/replace-word-count-matrix.ts#L39)
- `champions-app/lib/services/remove-active-student.ts` -- **READ** level-history FK constraint; reset must delete history before students. [`remove-active-student.ts:84`](../../champions-app/lib/services/remove-active-student.ts#L84)
- `champions-app/app/(dashboard)/config/page.tsx` -- **MODIFY** add `#reset-annuel` section after `#matrice-mots`; pass current `schoolYearLabel`. [`page.tsx:58`](../../champions-app/app/(dashboard)/config/page.tsx#L58)
- `champions-app/app/(dashboard)/config/year-reset-section.tsx` -- **CREATE** client section: trigger button + modal form.
- `champions-app/app/(dashboard)/config/actions.ts` -- **MODIFY** add `resetClassYearAction`; redirect + revalidate paths. [`actions.ts:124`](../../champions-app/app/(dashboard)/config/actions.ts#L124)
- `champions-app/app/(dashboard)/config/actions.test.ts` -- **MODIFY** auth, validation error, success redirect `NEXT_REDIRECT:/onboarding/year-start?step=1`.
- `champions-app/app/(dashboard)/config/page.test.tsx` -- **MODIFY** reset section present; button label FR43.
- `champions-app/app/onboarding/year-start/actions.ts` -- **READ** `WIZARD_AFFECTED_PATHS` for revalidation parity. [`actions.ts:20`](../../champions-app/app/onboarding/year-start/actions.ts#L20)
- `champions-app/app/(dashboard)/students/archive-student-button.tsx` -- **READ** `useActionState` + confirm pattern (reset uses modal instead). [`archive-student-button.tsx:29`](../../champions-app/app/(dashboard)/students/archive-student-button.tsx#L29)

## Tasks & Acceptance

**Execution:**
- [x] `champions-app/lib/services/reset-class-year.ts` -- Transactional class data wipe + wizard reset -- FR44 core.
- [x] `champions-app/lib/services/reset-class-year.test.ts` -- Unit tests -- I/O matrix + delete order.
- [x] `champions-app/app/(dashboard)/config/year-reset-section.tsx` -- Modal UI + optional label field -- FR43 surface.
- [x] `champions-app/app/(dashboard)/config/actions.ts` -- `resetClassYearAction` with auth, validation, redirect -- server entry point.
- [x] `champions-app/app/(dashboard)/config/page.tsx` -- Wire reset section with current label -- Config tab host.
- [x] `champions-app/app/(dashboard)/config/actions.test.ts` -- Action tests -- redirect, validation, auth paths.
- [x] `champions-app/app/(dashboard)/config/page.test.tsx` -- Section + button label assertions -- regression guard.

**Acceptance Criteria:**
- Given I am on Config, when I click « Remettre à zéro pour la nouvelle année », then a confirmation modal warns that all students, dictations, levels, and settings will be permanently deleted and I can optionally enter a new school year label (FR43).
- Given I confirm the reset, when the transaction completes, then all class-scoped data in the current schema is deleted atomically, the Class and Teacher accounts are preserved, and I am redirected to year-start wizard E3 step 1 (FR44, FR45).
- Given I enter an invalid optional school year label, when I try to confirm, then reset is blocked with a French validation message and no data is deleted.

## Design Notes

Delete order inside transaction (no `onDelete: cascade`):

```ts
// 1. level_history_entries for students in class
// 2. students WHERE class_id
// 3. word_count_matrix_rows WHERE class_id
// 4. UPDATE classes SET wizard timestamps NULL, school_year_label IF provided
```

Post-reset redirect matches CSV import success path.

## Verification

**Commands:**
- `cd champions-app && npm test` -- expected: all tests pass including new reset service and config action tests.
- `cd champions-app && npm run build` -- expected: production build succeeds.

**Manual checks (if no CLI):**
- Config with populated roster + matrix → open modal → cancel → data unchanged.
- Confirm reset → land on `/onboarding/year-start?step=1` with empty roster state on Config/Dictées.

## Spec Change Log

- [x] [Review][Patch] Mock `ClassNotFoundError` must extend `ResetClassYearError` for `instanceof` in action handler [`actions.test.ts`]
- [x] [Review][Patch] Disable modal cancel/backdrop close while reset pending [`year-reset-section.tsx`]
- [x] [Review][Patch] Add `year-reset-section.test.tsx` for FR43 warning, validation alert, modal open/cancel [`year-reset-section.test.tsx`]
- [x] [Review][Patch] Cover `ClassNotFoundError` action path and in-transaction update miss [`actions.test.ts`, `reset-class-year.test.ts`]
- [x] [Review][Patch] Revert unrelated `empty-roster-pre-setup.tsx` scope creep

## Suggested Review Order

**Transactional reset (FR44)**

- Single transaction wipes history, students, matrix, wizard timestamps
  [`reset-class-year.ts:37`](../../champions-app/lib/services/reset-class-year.ts#L37)

- Server action: label validation, revalidation, wizard redirect
  [`actions.ts:155`](../../champions-app/app/(dashboard)/config/actions.ts#L155)

**Confirmation modal (FR43)**

- Native dialog with irreversibility warning and optional label
  [`year-reset-section.tsx:16`](../../champions-app/app/(dashboard)/config/year-reset-section.tsx#L16)

- Config page wires section after word matrix
  [`page.tsx:67`](../../champions-app/app/(dashboard)/config/page.tsx#L67)

**Tests**

- Service delete order and rollback paths
  [`reset-class-year.test.ts:119`](../../champions-app/lib/services/reset-class-year.test.ts#L119)

- Modal warning copy and open/cancel interactions
  [`year-reset-section.test.tsx:58`](../../champions-app/app/(dashboard)/config/year-reset-section.test.tsx#L58)

- Action auth, validation, redirect, and error surfaces
  [`actions.test.ts:521`](../../champions-app/app/(dashboard)/config/actions.test.ts#L521)

### Review Findings

- [x] [Review][Patch] Block Escape from closing modal during pending reset [`year-reset-section.tsx:68`]
- [x] [Review][Patch] Add `aria-invalid` / `aria-errormessage` on school year label input when validation fails [`year-reset-section.tsx:94`]
- [x] [Review][Patch] Add modal interaction tests: pending blocks close, backdrop cancel, form submit with label [`year-reset-section.test.tsx`]
- [x] [Review][Patch] Assert `#reset-annuel` absent when `getTeacherClass` returns null [`page.test.tsx`]
- [x] [Review][Patch] Reuse shared `WIZARD_AFFECTED_PATHS` for `revalidatePath` calls instead of hardcoded list [`actions.ts:189`]
- [x] [Review][Defer] No DB integration test for real `neon-http` transaction atomicity on `resetClassYear` — deferred, spec « Ask First » decision point
- [x] [Review][Defer] No `inArray` batching for very large student rosters — deferred, speculative scale edge case
- [x] [Review][Defer] `auth()` / `getTeacherClass()` throws outside try/catch — deferred, pre-existing pattern across config actions
