---
title: '4-5 Promotion Detection Rules'
type: 'feature'
created: '2026-08-31'
status: 'done'
baseline_commit: '83f5e7565abf56c1f58eaae18147f24bc0f56fa0'
review_loop_iteration: 1
context:
  - '{project-root}/_bmad-output/specs/spec-dashboards-dictees-champions-ce2/level-system.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Epic 3 introduced basic promotion detection (`lib/domain/promotion.ts`, `reevaluate-pending-promotion.ts`, inline logic in `dictation-save` first-save path), but story 4-5 ACs are not fully met: FR31 streak reset after refuse is not enforced (refused students can re-alert on the next save using the same qualifying dictations), first-save and edit-save use divergent promotion paths, and green→violet coverage is thin in integration tests.

**Approach:** Harden the detection pipeline — add refuse-aware streak cutoff in the reevaluation service (using existing `level_history_entries` `refused` timestamps, no schema change), unify all post-save detection through `reevaluatePendingPromotionFromDictationHistory`, keep pure threshold rules in `lib/domain/promotion`, and expand unit/integration tests for every level transition and FR31.

## Boundaries & Constraints

**Always:**
- Pure detection rules stay in `lib/domain/promotion` only: thresholds (90/95), consecutive pair evaluation, `getNextLevel`, gold no-op (FR28, NFR3).
- After each dictation save (first or edit), detection runs server-side and may create/update/clear a `pending_promotions` row — never auto-update `students.level` (FR29).
- Yellow→green and green→violet: 2 consecutive dictations with global % **>** 90. Violet→gold: 2 consecutive **>** 95. Gold: never eligible.
- Evaluation level = `levelAtSave` on the most recent dictation entry (not live `students.level` when they differ).
- FR31 streak reset: after a `refused` history entry, only dictations saved **after** that `occurredAt` count toward the next consecutive pair; pre-refuse dictations are ignored even if scores qualify.
- Unify `dictation-save` first-save path: after inserting entries, call `cascadePromotionReevaluation` (same as edit path) — remove inline `evaluatePendingPromotion` + `studentsWithPendingPromotion` skip logic.
- Reevaluation pattern: delete existing pending → evaluate → insert only if eligible (already in `reevaluate-pending-promotion.ts`).
- No schema changes. No student names in server logs (NFR10).

**Ask First:**
- Streak cutoff timestamp: use `level_history_entries.occurredAt` on the most recent `refused` action (default). If multiple refuses exist, use the latest.

**Never:**
- Alertes D2 queue UI (story 4-6), presentation mode (4-7), validate/refuse mutation changes (already in Epic 3/4).
- Client-side promotion outcomes or duplicated threshold math outside `lib/domain/promotion`.
- Automatic level change without teacher Valider.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Yellow→green qualifies | 2 most recent dictations at yellow, 91% and 92% | `pending_promotions` row with `targetLevel: green` | N/A |
| Green→violet qualifies | 2 most recent at green, both > 90% | Pending with `targetLevel: violet` | N/A |
| Violet→gold qualifies | 2 most recent at violet, both > 95% | Pending with `targetLevel: gold` | N/A |
| Gold student | Any scores | No pending row created/kept | N/A |
| Boundary 90% | Most recent 90%, previous 91% | Not eligible (strict `>`) | N/A |
| Single dictation | Only 1 saved entry | Pending cleared / not created | N/A |
| After refuse (FR31) | Refused yellow→green; 2 pre-refuse qualifying dictations; no new saves | No pending on reevaluation | N/A |
| After refuse + 1 new save | 1 post-refuse dictation > 90% | Not eligible (need 2 consecutive post-refuse) | N/A |
| After refuse + 2 new saves | 2 post-refuse consecutive > 90% | Pending recreated | N/A |
| Edit breaks eligibility | Edit lowers recent % below threshold | Pending deleted, not re-inserted | N/A |
| First save path | New dictation, 2nd consecutive qualifying save | Pending via unified cascade (not inline logic) | N/A |

</frozen-after-approval>

## Code Map

