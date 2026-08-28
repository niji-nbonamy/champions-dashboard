---
title: '3-5 Edit Past Dictation'
type: 'feature'
created: '2026-08-28'
status: 'done'
review_loop_iteration: 0
baseline_commit: '249fcff6451c2cc51841a59275b58a8cd02c6ec1'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
  - '{project-root}/_bmad-output/specs/spec-dashboards-dictees-champions-ce2/dictation-lifecycle.md'
  - '{project-root}/_bmad-output/specs/spec-dashboards-dictees-champions-ce2/scoring-model.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Story 3.4 persists dictation entries but rejects any re-save (`DictationAlreadySavedError`). Reopening a saved dictation from Historique shows an empty grid; teachers cannot fix data-entry mistakes without losing snapshot integrity (FR22).

**Approach:** Load existing `dictation_entries` into `ClassGrid`, validate and score edits using immutable `levelAtSave`/`wordDenominator` snapshots, UPDATE entries in a transaction, then cascade promotion re-evaluation forward and refresh `pending_promotions` for affected students.

## Boundaries & Constraints

**Always:**
- Auth + class scope unchanged (NFR1). Server re-validates every editable row before persist.
- Edit path triggers only when entries already exist for `dictationId`; first-save path (3.4 insert-only) unchanged.
- On edit: `levelAtSave` and `wordDenominator` are **never** overwritten — only nine error counts and `globalPercent` update (FR22, AD-5).
- Global % recalculated via `calculateGlobalPercent(snapshot.wordDenominator, Σerrors)` from `lib/domain/scoring` (NFR3).
- Client validation uses per-row snapshot `wordDenominator`, not current student level × matrix.
- Grid pre-fills saved error counts on reopen; archived students with entries render read-only rows (counts visible, cells disabled, excluded from save payload) per `dictation-lifecycle.md`.
- Promotion cascade after edit: for each student with an entry on the edited dictation, delete their `pending_promotions` row, reload two most recent dictation entries (by `dictationDate DESC, createdAt DESC`), call `evaluatePendingPromotion(mostRecent.levelAtSave, [recent%, prior%])`, insert pending if eligible. Students with fewer than two entries → no pending.
- All writes in `db.transaction()`. Success toast « Dictée enregistrée. »; failure « Enregistrement impossible. Réessayez. » with grid retained (UX-DR24).
- During save: spinner + cell lock (UX-DR23). No student names in server logs (NFR10).
- No dictation delete/purge (FR42).

**Ask First:**
- Student added to roster after first save but with no entry on this dictation: default exclude from edit grid (historical roster frozen at first save).

