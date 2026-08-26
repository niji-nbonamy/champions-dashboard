---
title: '2-5 Year-Start Wizard (E3)'
type: 'feature'
created: '2026-08-26'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'bcd5c8209f8fd30b7993e11651bca8c9649f6ddf'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-testBMAD-2026-08-24/EXPERIENCE.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-testBMAD-2026-08-24/DESIGN.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** After CSV import, teachers land on Config with a success banner but no guided setup. Roster confirmation, bulk level assignment, and word-count matrix configuration are scattered across tabs with no completion signal — so Epic 3 cannot reliably unlock « Nouvelle dictée » (FR11, UX-DR19).

**Approach:** Add a dedicated 3-step year-start wizard route opened automatically after successful CSV import. Reuse existing roster, level-picker, and matrix components inside a linear shell with back navigation. Persist wizard completion on the `classes` row; gate the Dictées CTA until completion while keeping dashboard tabs reachable.

## Boundaries & Constraints

**Always:**
- Wizard opens automatically immediately after a successful CSV import (replace current `/config?imported=N` redirect) (FR11, story 2.1 defer).
- Three linear steps with visible progress and back navigation between steps (UX-DR19):
  1. **Roster confirm** — list active students; teacher reviews names and may remove erroneous entries before continuing.
  2. **Level assignment** — reuse E1 dot picker for every student; « Suivant » disabled until `countUnassignedActiveStudents === 0`.
  3. **Word matrix** — reuse F1 matrix form; « Terminer » disabled until at least one complete matrix row exists in DB (all four counts > 0 per row).
- Step forward CTAs use `Button variant="accent"` (outline violet); final confirm uses primary mint (UX-DR7, DESIGN.md).
- French microcopy throughout; no school grade in copy (NFR14).
- Class-scoped auth via `getTeacherClass`; unauthenticated → `/login`; no class → `/onboarding/class`.
- Persist `yearStartWizardCompletedAt` (non-null timestamp) on `classes` when step 3 completes successfully.
- Dictées page shows « Nouvelle dictée » button: **enabled** only when `yearStartWizardCompletedAt` is set; disabled with explanatory text when wizard incomplete (Epic 3 create flow not built — button is a gated placeholder linking nowhere or `#` with tooltip).
- Level assignment cannot be bypassed for first scored dictation: unassigned students remain blocked from dictation grids (existing Epic 2 rule); wizard step 2 enforces all levels before step 3.
- Do not log student names in server info logs (NFR10).
- Revalidate wizard route, `/dictations`, `/students`, and `/config` on wizard-affecting mutations.

**Ask First:**
- Wizard route path (default: `/onboarding/year-start` with `?step=1|2|3`).
- Step 1 student removal mechanism: hard delete row vs set `archived=true` (default: hard delete only while wizard incomplete and student has no level history — story 2.6 owns mid-year archive UX).
- Whether manual roster add (story 2.2) should also trigger wizard when roster was empty and wizard never completed (default: yes — redirect to wizard step 1 when first student added and wizard incomplete).
- Whether teachers with wizard incomplete may browse Config/Élèves freely or get redirected to wizard (default: allow browse; only Dictées CTA stays locked).

**Never:**
- Full dictation creation UI or grid (Epic 3).
- Mid-year archive workflow UI beyond minimal step-1 removal (story 2.6).
- Annual year reset or post-reset redirect (story 2.8 / FR45).
- Empty-roster pre-setup states (story 2.7).
- Modal/dialog wizard — use full-page shell like onboarding class (EXPERIENCE.md).
- Client-only wizard completion without server persistence.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Post-import redirect | Successful CSV import | Redirect to wizard step 1 (not `/config?imported=N`) | N/A |
| Step 1 confirm | ≥1 active student, teacher clicks « Confirmer » | Navigate to step 2 | Block « Confirmer » if zero students remain |
| Step 1 remove student | Click remove on a row | Student removed from active roster; list updates | French error if removal fails |
| Step 2 forward blocked | Any student `level === null` | « Suivant » disabled; show X/Y assigned counter | N/A |
| Step 2 all leveled | All students have valid level | « Suivant » enabled → step 3 | N/A |
| Step 3 finish blocked | Zero complete matrix rows | « Terminer » disabled | N/A |
| Step 3 finish success | ≥1 valid matrix row saved | Set `yearStartWizardCompletedAt`; redirect `/dictations` | N/A |
| Back navigation | On step 2 or 3, click « Retour » | Previous step renders with current data | N/A |
| Dictées locked | Wizard incomplete | « Nouvelle dictée » visible but disabled + helper text | N/A |
| Dictées unlocked | Wizard complete | « Nouvelle dictée » enabled (placeholder until Epic 3) | N/A |
| Direct URL step skip | User opens `?step=3` with unassigned students | Redirect to earliest incomplete step | N/A |
| Wizard already complete | User hits wizard URL | Redirect to `/dictations` | N/A |
| Unauthenticated | No session | Redirect `/login` | N/A |

