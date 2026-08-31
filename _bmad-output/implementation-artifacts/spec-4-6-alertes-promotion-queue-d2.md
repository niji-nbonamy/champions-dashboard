---
title: '4-6 Alertes Promotion Queue (D2)'
type: 'feature'
created: '2026-08-31'
status: 'done'
baseline_commit: '55d26d49dd730d087354581a3954022897079c2c'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-4-context.md'
  - '{project-root}/_bmad-output/specs/spec-dashboards-dictees-champions-ce2/level-system.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Pending promotions are actionable on the class grid (D3/D3+), dossier (D1), and Élèves roster (+), but the Alertes tab is still a placeholder. Teachers cannot batch-review ready students from a centralized queue (FR32, UX-DR17).

**Approach:** Load active non-archived pending promotions server-side, show them in an Alertes list with a tab badge count, and wire row taps to the shared `PromotionDialog` + existing validate/refuse Server Actions so D2 matches D1/D3+ semantics and cross-surface state stays synced.

## Boundaries & Constraints

**Always:**
- Reuse `validateStudentPromotion`, `refuseStudentPromotion`, `PromotionDialog`, and dossier Server Actions — no duplicate mutation logic (FR30, FR33).
- Queue includes only **active, non-archived** students with a `pending_promotions` row (same scope as validate/refuse services).
- Tab badge on Alertes when count > 0: numeric pill + `aria-label` « N élève(s) prêt(s) » (singular when N = 1). Use `bg-promotion-ready` styling to match promotion surfaces.
- Row tap opens `PromotionDialog` (modal) with Valider/Refuser — same copy and behavior as grid D3+ and roster + (not inline D1 banner).
- List sorted alphabetically by `displayName` (stable, factual).
- Empty queue: factual French empty state (e.g. « Aucun élève prêt à monter de niveau. »).
- After validate/refuse: toast + `router.refresh()`; revalidate `/alerts`, `/students`, `/dictations`, and affected dossier paths so badge, queue, grid, and D1 banner sync (FR30).
- French microcopy. No student names in server logs (NFR10). No schema changes.

**Ask First:**
- Linking queue rows to student dossier — default **exclude** (AC is dialog-only processing).

**Never:**
- Presentation mode (4-7), promotion detection rule changes (4-5), new validate/refuse transaction logic.
- Client-side promotion eligibility or authoritative outcomes.
- Showing archived students in the queue or badge count.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Pending promotions exist | 2 active students with pending rows | Alertes list shows both; tab badge « 2 » with aria « 2 élèves prêts » | N/A |
| Empty queue | Zero pending rows | Empty state message; no badge on Alertes tab | N/A |
| Row tap | Student with pending `green` target | `PromotionDialog` opens with « Prêt à monter → Vert » | N/A |
| Valider from queue | Pending exists | Level updates, pending clears, row disappears, badge decrements | Generic toast on failure |
| Refuser from queue | Pending exists | Level unchanged, pending clears, row disappears | Generic toast on failure |
| Race: cleared elsewhere | Action after grid/dossier validate | Idempotent success, refresh, no error toast | Same as other surfaces |
| Archived student | `archived: true` + pending row | Excluded from list and badge count | N/A |
| Singular badge | 1 pending student | Badge « 1 »; aria « 1 élève prêt » | N/A |

</frozen-after-approval>

## Code Map

