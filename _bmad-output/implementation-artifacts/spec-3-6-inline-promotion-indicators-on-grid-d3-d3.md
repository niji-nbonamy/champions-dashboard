---
title: '3-6 Inline Promotion Indicators on Grid (D3/D3+)'
type: 'feature'
created: '2026-08-28'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'c680ce86689ae0fbf22988f3dd8ea9711ad7aa49'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
  - '{project-root}/_bmad-output/specs/spec-dashboards-dictees-champions-ce2/level-system.md'
  - '{project-root}/_bmad-output/specs/spec-dashboards-dictees-champions-ce2/ux-decisions.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Stories 3.4–3.5 create `pending_promotions` on save but the class grid shows no promotion affordances. Teachers must leave dictation capture to act on level readiness (FR18–FR19, UX-DR9).

**Approach:** Load pending promotions for grid students server-side, render D3 ⬆️ (non-interactive) and D3+ **+** (opens Valider/Refuser dialog) on each row, and add shared validate/refuse services + Server Actions that update `students.level`, write `level_history_entries`, delete pending, and refresh the grid.

## Boundaries & Constraints

**Always:**
- Auth + class scope unchanged (NFR1). All promotion mutations re-verify student belongs to teacher's class and has an active pending row.
- Indicators driven by `pending_promotions` row for that student — same source of truth as D1/D2 (FR30, level-system.md). No client-side promotion eligibility preview before save.
- **D3 ⬆️:** non-interactive, `aria-hidden="true"`, promotion-ready blue `#2563EB`, at row start before student name (FR18).
- **D3+ +:** circular promotion-ready blue button at row end after column S; `aria-label` includes student first name; opens dialog without leaving grid (FR19, UX-DR9).
- **Dialog:** native `<dialog>` pattern (like `create-dictation-dialog.tsx`); title « Prêt à monter → {niveau} » using `getChampionsLevelFrenchLabel(targetLevel)`; mint **Valider** / outline **Refuser**; `Esc` closes (UX-DR7/8).
- **Validate:** tx updates `students.level` to `targetLevel`, inserts `level_history_entries` (`action: "promoted"`, `level: targetLevel`), deletes pending row. Idempotent if pending already cleared.
- **Refuse:** tx inserts `level_history_entries` (`action: "refused"`, `level: targetLevel`), deletes pending; student level unchanged; streak resets implicitly (no re-insert until save re-qualifies).
- After validate/refuse or dictation save: `router.refresh()` so indicators sync across rows (FR30).
- On validate in **new-entry** mode (no saved entries): refresh updates `LevelBadge` and `wordTotalsByStudentId` from current roster level × matrix. In **edit/reopen** mode (3.5): badge stays `levelAtSave` snapshot; word totals stay snapshot denominators — promotion does not retroactively alter saved dictation rows.
- Read-only archived rows: show ⬆️ if pending exists but hide **+** (no promotion action from archived row).
- No student names in server logs (NFR10). French microcopy only.

**Ask First:**
- Client-side **+** preview during entry before save when current counts would qualify but no pending row yet — default **exclude** (post-save indicators only).

**Never:**
- Dossier banner D1, Alertes queue D2, manual level override UI (Epic 4).
- Duplicate `evaluatePendingPromotion` logic or client-authoritative promotion outcomes.
- Automatic level change without explicit Valider.
- Dictation delete/purge.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Pending exists | Student has `pending_promotions` row | ⬆️ at row start; **+** at row end | N/A |
| No pending | Student has no pending row | No promotion indicators | N/A |
| Tap **+** | Pending exists | Dialog opens with target level label | N/A |
| Validate | Pending exists, active student | Level updated; history `promoted`; pending deleted; indicators removed | Toast success |
| Refuse | Pending exists | Level unchanged; history `refused`; pending deleted | Toast success |
| Concurrent action | Pending already cleared | No-op or graceful error; UI refreshes | Generic toast |
| After dictation save | Save creates new pending | `router.refresh()` shows indicators | N/A |
| Archived read-only row | Pending + archived entry | ⬆️ visible; **+** hidden | N/A |
| Gold student | No pending possible | No indicators | N/A |