- `champions-app/lib/domain/promotion.ts` -- **MODIFY** optional pure helper `selectConsecutivePercents(recentPercents, minCount)` if it clarifies domain boundary; keep `evaluatePendingPromotion`, `getPromotionThreshold`, `getNextLevel`. [`promotion.ts:33`](../../champions-app/lib/domain/promotion.ts#L33)
- `champions-app/lib/domain/promotion.test.ts` -- **MODIFY** add green→violet explicit case; boundary tests for all transitions.
- `champions-app/lib/services/reevaluate-pending-promotion.ts` -- **MODIFY** fetch latest `refused` `occurredAt` per student; filter dictation entries to post-refuse window before taking top 2; apply to both `reevaluatePendingPromotionFromDictationHistory` and `reevaluatePendingPromotionForCurrentLevel`. [`reevaluate-pending-promotion.ts:17`](../../champions-app/lib/services/reevaluate-pending-promotion.ts#L17)
- `champions-app/lib/services/reevaluate-pending-promotion.test.ts` -- **MODIFY** FR31 refuse-cutoff cases; green→violet; post-refuse re-qualify after 2 new dictations.
- `champions-app/lib/services/dictation-save.ts` -- **MODIFY** remove inline promotion block (lines ~335–426: `studentsWithPendingPromotion`, `recentPercentsByStudentId`, per-entry `evaluatePendingPromotion`); after first-save inserts, call `cascadePromotionReevaluation`. [`dictation-save.ts:211`](../../champions-app/lib/services/dictation-save.ts#L211)
- `champions-app/lib/services/dictation-save.test.ts` -- **MODIFY** add first-save promotion integration tests (qualifying 2nd dictation, no pending on 1st, unified cascade).
- `champions-app/lib/db/schema.ts` -- **READ** `levelHistoryEntries`, `pendingPromotions`, `dictationEntries` — no migration. [`schema.ts:52`](../../champions-app/lib/db/schema.ts#L52)
- `champions-app/lib/services/refuse-student-promotion.ts` -- **READ ONLY** inserts `refused` history used as streak cutoff anchor. [`refuse-student-promotion.ts:79`](../../champions-app/lib/services/refuse-student-promotion.ts#L79)
- `champions-app/lib/services/override-student-level.ts` -- **READ** calls `reevaluatePendingPromotionForCurrentLevel` — must inherit refuse cutoff after changes. [`override-student-level.ts:107`](../../champions-app/lib/services/override-student-level.ts#L107)

## Tasks & Acceptance

**Execution:**
- [x] `champions-app/lib/domain/promotion.test.ts` -- cover green→violet and all threshold boundaries -- FR28 rule completeness.
- [x] `champions-app/lib/services/reevaluate-pending-promotion.ts` + test -- refuse-aware streak cutoff (FR31) -- core gap vs level-system.md.
- [x] `champions-app/lib/services/dictation-save.ts` + test -- unify first-save detection via `cascadePromotionReevaluation` -- remove divergent inline path.
- [x] `champions-app/lib/services/dictation-save.test.ts` -- first-save promotion integration cases -- parity with edit-path coverage.

**Acceptance Criteria:**
- Given a student has saved dictations, when promotion detection runs after a dictation save, then yellow→green and green→violet require 2 consecutive dictations with global % > 90%, and violet→gold requires 2 consecutive > 95% (FR28).
- Given a gold-level student, when detection runs, then no pending promotion is surfaced.
- Given detection finds qualifying consecutive scores, when evaluation completes, then only a `PendingPromotion` record is created — `students.level` is unchanged (FR29).
- Given a teacher refused a pending promotion, when detection runs before any new dictations are saved, then no pending promotion is recreated from pre-refuse dictations (FR31).
- Given detection logic is inspected, then threshold and consecutive-pair rules live exclusively in `lib/domain/promotion` with services orchestrating I/O only (NFR3).

## Design Notes

Refuse cutoff: query `level_history_entries` for `studentId` + `action = 'refused'` ordered by `occurredAt DESC LIMIT 1`. When loading recent dictation entries, filter with `gt(dictationEntries.createdAt, refusalCutoff)` — only entry `createdAt` is used (not `dictations.createdAt`). Then take the 2 most recent from the filtered set.

Unifying first-save removes the FR30 "skip if pending exists" pre-check — the reevaluate path already delete-then-evaluate, which is the correct semantics when scores change.

## Verification

**Commands:**
- `cd champions-app && npm test` -- expected: promotion, reevaluate, and dictation-save tests pass including new FR31 and first-save cases.
- `cd champions-app && npm run build` -- expected: production build succeeds.

**Manual checks (if no CLI):**
- Save 2 qualifying dictations for a yellow student → pending appears. Refuse → pending clears. Save 1 more qualifying dictation → no pending. Save 2nd post-refuse qualifying → pending reappears.

## Spec Change Log

### Review Findings

- [x] [Review][Patch] Assert `gt(dictationEntries.createdAt, refusalCutoff)` in FR31 tests [`reevaluate-pending-promotion.test.ts:127`]
- [x] [Review][Patch] Add violet→gold and gold no-op service tests [`reevaluate-pending-promotion.test.ts:276`]
- [x] [Review][Patch] Document `dictationEntries.createdAt` as FR31 cutoff field [`reevaluate-pending-promotion.ts:54`]
- [x] [Review][Patch] Strengthen FR31 tests to assert pre-refuse qualifying dictations are excluded (not just `mockGt` + empty mock) [`reevaluate-pending-promotion.test.ts:127`]
- [x] [Review][Patch] Add dictation-save integration test for FR31 refuse streak reset [`dictation-save.test.ts`]
- [x] [Review][Patch] Add test for multiple `refused` history entries using latest cutoff [`reevaluate-pending-promotion.test.ts`]
- [x] [Review][Patch] Resolve design-notes ambiguity: document `dictationEntries.createdAt` as sole FR31 cutoff field [`spec-4-5-promotion-detection-rules.md:87`]

## Suggested Review Order

**FR31 streak reset after refuse**

- Loads latest `refused` history entry as streak cutoff anchor
  [`reevaluate-pending-promotion.ts:23`](../../champions-app/lib/services/reevaluate-pending-promotion.ts#L23)

- Filters dictation entries strictly after refusal before evaluating consecutive pair
  [`reevaluate-pending-promotion.ts:42`](../../champions-app/lib/services/reevaluate-pending-promotion.ts#L42)

**Unified post-save detection**

- First-save path now delegates promotion to the same cascade as edits
  [`dictation-save.ts:352`](../../champions-app/lib/services/dictation-save.ts#L352)

- Shared cascade invokes history-based reevaluation per affected student
  [`dictation-save.ts:206`](../../champions-app/lib/services/dictation-save.ts#L206)

**Tests**

- FR31 cutoff assertion plus violet→gold and gold no-op service coverage
  [`reevaluate-pending-promotion.test.ts:127`](../../champions-app/lib/services/reevaluate-pending-promotion.test.ts#L127)

- First-save cascade integration and green→violet domain boundaries
  [`dictation-save.test.ts:537`](../../champions-app/lib/services/dictation-save.test.ts#L537)
