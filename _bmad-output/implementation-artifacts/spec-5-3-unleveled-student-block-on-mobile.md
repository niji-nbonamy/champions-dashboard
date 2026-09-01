---
title: '5-3 Unleveled Student Block on Mobile'
type: 'feature'
created: '2026-09-01'
status: 'done'
review_loop_iteration: 0
baseline_commit: '1eeedbd959cdce6adedc2929ec4cc0825246846e'
story_key: '5-3-unleveled-student-block-on-mobile'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-5-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Story 5.2 excludes unleveled students from the mobile picker via `listLeveledActiveStudents`, so teachers never see why a roster member cannot be captured on phone. FR39 requires visible selection with an explicit block message directing them to assign a level on laptop/tablet (E1 on G1 Élèves tab).

**Approach:** List all active students in the mobile picker; when an unleveled student is selected, render a blocking alert with the exact FR39 microcopy (full `displayName`, trimmed only) instead of the B4 form. Keep completion counts and server save guards scoped to leveled students only.

## Boundaries & Constraints

**Always:**
- Mobile-only surfaces (`<768px`); laptop grid, G1 tabs, and E1 picker unchanged.
- Picker shows **all** active non-archived students via `listActiveStudents`; « saisi », `remainingCount`, and hub completion stay based on **leveled** students only (`listLeveledActiveStudents` + existing entry filter in `mobile/page.tsx` L49–55).
- Unleveled picker rows: neutral stripe (`bg-border`), `RequiredLevelBadge`, link to form route preserved (selection triggers block, not exclusion).
- Block message exact copy: `Niveau requis pour {displayName}. Assignez le niveau depuis un ordinateur.` where `{displayName}` is the stored student name, normalized with trim only (FR39).
- Block UI: `role="alert"`, destructive/warning styling consistent with matrix-missing block (`[studentId]/page.tsx` L104–117 pattern); « Retour à la liste » link only — **no** link to `/students` or level picker.
- Form route resolves student via `getClassStudent(classId, studentId)` (or equivalent active lookup); archived/unknown → `notFound()`. Unleveled → block view, **not** `notFound()`.
- Prev/next on B4 form stays on leveled roster order only (`listLeveledActiveStudents` sort).
- `saveDictationStudentEntry` must reject unleveled student (L377–380) — no `DictationEntry` insert/update.
- Hub G2 unchanged: hide « Saisir » when `totalLeveledCount === 0` (`mobile-dictation-hub.tsx` L47–48).
- `MobileRouteGuard` unchanged — `/students` blocked below 768px.
- French microcopy. No schema changes. No student names in server logs.

**Ask First:**
- Whether to surface unleveled students in picker subtitle (e.g. « 2 sans niveau ») — **default: no**; only per-student block on selection satisfies FR39.

**Never:**
- Mobile level assignment (E1), links to `/students`, or drawer navigation to Élèves.
- Including unleveled students in `remainingCount` or « saisi » logic.
- Client-side authoritative save bypass.
- Changing laptop grid unleveled exclusion (FR9).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Picker mixed roster | 3 leveled, 1 unleveled active | 4 rows; unleveled shows `RequiredLevelBadge`; subtitle « N restants » counts leveled only | N/A |
| Select unleveled | Student `level: null`, valid dictation | Block alert with FR39 message; no numeric fields; no Enregistrer | N/A |
| Direct URL unleveled | `/mobile/{unleveledId}` | Same block view (not 404) | Archived/missing student → `notFound()` |
| Save attempt unleveled | POST via action for unleveled id | No DB write; generic or FR39-aligned error | `InvalidGridSaveError` at L377–380 |
| All unleveled class | Zero leveled, 1+ active unleveled | Hub hides Saisir (existing); picker lists unleveled rows with `RequiredLevelBadge`; subtitle « Aucun élève nivelé pour saisir. » | N/A |
| Leveled student | Normal B4 flow | Unchanged — form renders, save works | N/A |

</frozen-after-approval>

## Code Map

