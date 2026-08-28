---
title: '3-4 Scoring Engine & Dictation Save'
type: 'feature'
created: '2026-08-28'
status: 'done'
review_loop_iteration: 0
baseline_commit: '203ec1f1a09979a8c6b310d3814a8784b2817594'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
  - '{project-root}/_bmad-output/specs/spec-dashboards-dictees-champions-ce2/scoring-model.md'
  - '{project-root}/_bmad-output/specs/spec-dashboards-dictees-champions-ce2/level-system.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Story 3.3 validates the class grid but **Enregistrer** has no handler — error counts are lost on refresh and teachers must compute global % manually. The product requires server-authoritative scoring, immutable per-row snapshots, and promotion detection on save (FR20–FR21, NFR2–NFR4).

**Approach:** Add `dictation_entries` and `pending_promotions` tables; pure `lib/domain/scoring` and `lib/domain/promotion` modules; transactional `dictation-save` service called via Server Action. Wire `ClassGrid` save with pending/lock UI, `sonner` toasts, and Enter-to-save when focus is outside a cell.

## Boundaries & Constraints

**Always:**
- Auth + class scope unchanged (NFR1). Server re-validates every row with `validateGridRow` + matrix denominators before persist — never trust client-only validation.
- Global % = `(totalWords − min(Σerrors, totalWords)) / totalWords × 100`, clamped [0, 100] via `lib/domain/scoring` only (FR20, NFR3).
- Per entry snapshot: `levelAtSave` (student's current level), `wordDenominator`, `globalPercent`, nine error counts (FR21, AD-5). Denominator from matrix row × level at save via `getWordCountForLevel`.
- One `DictationEntry` per leveled active student on first save; unique `(dictation_id, student_id)`. Re-save of an already-saved dictation is out of scope (story 3.5).
- Promotion detection after save via `lib/domain/promotion`: yellow/green→next at 2 consecutive dictations > 90%; violet→gold at 2 consecutive > 95%; gold never promotes. At most one `PendingPromotion` per student — skip insert if one already exists (FR30).
- All writes in `db.transaction()` (neon-serverless pattern from `assign-student-level.ts`).
- Success toast « Dictée enregistrée. »; failure « Enregistrement impossible. Réessayez. » with grid data retained (UX-DR23/24).
- During save: Enregistrer shows spinner (« Enregistrement… »), cells locked (`readOnly` / `disabled`). French microcopy; no student names in server logs (NFR10).
- After schema change: remind teacher to run `npm run db:push` from `champions-app/`.

**Ask First:**
- Dictation already has entries (partial save / race): default reject with generic error — do not upsert in 3.4.

**Never:**
- Edit/reopen past dictation (3.5), inline ⬆️/**+** UI (3.6), dossier/alertes surfaces (Epic 4).
- Client-authoritative scoring or promotion outcomes.
- Per-category percentages anywhere.
- Delete dictation or purge entries.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Happy save | All rows valid, first save | N entries inserted, snapshots + global % correct, promotion records created when eligible | Success toast |
| Invalid row server-side | Tampered counts exceeding total | No DB writes | Generic failure toast; grid retained |
| Already saved | Entries exist for dictation | No overwrite | Generic failure toast |
| Zero students | Empty roster | No save attempted (no Enregistrer) | N/A |
| First dictation ever | Student has 1 entry after save | No pending promotion (needs 2 consecutive) | N/A |
| Two consecutive > 90% | Yellow student, last 2 global % > 90 | `PendingPromotion` target green | N/A |
| Existing pending | Student already has pending | No duplicate pending row | N/A |
| Gold student | Level gold, high scores | No pending promotion | N/A |
| DB failure mid-tx | Transaction error | Full rollback | Failure toast; grid retained |
| Enter save | Focus on grid container, all valid | Triggers same save path | N/A |

</frozen-after-approval>

## Code Map

- `champions-app/lib/db/schema.ts` -- **MODIFY** add `dictationEntries` (FK dictation+student, snapshot cols, `errors_c`…`errors_s`, unique index) and `pendingPromotions` (FK student, `targetLevel`, unique student). [`schema.ts:85`](../../champions-app/lib/db/schema.ts#L85)
- `champions-app/lib/domain/scoring.ts` -- **CREATE** `calculateGlobalPercent(totalWords, sumErrors)` pure, clamped.
- `champions-app/lib/domain/scoring.test.ts` -- **CREATE** formula edge cases (0 errors, overflow clamp, zero denominator guard).
- `champions-app/lib/domain/promotion.ts` -- **CREATE** `getPromotionThreshold`, `evaluatePendingPromotion(level, recentPercents[])`, `getNextLevel`.
- `champions-app/lib/domain/promotion.test.ts` -- **CREATE** consecutive rules, gold no-op, threshold boundaries (90/95).
- `champions-app/lib/domain/grid-validation.ts` -- **REUSE** `validateGridRow`, `sumCategoryErrors`. [`grid-validation.ts:29`](../../champions-app/lib/domain/grid-validation.ts#L29)
- `champions-app/lib/domain/word-count-matrix.ts` -- **REUSE** `getWordCountForLevel`, `buildWordTotalsByStudentId`. [`word-count-matrix.ts:58`](../../champions-app/lib/domain/word-count-matrix.ts#L58)
- `champions-app/lib/domain/error-categories.ts` -- **REUSE** letters → DB column mapping. [`error-categories.ts:20`](../../champions-app/lib/domain/error-categories.ts#L20)
- `champions-app/lib/services/dictation-save.ts` -- **CREATE** orchestration: auth scope, re-validate, score, tx insert entries + pending promotions; typed errors.
- `champions-app/lib/services/dictation-save.test.ts` -- **CREATE** unit tests with mocked DB or pure orchestration helpers.
- `champions-app/lib/services/reset-class-year.ts` -- **MODIFY** delete `dictation_entries` + `pending_promotions` in tx. [`reset-class-year.ts:35`](../../champions-app/lib/services/reset-class-year.ts#L35)
- `champions-app/app/(dashboard)/dictations/actions.ts` -- **MODIFY** add `saveDictationAction(dictationId, counts)`; pattern from `createDictationAction`. [`actions.ts:25`](../../champions-app/app/(dashboard)/dictations/actions.ts#L25)
- `champions-app/components/grid/class-grid.tsx` -- **MODIFY** props `dictationId`; wire Enregistrer + `useTransition`; lock cells; Enter-to-save on container keydown; call action. [`class-grid.tsx:272`](../../champions-app/components/grid/class-grid.tsx#L272)
- `champions-app/components/grid/class-grid.test.tsx` -- **MODIFY** save pending state, lock, toast trigger mocks.
- `champions-app/components/grid/grid-cell.tsx` -- **MODIFY** `disabled` prop when saving. [`grid-cell.tsx:130`](../../champions-app/components/grid/grid-cell.tsx#L130)
- `champions-app/app/(dashboard)/dictations/[id]/page.tsx` -- **MODIFY** pass `dictationId`; remove placeholder text L78-80. [`page.tsx:78`](../../champions-app/app/(dashboard)/dictations/[id]/page.tsx#L78)
- `champions-app/app/(dashboard)/dictations/[id]/page.test.tsx` -- **MODIFY** `dictationId` prop assertion.
- `champions-app/app/layout.tsx` -- **MODIFY** add `<Toaster />` from sonner.
- `champions-app/package.json` -- **MODIFY** add `sonner` dependency.

## Tasks & Acceptance

**Execution:**
- [x] `champions-app/lib/db/schema.ts` -- Tables + relations + unique indexes -- persistence layer for FR20/FR21.
- [x] `champions-app/lib/domain/scoring.ts` + test -- Pure global % formula -- NFR3/NFR4 source of truth.
- [x] `champions-app/lib/domain/promotion.ts` + test -- Consecutive-dictation detection -- level-system rules.
- [x] `champions-app/lib/services/dictation-save.ts` + test -- Transactional save orchestration -- NFR2 server authority.
- [x] `champions-app/lib/services/reset-class-year.ts` -- Cascade deletes for new tables -- year-reset extension point.
- [x] `champions-app/app/(dashboard)/dictations/actions.ts` -- `saveDictationAction` -- Server Action entry point.
- [x] `champions-app/package.json` + `app/layout.tsx` -- sonner + Toaster -- UX-DR23/24 toasts.
- [x] `champions-app/components/grid/class-grid.tsx` + `grid-cell.tsx` + tests -- Save wiring, lock, Enter -- capture UX.
- [x] `champions-app/app/(dashboard)/dictations/[id]/page.tsx` + test -- Pass dictationId, remove placeholder -- page integration.

**Acceptance Criteria:**
- Given all grid rows pass validation, when I click Enregistrer, then one DictationEntry per leveled student is persisted with nine category error counts and correct snapshots (FR20, FR21).
- Given saved entries, when global % is computed, then the formula uses `lib/domain/scoring` and results are clamped [0, 100] (FR20, NFR3).
- Given a student achieves consecutive qualifying dictations, when save completes, then a PendingPromotion is created if none exists (level-system.md).
- Given save succeeds or fails, when the operation completes, then the appropriate French toast displays and grid data is retained on failure (UX-DR24).
- Given save is in progress, when I interact with the grid, then Enregistrer shows a spinner and cells are locked (UX-DR23).

## Spec Change Log

## Design Notes

`ClassGrid` keeps `GridCounts` shape from 3.3 — serialize as-is to the Server Action. Server reloads students + matrix row to recompute denominators; never accepts client word totals. Promotion module receives ordered `globalPercent[]` (most recent first, including the just-saved entry) plus `levelAtSave` — keeps DB query in service, pure evaluation in domain.

`saveDictationAction` returns `{ error: string | null }`; client calls `toast.success` / `toast.error` on result. Use `useTransition` for `isPending` (not `useActionState` — payload is structured data, not FormData).

## Verification

**Commands:**
- `cd champions-app && npm test` -- expected: all tests pass including scoring, promotion, dictation-save, grid save UI.
- `cd champions-app && npm run build` -- expected: production build succeeds.

**Manual checks (if no CLI):**
- Fill valid grid → Enregistrer → success toast; refresh → entries exist in DB (via Neon console). Tamper invalid totals in devtools → server rejects.

## Suggested Review Order

**Save orchestration**

- Transactional insert of entries plus promotion detection after re-validation
  [`dictation-save.ts:140`](../../champions-app/lib/services/dictation-save.ts#L140)

**Domain scoring & promotion**

- Pure global % formula with clamping
  [`scoring.ts:4`](../../champions-app/lib/domain/scoring.ts#L4)

- Consecutive-dictation promotion thresholds
  [`promotion.ts:33`](../../champions-app/lib/domain/promotion.ts#L33)

**Schema**

- Dictation entry snapshots and pending promotion uniqueness
  [`schema.ts:98`](../../champions-app/lib/db/schema.ts#L98)

**UI save flow**

- Enregistrer handler, pending lock, Enter-to-save, sonner toasts
  [`class-grid.tsx:182`](../../champions-app/components/grid/class-grid.tsx#L182)

**Server Action**

- Auth-scoped save entry point and path revalidation
  [`actions.ts:85`](../../champions-app/app/(dashboard)/dictations/actions.ts#L85)

**Tests**

- Grid save UI and prepareDictationEntries unit coverage
  [`class-grid.test.tsx:618`](../../champions-app/components/grid/class-grid.test.tsx#L618)

### Review Findings

- [x] [Review][Patch] Client `ClassGrid` imported toast constant from server `dictation-save.ts` — moved to `dictation-save-messages.ts`.

- [x] [Review][Patch] Reject save when server roster student missing from client counts payload — `assertCountsMatchRoster` added [`dictation-save.ts:99`]

- [x] [Review][Patch] Move already-saved guard inside transaction to close concurrent first-save race [`dictation-save.ts:254`]

- [x] [Review][Patch] Guard concurrent `pending_promotions` insert — `onConflictDoNothing` on `student_id` [`dictation-save.ts:278`]

- [x] [Review][Patch] Wrap `saveDictationAction` call in try/catch for unexpected throws [`class-grid.tsx:188`]

- [x] [Review][Defer] No integration test for full `saveDictation` DB transaction (mocked service layer only) — includes rollback, already-saved guard, and promotion inserts [`dictation-save.test.ts`]

- [x] [Review][Defer] `saveDictationAction` lacks tests in `actions.test.ts` — auth, revalidatePath, and error mapping untested [`actions.ts:86`]

- [x] [Review][Defer] Promotion insert path untested in `dictation-save` — only `evaluatePendingPromotion` unit tests cover thresholds [`dictation-save.ts:247`]

- [x] [Review][Defer] Enter-to-save guards untested — no test for Enter in cell input or Enter on container when grid invalid [`class-grid.test.tsx:680`]

- [x] [Review][Defer] Grid data retention on failure untested — error toast asserted but counts unchanged not verified [`class-grid.test.tsx:633`]