**Never:**
- Inline ⬆️/**+** promotion UI (3.6), dossier/alertes surfaces (Epic 4), delete dictation.
- Recompute snapshots from current student level or current matrix row.
- Client-authoritative scoring or promotion outcomes.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Reopen saved | Entries exist | Grid pre-filled with saved counts; validation uses snapshot denominators | N/A |
| Edit save | Valid counts, entries exist | Entries UPDATEd; snapshots preserved; promotion cascade runs | Success toast |
| First save unchanged | No entries exist | Insert path from 3.4 | Unchanged |
| Invalid row server-side | Σ errors > snapshot denominator | No DB writes | Generic failure toast |
| Archived student row | Entry exists, student archived | Read-only row shown; excluded from save | N/A |
| Edit breaks promotion | Was eligible, edit lowers % | Pending promotion removed after cascade | N/A |
| Edit creates promotion | Two recent dictations now > threshold | Pending promotion inserted | N/A |
| No prior dictation | Student has only this entry | No pending after edit | N/A |
| DB failure mid-tx | Transaction error | Full rollback | Failure toast |

</frozen-after-approval>

## Code Map

- `champions-app/lib/services/dictation-save.ts` -- **MODIFY** branch edit vs first-save; `prepareDictationEntryUpdates` using snapshots; remove throw at L254–256 on edit path; promotion cascade helper. [`dictation-save.ts:247`](../../champions-app/lib/services/dictation-save.ts#L247)
- `champions-app/lib/services/dictation-save.test.ts` -- **MODIFY** edit path, snapshot preservation, cascade promotion add/remove.
- `champions-app/lib/services/get-dictation-entries.ts` -- **CREATE** `getDictationEntriesByDictationId(classId, dictationId)` scoped query with student join for archived flag.
- `champions-app/lib/domain/error-categories.ts` -- **MODIFY** add `dbColumnsToCategoryErrors` inverse of `categoryErrorsToDbColumns`. [`error-categories.ts:141`](../../champions-app/lib/domain/error-categories.ts#L141)
- `champions-app/lib/domain/scoring.ts` -- **REUSE** `calculateGlobalPercent`.
- `champions-app/lib/domain/promotion.ts` -- **REUSE** `evaluatePendingPromotion`.
- `champions-app/lib/domain/grid-validation.ts` -- **REUSE** `validateGridRow`, `sumCategoryErrors`.
- `champions-app/app/(dashboard)/dictations/[id]/page.tsx` -- **MODIFY** load entries; build `initialCounts` + snapshot `wordTotalsByStudentId`; pass `readOnlyStudentIds`. [`page.tsx:50`](../../champions-app/app/(dashboard)/dictations/[id]/page.tsx#L50)
- `champions-app/components/grid/class-grid.tsx` -- **MODIFY** props `initialCounts?`, `readOnlyStudentIds?`; init state from entries; disable cells for read-only rows. [`class-grid.tsx:43`](../../champions-app/components/grid/class-grid.tsx#L43)
- `champions-app/components/grid/class-grid.test.tsx` -- **MODIFY** pre-fill, read-only archived row, edit save.
- `champions-app/components/grid/grid-cell.tsx` -- **REUSE** existing `disabled` prop for read-only + save lock.
- `champions-app/app/(dashboard)/dictations/actions.ts` -- **REUSE** `saveDictationAction` (auto-detect edit inside service).
- `champions-app/app/(dashboard)/dictations/page.tsx` -- **REUSE** Historique links already route to `[id]`.
- `champions-app/lib/db/schema.ts` -- **REUSE** no schema change expected.

## Tasks & Acceptance

**Execution:**
- [x] `champions-app/lib/domain/error-categories.ts` -- `dbColumnsToCategoryErrors` -- map DB rows back to grid counts.
- [x] `champions-app/lib/services/get-dictation-entries.ts` -- scoped entry loader -- page + save edit path.
- [x] `champions-app/lib/services/dictation-save.ts` + test -- edit branch, snapshot updates, promotion cascade -- FR22 core.
- [x] `champions-app/app/(dashboard)/dictations/[id]/page.tsx` -- load entries, snapshot totals, read-only ids -- reopen UX.
- [x] `champions-app/components/grid/class-grid.tsx` + test -- `initialCounts`, read-only rows, edit save wiring -- grid pre-fill.

**Acceptance Criteria:**
- Given a dictation has been previously saved, when I reopen it from Dictées and modify error counts, then entries update using original `levelAtSave` and `wordDenominator` snapshots (FR22).
- Given I reopen a saved dictation, when the grid loads, then saved error counts are pre-filled and validation uses snapshot denominators.
- Given an edit changes promotion eligibility, when save completes, then `pending_promotions` reflects the recalculated state (added or removed).
- Given save succeeds or fails, when the operation completes, then the appropriate French toast displays and grid data is retained on failure (UX-DR24).
- Given a student was archived after participating, when I reopen that dictation, then their row is visible read-only with saved counts.

## Spec Change Log

### Review Findings

- [x] [Review][Patch] Disable Enregistrer when all grid rows are read-only — `editableStudents.length > 0` guard [`class-grid.tsx:122`](../../champions-app/components/grid/class-grid.tsx#L122)

- [x] [Review][Patch] Use `levelAtSave` for badge on reopen, not current roster level — FR22 display consistency [`page.tsx:62`](../../champions-app/app/(dashboard)/dictations/[id]/page.tsx#L62)

- [x] [Review][Patch] Skip validation alerts on read-only archived rows [`class-grid.tsx:309`](../../champions-app/components/grid/class-grid.tsx#L309)

- [x] [Review][Patch] Keyboard navigation skips read-only rows (arrows + Tab wrap) [`class-grid.tsx:167`](../../champions-app/components/grid/class-grid.tsx#L167)

- [x] [Review][Patch] Reject edit UPDATE when zero rows matched — `.returning()` guard [`dictation-save.ts:320`](../../champions-app/lib/services/dictation-save.ts#L320)

- [x] [Review][Patch] Clamp negative DB error columns in `dbColumnsToCategoryErrors` [`error-categories.ts:159`](../../champions-app/lib/domain/error-categories.ts#L159)

- [x] [Review][Patch] Assert `students` prop includes archived row on reopen [`page.test.tsx:325`](../../champions-app/app/(dashboard)/dictations/[id]/page.test.tsx#L325)

- [x] [Review][Defer] No dedicated test file for `get-dictation-entries.ts` DB query — service mocked in page/save tests [`get-dictation-entries.ts`](../../champions-app/lib/services/get-dictation-entries.ts)

- [x] [Review][Defer] No integration test for edit-path transaction rollback on DB failure [`dictation-save.ts:318`](../../champions-app/lib/services/dictation-save.ts#L318)

- [x] [Review][Defer] No ARIA/visual indicator beyond disabled cells for read-only archived rows [`class-grid.tsx:334`](../../champions-app/components/grid/class-grid.tsx#L334)

## Design Notes

`saveDictation` detects edit when any entry exists for `dictationId`. Edit flow loads existing snapshots keyed by `studentId`, validates counts against `wordDenominator` from snapshot (not matrix), updates `errors_*` + `globalPercent` only.

Promotion cascade (per affected student): `DELETE FROM pending_promotions WHERE student_id = ?` then evaluate the two most recent entries class-wide for that student. Reuse `evaluatePendingPromotion` — do not duplicate threshold logic.

`wordTotalsByStudentId` on edit page: `{ [studentId]: entry.wordDenominator }` for students with entries; active students without entry on this dictation are omitted from grid.

## Verification

**Commands:**
- `cd champions-app && npm test` -- expected: all tests pass including dictation-save edit/cascade and grid pre-fill.
- `cd champions-app && npm run build` -- expected: production build succeeds.

**Manual checks (if no CLI):**
- Save dictation → reopen from Historique → counts pre-filled → edit → save → refresh → updated counts persist; Neon shows unchanged `level_at_save`/`word_denominator`.

## Suggested Review Order

**Edit save orchestration**

- Branch detection, snapshot-preserving UPDATE, promotion cascade
  [`dictation-save.ts:247`](../../champions-app/lib/services/dictation-save.ts#L247)

**Entry loader**

- Class-scoped query with archived student metadata
  [`get-dictation-entries.ts`](../../champions-app/lib/services/get-dictation-entries.ts)

**Page + grid pre-fill**

- Snapshot denominators and read-only archived rows
  [`page.tsx:50`](../../champions-app/app/(dashboard)/dictations/[id]/page.tsx#L50)

**Tests**

- Edit path unit coverage and grid pre-fill assertions
  [`dictation-save.test.ts`](../../champions-app/lib/services/dictation-save.test.ts)