- `champions-app/lib/services/list-active-students.ts` -- **REUSE** L12–29 all active students with `level: string | null`; same `fr` sort as leveled list.
- `champions-app/lib/services/list-leveled-active-students.ts` -- **REUSE** L13–41 completion denominator, prev/next order, save guard roster.
- `champions-app/lib/services/get-class-student.ts` -- **REUSE** L13–35 single-student lookup with `level: null` for form route resolution.
- `champions-app/lib/domain/student-display-name.ts` -- **EXTEND** add `formatUnleveledMobileBlockMessage(displayName)` using `normalizeDisplayName` for FR39 string (full name, no split).
- `champions-app/lib/domain/student-display-name.test.ts` -- **EXTEND** message formatting cases (single name, compound display name).
- `champions-app/components/ui/required-level-badge.tsx` -- **REUSE** L7–16 « niveau requis » badge in picker rows (same as roster-list L110–120).
- `champions-app/app/(dashboard)/dictations/[id]/mobile/page.tsx` -- **MODIFY** L44–46 fetch `listActiveStudents` for display + keep leveled query for `enteredStudentIds`/`remainingCount` (L49–55 pattern).
- `champions-app/components/dictations/mobile-student-picker.tsx` -- **MODIFY** L8–12 type `level: string | null`; L56–61 empty copy when zero **active** students; L72–96 show `RequiredLevelBadge` when `level == null`; neutral stripe for unleveled.
- `champions-app/components/dictations/mobile-student-picker.test.tsx` -- **EXTEND** unleveled row badge, link href, leveled row unchanged.
- `champions-app/app/(dashboard)/dictations/[id]/mobile/[studentId]/page.tsx` -- **MODIFY** L65–74 replace leveled-only lookup with `getClassStudent`; early return block view when `level == null` (mirror L104–117 layout); keep leveled list for `orderedStudentIds` L138.
- `champions-app/app/(dashboard)/dictations/[id]/mobile/[studentId]/page.test.tsx` -- **EXTEND** unleveled → FR39 alert, no form; leveled unchanged.
- `champions-app/app/(dashboard)/dictations/[id]/mobile/page.test.tsx` -- **EXTEND** mixed roster picker props.
- `champions-app/lib/services/dictation-save.ts` -- **READ** L377–380 server guard (optional: dedicated error message — not required if UI blocks all paths).
- `champions-app/components/dashboard/mobile-route-guard.tsx` -- **READ** L11–12 `/students` blocked — verify no regression.
- `champions-app/components/dictations/mobile-dictation-hub.tsx` -- **READ** L47–48 zero-leveled hub gate — unchanged.

## Tasks & Acceptance

**Execution:**
- [x] `champions-app/lib/domain/student-display-name.ts` + test -- `formatUnleveledMobileBlockMessage` -- centralizes exact FR39 copy with full `displayName`.
- [x] `champions-app/app/(dashboard)/dictations/[id]/mobile/page.tsx` + test -- dual-query picker data -- show all active students while preserving leveled completion math.
- [x] `champions-app/components/dictations/mobile-student-picker.tsx` + test -- unleveled row affordances -- visible in list with badge, still navigable to block screen.
- [x] `champions-app/app/(dashboard)/dictations/[id]/mobile/[studentId]/page.tsx` + test -- unleveled block view -- FR39 alert instead of B4 form; leveled path unchanged.

**Acceptance Criteria:**
- Given I select a student without an assigned color level on mobile, when I attempt to enter dictation errors, then entry is blocked with « Niveau requis pour {displayName}. Assignez le niveau depuis un ordinateur. » (FR39).
- Given an unleveled student is blocked on mobile, when any save is attempted, then no DictationEntry is created until a level is assigned on laptop Élèves tab (E1).
- Given I am on mobile below 768px, when I need to assign a level, then there is no navigation path to level assignment — laptop/tablet G1 required.

## Verification

**Commands:**
- `cd champions-app && npm test` -- expected: extended picker, page, student-display-name tests pass; no regressions in 5.2 suite.
- `cd champions-app && npm run build` -- expected: production build succeeds.

**Manual checks (if no CLI):**
- Below 768px with mixed roster: picker shows unleveled student with badge → tap → FR39 block, no fields → back to picker. Leveled student still opens B4 form and saves. No link to Élèves on block screen.