</frozen-after-approval>

## Code Map

- `champions-app/lib/db/schema.ts` -- **REUSE** `pendingPromotions` (L132), `levelHistoryEntries` (L52), `students.level`. No schema change expected.
- `champions-app/lib/domain/promotion.ts` -- **REUSE** `getNextLevel`, thresholds; no new domain logic. [`promotion.ts:33`](../../champions-app/lib/domain/promotion.ts#L33)
- `champions-app/lib/domain/champions-level.ts` -- **REUSE** `getChampionsLevelFrenchLabel`, `parseChampionsLevel`. [`champions-level.ts:30`](../../champions-app/lib/domain/champions-level.ts#L30)
- `champions-app/lib/services/list-pending-promotions.ts` -- **CREATE** `listPendingPromotionsForStudents(classId, studentIds)` join students for class scope; return `Record<studentId, { targetLevel }>`.
- `champions-app/lib/services/validate-student-promotion.ts` -- **CREATE** transactional validate; pattern from `assign-student-level.ts` tx + `level_history`. [`assign-student-level.ts:85`](../../champions-app/lib/services/assign-student-level.ts#L85)
- `champions-app/lib/services/refuse-student-promotion.ts` -- **CREATE** transactional refuse (history + delete pending).
- `champions-app/lib/services/validate-student-promotion.test.ts` + `refuse-student-promotion.test.ts` -- **CREATE** happy path, missing pending, class-scope guard.
- `champions-app/lib/services/dictation-save.ts` -- **REUSE** pending insert on save; no change unless tests need hooks.
- `champions-app/app/(dashboard)/dictations/actions.ts` -- **MODIFY** add `validatePromotionAction` / `refusePromotionAction`; `revalidatePath` dictation page. [`actions.ts:86`](../../champions-app/app/(dashboard)/dictations/actions.ts#L86)
- `champions-app/components/promotion/promotion-dialog.tsx` -- **CREATE** shared Valider/Refuser dialog (D3+ now, D1 Epic 4 reuse); `<dialog>` + `showModal()`. Pattern: [`create-dictation-dialog.tsx:85`](../../champions-app/app/(dashboard)/dictations/create-dictation-dialog.tsx#L85)
- `champions-app/components/promotion/promotion-dialog.test.tsx` -- **CREATE** render, Esc close, action callbacks.
- `champions-app/components/grid/class-grid.tsx` -- **MODIFY** props `pendingPromotionsByStudentId`; D3/D3+ in row `<th>` start + trailing `<td>`; wire dialog; `router.refresh()` after save (L264) and promotion action. [`class-grid.tsx:343`](../../champions-app/components/grid/class-grid.tsx#L343)
- `champions-app/components/grid/class-grid.test.tsx` -- **MODIFY** indicator visibility, dialog open, archived row hides **+**.
- `champions-app/app/(dashboard)/dictations/[id]/page.tsx` -- **MODIFY** fetch pending for grid student IDs; pass prop. [`page.tsx:54`](../../champions-app/app/(dashboard)/dictations/[id]/page.tsx#L54)
- `champions-app/app/(dashboard)/dictations/[id]/page.test.tsx` -- **MODIFY** pending prop plumbing.
- `champions-app/lib/design/tokens.ts` + `globals.css` -- **REUSE** `--promotion-ready: #2563EB`.

## Tasks & Acceptance

**Execution:**
- [x] `champions-app/lib/services/list-pending-promotions.ts` -- class-scoped pending lookup -- server data for indicators.
- [x] `champions-app/lib/services/validate-student-promotion.ts` + test -- promoted tx -- FR19 validate path.
- [x] `champions-app/lib/services/refuse-student-promotion.ts` + test -- refused tx + streak reset -- level-system.md.
- [x] `champions-app/components/promotion/promotion-dialog.tsx` + test -- shared D1/D3+ dialog -- UX-DR8.
- [x] `champions-app/app/(dashboard)/dictations/actions.ts` -- promotion Server Actions -- mutation entry points.
- [x] `champions-app/app/(dashboard)/dictations/[id]/page.tsx` + test -- fetch + pass pending map -- page integration.
- [x] `champions-app/components/grid/class-grid.tsx` + test -- D3/D3+ UI, dialog wiring, post-save refresh -- FR18/FR19 core.

**Acceptance Criteria:**
- Given a student has a pending promotion after a previous save, when I view their row on the class grid, then a ⬆️ indicator appears at row start (FR18).
- Given promotion criteria are met (pending row exists), when I view their row, then a **+** button appears at row end (FR19, UX-DR9).
- Given I tap **+**, when the dialog opens, then I can Valider or Refuser without leaving the grid (FR19).
- Given I tap Valider, when the action succeeds, then the student's level updates, the row badge reflects the new level (new-entry mode), and indicators disappear (FR19).
- Given I tap Refuser, when the action succeeds, then the student level is unchanged and the pending alert is cleared (level-system.md).
- Given at most one pending promotion per student, when I validate or refuse from the grid, then the same pending state clears as on other surfaces (FR30).

## Design Notes

Extract `PromotionDialog` as the shared Valider/Refuser shell — Epic 4.3 (D1 banner) will compose the same component. Promotion services are separate from `assignStudentLevel` because promotion requires an existing level and consumes `pending_promotions`.

`listPendingPromotionsForStudents` should inner-join `students` on `classId` to prevent cross-class leakage even if IDs are guessed.

Post-save refresh in `handleSave` is required so a qualifying save immediately surfaces ⬆️/+ without manual reload.

## Verification

**Commands:**
- `cd champions-app && npm test` -- expected: promotion service + dialog + grid indicator tests pass.
- `cd champions-app && npm run build` -- expected: production build succeeds.

**Manual checks (if no CLI):**
- Save two qualifying dictations for a yellow student → reopen/new dictation → ⬆️ and **+** appear → Valider → level dot turns green and **+** disappears.

## Spec Change Log

### Review Findings

- [x] [Review][Patch] Include archived grid students in pending lookup — removed `archived` filter [`list-pending-promotions.ts:32`](../../champions-app/lib/services/list-pending-promotions.ts#L32)
- [x] [Review][Patch] Guard concurrent save during promotion — `isPromotionPending` blocks save [`class-grid.tsx:268`](../../champions-app/components/grid/class-grid.tsx#L268)
- [x] [Review][Patch] sr-only text for ⬆️ indicator — screen reader support [`class-grid.tsx:456`](../../champions-app/components/grid/class-grid.tsx#L456)
- [x] [Review][Patch] Fix + button aria-label — opens dialog, not immediate validate [`class-grid.tsx:508`](../../champions-app/components/grid/class-grid.tsx#L508)
- [x] [Review][Defer] Streak reset on refuse relies on re-evaluation on next save — same two qualifying entries may re-pending until new dictations qualify
- [x] [Review][Patch] Block Enregistrer while promotion dialog is open — disable save and Enter when `promotionDialogStudentId !== null` (resolved: block save while dialog open) [`class-grid.tsx:277`](../../champions-app/components/grid/class-grid.tsx#L277)
- [x] [Review][Defer] Add + button to keyboard Tab order — `isLastCell` ends at column S; D3+ **+** is click-only (resolved: out of MVP scope for story 3-6; defer to accessibility story) [`class-grid.tsx:515`](../../champions-app/components/grid/class-grid.tsx#L515)
- [x] [Review][Patch] Idempotent validate/refuse when pending already cleared — `PendingPromotionNotFoundError` treated as success; other errors return generic message [`actions.ts:155`](../../champions-app/app/(dashboard)/dictations/actions.ts#L155) [`class-grid.tsx:349`](../../champions-app/components/grid/class-grid.tsx#L349)
- [x] [Review][Patch] Validate `targetLevel` matches `getNextLevel(currentLevel)` — stale pending row rejected inside transaction [`validate-student-promotion.ts:66`](../../champions-app/lib/services/validate-student-promotion.ts#L66)
- [x] [Review][Patch] Move pending row read inside transaction — pending lookup moved into tx for validate/refuse [`validate-student-promotion.ts:47`](../../champions-app/lib/services/validate-student-promotion.ts#L47) [`refuse-student-promotion.ts:29`](../../champions-app/lib/services/refuse-student-promotion.ts#L29)
- [x] [Review][Patch] Add page reopen pending wiring test — reopen test asserts `listPendingPromotionsForStudents` call and prop for archived+active IDs [`page.test.tsx:284`](../../champions-app/app/(dashboard)/dictations/[id]/page.test.tsx#L284)
- [x] [Review][Patch] Add page non-empty pending propagation test — new-entry test asserts non-empty map [`page.test.tsx:174`](../../champions-app/app/(dashboard)/dictations/[id]/page.test.tsx#L174)
- [x] [Review][Patch] Add `list-pending-promotions` service tests — archived inclusion and invalid target levels covered [`list-pending-promotions.test.ts`](../../champions-app/lib/services/list-pending-promotions.test.ts)
- [x] [Review][Patch] Add class-grid refuse flow test — refuse path asserts action, toast, refresh [`class-grid.test.tsx:933`](../../champions-app/components/grid/class-grid.test.tsx#L933)
- [x] [Review][Patch] Add promotion-dialog Esc/refuse tests — Esc and Refuser callbacks covered [`promotion-dialog.test.tsx:45`](../../champions-app/components/promotion/promotion-dialog.test.tsx#L45)
- [x] [Review][Patch] Add `validatePromotionAction` / `refusePromotionAction` tests — auth, revalidate, idempotency, generic errors [`actions.test.ts`](../../champions-app/app/(dashboard)/dictations/actions.test.ts)
- [x] [Review][Patch] Add class-scope guard tests for promotion services — wrong-class cases covered [`validate-student-promotion.test.ts`](../../champions-app/lib/services/validate-student-promotion.test.ts)
- [x] [Review][Patch] Add `isPromotionPending` save-block and promotion error-path grid tests — dialog-open save block, pending save block, error keeps dialog open [`class-grid.tsx:277`](../../champions-app/components/grid/class-grid.tsx#L277)
- [x] [Review][Patch] Handle `listPendingPromotionsForStudents` failure on dictation page — `loadPendingPromotionsForGrid` degrades to `{}` [`page.tsx:102`](../../champions-app/app/(dashboard)/dictations/[id]/page.tsx#L102)
- [x] [Review][Patch] Harmonize dialog close on promotion error — catch path no longer closes dialog; both error paths keep dialog open [`class-grid.tsx:349`](../../champions-app/components/grid/class-grid.tsx#L349)
- [x] [Review][Defer] Archived read-only row shows ⬆️ but hides **+** with no D1/D2 surface yet — pending on archived student is visible but unactionable until Epic 4 [`class-grid.tsx:534`](../../champions-app/components/grid/class-grid.tsx#L534) — deferred, Epic 4 backlog

## Suggested Review Order

**Promotion mutation services**

- Transactional validate: level update + history + pending delete
  [`validate-student-promotion.ts:44`](../../champions-app/lib/services/validate-student-promotion.ts#L44)

- Transactional refuse: history + pending delete, level unchanged
  [`refuse-student-promotion.ts:28`](../../champions-app/lib/services/refuse-student-promotion.ts#L28)

- Class-scoped pending lookup for grid student IDs
  [`list-pending-promotions.ts:12`](../../champions-app/lib/services/list-pending-promotions.ts#L12)

**Server Actions & page data**

- Auth-wrapped validate/refuse actions with revalidatePath
  [`actions.ts:129`](../../champions-app/app/(dashboard)/dictations/actions.ts#L129)

- Fetch pending map on both new-entry and reopen paths
  [`page.tsx:102`](../../champions-app/app/(dashboard)/dictations/[id]/page.tsx#L102)

**Grid UI (D3/D3+)**

- Row indicators, dialog wiring, post-save refresh
  [`class-grid.tsx:443`](../../champions-app/components/grid/class-grid.tsx#L443)

- Shared Valider/Refuser dialog shell for D1 reuse
  [`promotion-dialog.tsx:19`](../../champions-app/components/promotion/promotion-dialog.tsx#L19)

**Tests**

- Grid indicator visibility and validate flow
  [`class-grid.test.tsx:878`](../../champions-app/components/grid/class-grid.test.tsx#L878)