</frozen-after-approval>

## Code Map

- `champions-app/lib/db/schema.ts` -- **MODIFY** add `yearStartWizardCompletedAt` nullable timestamp on `classes`. [`schema.ts:20`](../../champions-app/lib/db/schema.ts#L20)
- `champions-app/lib/services/complete-year-start-wizard.ts` -- **CREATE** set completion timestamp scoped to classId (idempotent if already set).
- `champions-app/lib/services/complete-year-start-wizard.test.ts` -- **CREATE** success + already-complete paths.
- `champions-app/lib/services/remove-active-student.ts` -- **CREATE** hard-delete active student for class when wizard incomplete (no dictation history yet).
- `champions-app/lib/services/remove-active-student.test.ts` -- **CREATE** auth scope + not-found cases.
- `champions-app/lib/services/get-year-start-wizard-status.ts` -- **CREATE** derive `{ completed, step, activeStudentCount, unassignedCount, matrixRowCount }` for guards.
- `champions-app/lib/services/get-year-start-wizard-status.test.ts` -- **CREATE** step resolution logic.
- `champions-app/app/(dashboard)/config/actions.ts` -- **MODIFY** `importRosterCsvAction` redirect to wizard step 1 instead of `/config?imported=`. [`actions.ts:124`](../../champions-app/app/(dashboard)/config/actions.ts#L124)
- `champions-app/app/onboarding/year-start/page.tsx` -- **CREATE** server page: load status, render current step, guard redirects.
- `champions-app/app/onboarding/year-start/wizard-shell.tsx` -- **CREATE** client step indicator + back/next chrome.
- `champions-app/app/onboarding/year-start/step-roster.tsx` -- **CREATE** step 1 list + remove + confirm (adapt roster list styling).
- `champions-app/app/onboarding/year-start/step-levels.tsx` -- **CREATE** step 2 wrapper around `RosterList` / `LevelDotPicker`.
- `champions-app/app/onboarding/year-start/step-matrix.tsx` -- **CREATE** step 3 wrapper around `WordCountMatrixForm`.
- `champions-app/app/onboarding/year-start/actions.ts` -- **CREATE** `confirmRosterStepAction`, `removeStudentFromWizardAction`, `completeYearStartWizardAction`.
- `champions-app/app/onboarding/class/page.tsx` -- **READ** centered onboarding layout pattern. [`page.tsx:22`](../../champions-app/app/onboarding/class/page.tsx#L22)
- `champions-app/app/(dashboard)/students/roster-list.tsx` -- **READ/EXTEND** optional props to hide level UI in step 1 or show picker-only in step 2. [`roster-list.tsx:12`](../../champions-app/app/(dashboard)/students/roster-list.tsx#L12)
- `champions-app/app/(dashboard)/students/level-dot-picker.tsx` -- **READ** E1 picker + `assignStudentLevelAction`. [`level-dot-picker.tsx:32`](../../champions-app/app/(dashboard)/students/level-dot-picker.tsx#L32)
- `champions-app/app/(dashboard)/config/word-count-matrix-form.tsx` -- **READ** F1 form + `saveWordCountMatrixAction`. [`word-count-matrix-form.tsx:112`](../../champions-app/app/(dashboard)/config/word-count-matrix-form.tsx#L112)
- `champions-app/app/(dashboard)/dictations/page.tsx` -- **MODIFY** load wizard status; render gated « Nouvelle dictée » CTA. [`page.tsx:1`](../../champions-app/app/(dashboard)/dictations/page.tsx#L1)
- `champions-app/components/ui/button.tsx` -- **READ** `variant="accent"` for wizard forward CTAs. [`button.tsx:14`](../../champions-app/components/ui/button.tsx#L14)
- `champions-app/lib/services/count-unassigned-active-students.ts` -- **READ** step 2 gate. [`count-unassigned-active-students.ts:17`](../../champions-app/lib/services/count-unassigned-active-students.ts#L17)
- `champions-app/lib/services/list-word-count-matrix-rows.ts` -- **READ** step 3 gate + form initial rows.

## Tasks & Acceptance

**Execution:**
- [x] `champions-app/lib/db/schema.ts` -- Add `yearStartWizardCompletedAt` to `classes` -- FR11 completion signal + FR45 prep.
- [x] `champions-app/lib/services/get-year-start-wizard-status.ts` -- Wizard state + earliest incomplete step -- URL guard logic.
- [x] `champions-app/lib/services/get-year-start-wizard-status.test.ts` -- Unit tests -- step resolution edge cases.
- [x] `champions-app/lib/services/remove-active-student.ts` -- Step 1 removal service -- roster confirm AC.
- [x] `champions-app/lib/services/remove-active-student.test.ts` -- Unit tests -- class scope + empty roster.
- [x] `champions-app/lib/services/complete-year-start-wizard.ts` -- Persist completion timestamp -- unlock Dictées CTA.
- [x] `champions-app/lib/services/complete-year-start-wizard.test.ts` -- Unit tests -- idempotent completion.
- [x] `champions-app/app/onboarding/year-start/actions.ts` -- Server actions for remove, step confirm, complete -- AD-3 mutations.
- [x] `champions-app/app/onboarding/year-start/wizard-shell.tsx` -- 3-step progress UI + back nav -- UX-DR19.
- [x] `champions-app/app/onboarding/year-start/step-roster.tsx` -- Step 1 review/remove/confirm UI -- FR11 step 1.
- [x] `champions-app/app/onboarding/year-start/step-levels.tsx` -- Step 2 leveled roster with gate -- FR11 + UX-DR19.
- [x] `champions-app/app/onboarding/year-start/step-matrix.tsx` -- Step 3 matrix with finish gate -- FR11 step 3.
- [x] `champions-app/app/onboarding/year-start/page.tsx` -- Orchestrate steps, guards, data loading -- wizard shell entry.
- [x] `champions-app/app/(dashboard)/config/actions.ts` -- Redirect import success to wizard -- auto-open AC.
- [x] `champions-app/app/(dashboard)/dictations/page.tsx` -- Gated « Nouvelle dictée » button -- unlock on completion.
- [x] `champions-app/app/onboarding/year-start/page.test.tsx` -- **CREATE** step guard + completed redirect tests.
- [x] `champions-app/app/(dashboard)/dictations/page.test.tsx` -- **UPDATE** locked vs unlocked button assertions.
- [x] `champions-app/app/(dashboard)/config/actions.test.ts` -- **UPDATE** import redirect target to wizard.

**Acceptance Criteria:**
- Given I have just completed a successful CSV import, when the import finishes, then the year-start wizard opens on step 1 (roster review).
- Given I am on wizard step 1, when I review the roster, then I can remove erroneous entries and confirm to proceed to step 2.
- Given I am on wizard step 2, when any student lacks a level, then I cannot proceed to step 3.
- Given all students have assigned levels, when I click « Suivant », then I reach step 3 (word-count matrix).
- Given I am on wizard step 3, when the matrix has no complete rows, then I cannot finish the wizard.
- Given I save a valid matrix and finish the wizard, when I land on Dictées, then « Nouvelle dictée » is enabled.
- Given the wizard is incomplete, when I open Dictées, then « Nouvelle dictée » is visible but disabled with guidance text.
- Given I am on step 2 or 3, when I click « Retour », then I return to the previous step without losing persisted data.
- Given I try to open a later wizard step URL while earlier steps are incomplete, when the page loads, then I am redirected to the earliest incomplete step.

## Design Notes

Use a centered column layout matching `onboarding/class` (max-width ~640px for steps 1–2; step 3 matrix may use wider `max-w-4xl`). Step indicator: « Étape 1 sur 3 — Liste d'élèves » etc. Step 1 list reuses bordered `divide-y` roster styling but adds a text « Retirer » action per row. Step 2 shows « Niveaux assignés : X/Y » above the list. Step 3 embeds `WordCountMatrixForm` with a footer « Terminer la configuration » primary button that calls completion only after a successful matrix save.

## Verification

**Commands:**
- `cd champions-app && npm run db:push` -- expected: `classes.year_start_wizard_completed_at` column exists in Neon.
- `cd champions-app && npm test` -- expected: all tests pass including wizard status, removal, completion, dictations gate, import redirect.
- `cd champions-app && npm run build` -- expected: production build succeeds.

**Manual checks (if no CLI):**
- Import CSV → wizard step 1 opens (not Config banner only).
- Remove a student on step 1 → confirm → assign all levels on step 2 → save matrix on step 3 → Dictées shows enabled « Nouvelle dictée ».
- Before wizard complete, Dictées shows disabled button with helper text.

## Spec Change Log

### Review Findings

- [x] [Review][Patch] `completeYearStartWizard` lacked prerequisite validation before timestamp write [`complete-year-start-wizard.ts:49`]
- [x] [Review][Patch] Finish action silently redirected on error without user feedback [`actions.ts:155`]
- [x] [Review][Patch] Step 2 forward allowed when roster empty after concurrent removals [`actions.ts:71`]
- [x] [Review][Patch] Student with assigned level but no history could be hard-deleted [`remove-active-student.ts:67`]
- [x] [Review][Patch] Confirm button active while remove action still pending [`step-roster.tsx:74`]
- [x] [Review][Patch] `addStudentAction` did not revalidate wizard route [`students/actions.ts:53`]
- [x] [Review][Patch] Missing tests for wizard actions, page steps 2/3, dictations auth guards [`actions.test.ts`, `page.test.tsx`, `dictations/page.test.tsx`]
- [x] [Review][Defer] Manual first-student add should redirect to wizard (Ask First default) — not in execution tasks [`students/actions.ts`]
- [x] [Review][Defer] Post-import success count no longer surfaced after redirect change [`config/actions.ts:126`]
- [x] [Review][Reject] CSV re-import after wizard complete — blocked by empty-roster-only import rule (story 2.1)

## Suggested Review Order

**Wizard orchestration**

- Server page resolves earliest incomplete step and guards URL skips
  [`page.tsx:58`](../../champions-app/app/onboarding/year-start/page.tsx#L58)

- Step indicator shell with back navigation and accent forward CTAs
  [`wizard-shell.tsx:1`](../../champions-app/app/onboarding/year-start/wizard-shell.tsx#L1)

**Completion signal & guards**

- Nullable completion timestamp on classes drives Dictées unlock
  [`schema.ts:27`](../../champions-app/lib/db/schema.ts#L27)

- Derived wizard status: roster, levels, complete matrix rows
  [`get-year-start-wizard-status.ts:52`](../../champions-app/lib/services/get-year-start-wizard-status.ts#L52)

- Service validates prerequisites before persisting completion
  [`complete-year-start-wizard.ts:49`](../../champions-app/lib/services/complete-year-start-wizard.ts#L49)

**Step UIs**

- Step 1 roster review with per-row remove and confirm gate
  [`step-roster.tsx:22`](../../champions-app/app/onboarding/year-start/step-roster.tsx#L22)

- Step 2 reuses E1 picker with X/Y assigned counter
  [`step-levels.tsx:1`](../../champions-app/app/onboarding/year-start/step-levels.tsx#L1)

- Step 3 embeds F1 matrix form plus finish action with error surfacing
  [`wizard-finish-button.tsx:7`](../../champions-app/app/onboarding/year-start/wizard-finish-button.tsx#L7)

**Integration points**

- CSV import redirects to wizard step 1 instead of Config banner
  [`actions.ts:126`](../../champions-app/app/(dashboard)/config/actions.ts#L126)

- Dictées page gates « Nouvelle dictée » on wizard completion
  [`page.tsx:22`](../../champions-app/app/(dashboard)/dictations/page.tsx#L22)

- Hard-delete removal scoped to incomplete wizard without level
  [`remove-active-student.ts:31`](../../champions-app/lib/services/remove-active-student.ts#L31)

**Tests**

- Wizard action redirects, guards, and revalidation paths
  [`actions.test.ts:1`](../../champions-app/app/onboarding/year-start/actions.test.ts#L1)

- Page step routing and Dictées locked/unlocked states
  [`page.test.tsx:76`](../../champions-app/app/onboarding/year-start/page.test.tsx#L76)
