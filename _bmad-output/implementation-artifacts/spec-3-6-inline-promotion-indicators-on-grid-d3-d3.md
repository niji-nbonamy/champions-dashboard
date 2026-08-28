---
title: '3-6 Inline Promotion Indicators on Grid (D3/D3+)'
type: 'feature'
created: '2026-08-28'
status: 'ready-for-dev'
review_loop_iteration: 0
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
- [ ] `champions-app/lib/services/list-pending-promotions.ts` -- class-scoped pending lookup -- server data for indicators.
- [ ] `champions-app/lib/services/validate-student-promotion.ts` + test -- promoted tx -- FR19 validate path.
- [ ] `champions-app/lib/services/refuse-student-promotion.ts` + test -- refused tx + streak reset -- level-system.md.
- [ ] `champions-app/components/promotion/promotion-dialog.tsx` + test -- shared D1/D3+ dialog -- UX-DR8.
- [ ] `champions-app/app/(dashboard)/dictations/actions.ts` -- promotion Server Actions -- mutation entry points.
- [ ] `champions-app/app/(dashboard)/dictations/[id]/page.tsx` + test -- fetch + pass pending map -- page integration.
- [ ] `champions-app/components/grid/class-grid.tsx` + test -- D3/D3+ UI, dialog wiring, post-save refresh -- FR18/FR19 core.

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