## Spec Change Log

- Review loop 1: Picker subtitle showed « Tous les élèves sont saisis » when `leveledStudentCount === 0`; added `leveledStudentCount` prop and « Aucun élève nivelé pour saisir. » copy.
- Post-delivery (2026-09-01): All student-facing microcopy uses full `displayName` (trim only); removed `getStudentFirstName` project-wide. FR39 block message and this spec updated accordingly.
- Code review (2026-09-01): Added page integration tests (all-unleveled subtitle, leveled-only prev/next), extended FR39 block test assertions, updated I/O matrix and review-order anchors.

## Suggested Review Order

**Unleveled block (FR39)**

- Early return renders exact FR39 alert instead of B4 form.
  [`page.tsx:81`](../../champions-app/app/(dashboard)/dictations/[id]/mobile/[studentId]/page.tsx#L81)

- Centralizes full `displayName` (trim only) into the block message string.
  [`student-display-name.ts:51`](../../champions-app/lib/domain/student-display-name.ts#L51)

**Picker visibility**

- Dual query: all active students displayed, leveled-only completion math.
  [`page.tsx:45`](../../champions-app/app/(dashboard)/dictations/[id]/mobile/page.tsx#L45)

- Unleveled rows show `RequiredLevelBadge` and remain navigable to block screen.
  [`mobile-student-picker.tsx:77`](../../champions-app/components/dictations/mobile-student-picker.tsx#L77)

- Subtitle avoids false « Tous saisis » when zero leveled students exist.
  [`mobile-student-picker.tsx:42`](../../champions-app/components/dictations/mobile-student-picker.tsx#L42)

**Tests**

- Page and picker integration tests for mixed roster and FR39 block.
  [`page.test.tsx:162`](../../champions-app/app/(dashboard)/dictations/[id]/mobile/[studentId]/page.test.tsx#L162)

- Message formatter unit tests lock exact FR39 copy.
  [`student-display-name.test.ts:52`](../../champions-app/lib/domain/student-display-name.test.ts#L52)

### Review Findings

- [x] [Review][Patch] Missing page integration test for all-unleveled roster subtitle [`champions-app/app/(dashboard)/dictations/[id]/mobile/page.test.tsx`]
- [x] [Review][Patch] Missing prev/next integration test for leveled-only `orderedStudentIds` [`champions-app/app/(dashboard)/dictations/[id]/mobile/[studentId]/page.test.tsx`]
- [x] [Review][Patch] Extend unleveled block test: assert « Retour à la liste » and absence of B4 numeric fields [`champions-app/app/(dashboard)/dictations/[id]/mobile/[studentId]/page.test.tsx`]
- [x] [Review][Patch] Update I/O matrix row « All unleveled class » to reflect picker showing active unleveled students with « Aucun élève nivelé pour saisir. » [`spec-5-3-unleveled-student-block-on-mobile.md`]
- [x] [Review][Patch] Fix inaccurate Suggested Review Order line anchors (e.g. `student-display-name.test.ts#L64`, `mobile-student-picker.tsx#L37`) [`spec-5-3-unleveled-student-block-on-mobile.md`]
- [x] [Review][Defer] Unnecessary DB fetches (`listLeveledActiveStudents`, entries, matrix) before unleveled early return [`champions-app/app/(dashboard)/dictations/[id]/mobile/[studentId]/page.tsx:67`] — deferred, pre-existing optimization opportunity
- [x] [Review][Defer] Duplicate non-archived entries for same leveled student can skew `remainingCount` [`champions-app/app/(dashboard)/dictations/[id]/mobile/page.tsx:57`] — deferred, pre-existing from 5.2
- [x] [Review][Defer] Spec 5-2 still documents unleveled picker exclusion — **resolved 2026-09-01** via spec-5-2 post-5.3 reconciliation
- [x] [Review][Defer] Hub vs picker microcopy divergence for zero-leveled state (« Aucun élève nivelé actif. » vs « Aucun élève nivelé pour saisir. ») [`champions-app/components/dictations/mobile-dictation-hub.tsx`] — deferred, hub unchanged in 5-3