- `champions-app/app/(dashboard)/alerts/page.tsx` -- **MODIFY** replace placeholder; server-load queue via new list service; render client queue component.
- `champions-app/app/(dashboard)/alerts/page.test.tsx` -- **CREATE** assert list rows, empty state, no placeholder copy.
- `champions-app/components/promotion/alerts-promotion-queue.tsx` -- **CREATE** `"use client"` list + row tap → `PromotionDialog`; call `validateDossierPromotionAction` / `refuseDossierPromotionAction` (same pattern as `roster-promotion-action.tsx`).
- `champions-app/components/promotion/alerts-promotion-queue.test.tsx` -- **CREATE** row render, dialog open, validate/refuse wiring, disabled-while-pending.
- `champions-app/lib/services/list-pending-promotion-queue.ts` -- **CREATE** `listPendingPromotionQueueForClass(classId)` → `{ studentId, displayName, targetLevel }[]` joined `pending_promotions` + `students`, filter `archived = false`, order by `displayName`.
- `champions-app/lib/services/list-pending-promotion-queue.test.ts` -- **CREATE** active-only filter, sort, parse target level.
- `champions-app/lib/services/count-pending-promotions.ts` -- **CREATE** `countPendingPromotionsForClass(classId)` — mirror `count-unassigned-active-students.ts` pattern.
- `champions-app/lib/services/count-pending-promotions.test.ts` -- **CREATE** count semantics, archived exclusion.
- `champions-app/app/(dashboard)/layout.tsx` -- **MODIFY** fetch `countPendingPromotionsForClass`; pass to shell. [`layout.tsx:25`](../../champions-app/app/(dashboard)/layout.tsx#L25)
- `champions-app/app/(dashboard)/layout.test.tsx` -- **MODIFY** mock count service; assert prop passed.
- `champions-app/components/dashboard/dashboard-shell.tsx` -- **MODIFY** accept `pendingPromotionCount` prop; forward to `NavTabs`.
- `champions-app/components/dashboard/nav-tabs.tsx` -- **MODIFY** promotion-ready badge on Alertes tab when count > 0; aria-label singular/plural. [`nav-tabs.tsx:32`](../../champions-app/components/dashboard/nav-tabs.tsx#L32)
- `champions-app/components/dashboard/nav-tabs.test.tsx` -- **MODIFY** badge presence/absence, singular copy, badge not on other tabs.
- `champions-app/app/(dashboard)/students/actions.ts` -- **MODIFY** add `revalidatePath("/alerts")` to `revalidateDossierPromotionPaths`. [`actions.ts:69`](../../champions-app/app/(dashboard)/students/actions.ts#L69)
- `champions-app/app/(dashboard)/dictations/actions.ts` -- **MODIFY** add `revalidatePath("/alerts")` to promotion action revalidate blocks. [`actions.ts:152`](../../champions-app/app/(dashboard)/dictations/actions.ts#L152)
- `champions-app/lib/services/list-pending-promotions.ts` -- **READ** existing per-student lookup; queue service is class-wide list variant. [`list-pending-promotions.ts:12`](../../champions-app/lib/services/list-pending-promotions.ts#L12)
- `champions-app/components/promotion/promotion-dialog.tsx` -- **REUSE** modal UI unchanged. [`promotion-dialog.tsx:19`](../../champions-app/components/promotion/promotion-dialog.tsx#L19)
- `champions-app/components/promotion/roster-promotion-action.tsx` -- **READ** client mutation + toast + refresh pattern to mirror. [`roster-promotion-action.tsx:43`](../../champions-app/components/promotion/roster-promotion-action.tsx#L43)

## Tasks & Acceptance

**Execution:**
- [x] `champions-app/lib/services/list-pending-promotion-queue.ts` + test -- class-wide queue query with archived filter and name sort -- D2 data source.
- [x] `champions-app/lib/services/count-pending-promotions.ts` + test -- badge count for layout -- UX-DR17 tab badge.
- [x] `champions-app/components/promotion/alerts-promotion-queue.tsx` + test -- list UI + dialog + mutations -- FR32 one-by-one processing.
- [x] `champions-app/app/(dashboard)/alerts/page.tsx` + test -- wire server page -- replace placeholder.
- [x] `champions-app/components/dashboard/nav-tabs.tsx` + `dashboard-shell.tsx` + `layout.tsx` + tests -- tab badge plumbing -- UX-DR17.
- [x] `champions-app/app/(dashboard)/students/actions.ts` + `dictations/actions.ts` -- revalidate `/alerts` on promotion mutations -- FR30 cross-surface sync.

**Acceptance Criteria:**
- Given one or more active students have pending promotions, when I open the Alertes tab, then I see a list of those students processable one-by-one (FR32).
- Given N active students have pending promotions, when I view the tab bar, then the Alertes tab shows a badge with count N and accessible label « N élève(s) prêt(s) » (UX-DR17).
- Given I tap a student row in the queue, when the dialog opens, then Valider/Refuser behave identically to D1/D3+ (same services, same outcomes).
- Given I validate or refuse from any surface first, when I refresh another surface, then the queue, badge, grid indicators, and dossier banner reflect the cleared pending state (FR30).
- Given no pending promotions exist, when I open Alertes, then I see an empty state and no badge on the tab.

## Design Notes

Queue row content: student `displayName` + target level label via `getChampionsLevelFrenchLabel`, optional `LevelBadge` for current level if useful — keep rows compact like roster list.

Badge styling mirrors Élèves unassigned pattern but uses `bg-promotion-ready text-promotion-ready-foreground` instead of amber.

```tsx
// NavTabs Alertes badge (when pendingPromotionCount > 0)
<span aria-label={`${n} élève${n > 1 ? "s" : ""} prêt${n > 1 ? "s" : ""}`}
  className="ml-2 ... bg-promotion-ready text-promotion-ready-foreground">
  {n}
</span>
```

## Verification

**Commands:**
- `cd champions-app && npm test` -- expected: new queue/count services, alerts page, nav-tabs, and promotion revalidate tests pass.
- `cd champions-app && npm run build` -- expected: production build succeeds.

**Manual checks (if no CLI):**
- Two students with pending promotions: badge shows « 2 »; queue lists both; Valider removes one row and decrements badge.
- Refuse from queue clears row; dossier banner and grid + disappear after refresh.
- Zero pending: empty state, no Alertes badge.

## Spec Change Log

## Suggested Review Order

**Queue data layer**

- Class-wide pending promotion list excludes archived students, sorted by name.
  [`list-pending-promotion-queue.ts:14`](../../champions-app/lib/services/list-pending-promotion-queue.ts#L14)

- Badge count mirrors list filter for active pending promotions only.
  [`count-pending-promotions.ts:6`](../../champions-app/lib/services/count-pending-promotions.ts#L6)

**Alertes UI (D2)**

- Server page loads queue and renders empty state or client list.
  [`page.tsx:8`](../../champions-app/app/(dashboard)/alerts/page.tsx#L8)

- Row tap opens shared PromotionDialog with dossier validate/refuse actions.
  [`alerts-promotion-queue.tsx:23`](../../champions-app/components/promotion/alerts-promotion-queue.tsx#L23)

**Tab badge plumbing**

- Layout fetches pending count in parallel with unassigned count.
  [`layout.tsx:26`](../../champions-app/app/(dashboard)/layout.tsx#L26)

- Alertes tab shows promotion-ready numeric badge with singular/plural aria-label.
  [`nav-tabs.tsx:38`](../../champions-app/components/dashboard/nav-tabs.tsx#L38)

**Cross-surface revalidation**

- Promotion mutations revalidate `/alerts` alongside existing paths.
  [`actions.ts:69`](../../champions-app/app/(dashboard)/students/actions.ts#L69)

**Tests**

- Queue component dialog wiring and pending-state lock.
  [`alerts-promotion-queue.test.tsx:63`](../../champions-app/components/promotion/alerts-promotion-queue.test.tsx#L63)

- Nav badge singular/plural copy and tab isolation.
  [`nav-tabs.test.tsx:125`](../../champions-app/components/dashboard/nav-tabs.test.tsx#L125)