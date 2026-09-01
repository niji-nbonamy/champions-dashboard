---
title: '6-4 Edit Dictation Label and Date'
type: 'feature'
created: '09-01-2026'
status: 'done'
baseline_commit: '576c052935fa94472e12c4c150f023e075684bb8'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-6-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** After a dictation is saved, its label and date are frozen on the detail page header and in history/dossier lists. Teachers cannot fix typos or wrong session dates without altering scored data (FR49).

**Approach:** Add a metadata-only `updateDictation` service and server action that reuses create-time label/date validation (matrix row match, trimmed label, valid calendar date). Expose an « Modifier » dialog on the dictation detail page mirroring the create-dictation picker. Revalidate Dictées history, detail header, mobile surfaces, and student dossiers — without touching `dictation_entries` or promotion logic.

## Boundaries & Constraints

**Always:**
- Auth + class scope unchanged (NFR1). Server re-validates label and date on every update.
- Update mutates only `dictations.label`, `dictations.dictationLabelKey`, and `dictations.dictationDate` — no `dictation_entries` writes (FR49, NFR4).
- Label required (non-empty trimmed), max 80 chars; must match a **complete** word-count matrix row via `findMatchingMatrixRow` (FR10, FR13).
- Date must parse via `parseDictationDate`; unchanged date allowed when field omitted or same value.
- Matrix-missing label → blocked save with existing French `DICTATION_MATRIX_ROW_MISSING_ERROR` (or equivalent centralized constant).
- Success: French confirmation (toast or inline success message consistent with create flow); failure retains form values with field-level or banner error.
- After success: revalidate `/dictations`, `/dictations/{id}`, mobile paths (`/mobile`, `/mobile/summary`), and `/students/{id}` + `/students/{id}/present` for every student with an entry on this dictation.
- Story 3.5 error-count edit path (`saveDictation`, `ClassGrid`) remains available on the same page — metadata edit must not lock or reset the grid.
- Label change on unsaved dictation (no entries yet) updates first-save matrix matching on `[id]/page.tsx` — snapshots unaffected when entries exist.

**Ask First:**
- Editing metadata from Historique list inline (without opening detail) — current AC scopes edit to opened dictation detail.

**Never:**
- Modify `dictation-save.ts`, `cascadePromotionReevaluation`, or `pending_promotions`.
- Recompute `globalPercent`, `levelAtSave`, `wordDenominator`, or trigger promotion re-detection.
- Delete dictation (FR42).
- Allow free-text labels outside the matrix picker.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Edit saved dictation | Entries exist; valid label + date | Metadata UPDATE; header refreshes; grid pre-fill unchanged | N/A |
| Label only | Valid matrix label, date unchanged | Label + dictationLabelKey updated; date unchanged | N/A |
| Date only | Label unchanged, valid new date | Date updated; chronological sort shifts in history/dossier/curve | N/A |
| Invalid label | Empty or unknown matrix label | No DB write | French required/matrix error |
| Invalid date | Bad `YYYY-MM-DD` | No DB write | `DICTATION_DATE_INVALID_ERROR` |
| No entries yet | First-save dictation, no entries | Metadata update succeeds; grid still uses new label for matrix row lookup | N/A |
| Concurrent grid edit | Teacher edits counts after metadata save | `saveDictation` edit path still works independently | N/A |
| Wrong class scope | DictationId not in teacher's class | No update | Generic failure / not found |
| Mobile surfaces | Metadata changed | Hub last-dictation label/date refresh after revalidation | N/A |

</frozen-after-approval>

## Code Map

- `champions-app/lib/db/schema.ts` — **read-only** L85–96: `dictations` columns `label`, `dictationLabelKey`, `dictationDate`; no migration.
- `champions-app/lib/domain/dictation.ts` — **reuse** L60–119: `validateDictationLabel`, `parseDictationDate`, `findMatchingMatrixRow`, error constants.
- `champions-app/lib/services/create-dictation.ts` — **model** L35–66: validation + matrix match pattern to mirror in update service.
- `champions-app/lib/services/update-dictation.ts` — **create**: `updateDictation(classId, dictationId, input)` → scoped UPDATE; throw `UpdateDictationError` with domain messages.
- `champions-app/lib/services/update-dictation.test.ts` — **create**: happy path, matrix missing, invalid date, class scope, no entry mutation (mock DB).
- `champions-app/lib/services/get-dictation-entries.ts` — **reuse** L24+: load `studentId` list for dossier revalidation.
- `champions-app/lib/revalidation/dictation-metadata-paths.ts` — **create**: `revalidateDictationMetadataPaths(dictationId, studentIds)` — distinct from promotion helper.
- `champions-app/app/(dashboard)/dictations/actions.ts` — **extend** after L100: `updateDictationAction` + `UpdateDictationActionState`; call revalidation helper.
- `champions-app/app/(dashboard)/dictations/create-dictation-dialog.tsx` — **reference** label `<select>` + date `<input type="date">` pattern.
- `champions-app/components/dictations/edit-dictation-metadata-dialog.tsx` — **create**: client dialog with matrix label options, pre-filled current values, `useActionState` wiring.
- `champions-app/components/dictations/edit-dictation-metadata-dialog.test.tsx` — **create**: render, pre-fill, error display, submit disabled while pending.
- `champions-app/app/(dashboard)/dictations/[id]/page.tsx` — **modify** L118–132 and L162–176: add « Modifier » trigger + dialog; pass `matrixLabelOptions` from `listWordCountMatrixRows` filtered `isCompleteMatrixRow`.
- `champions-app/app/(dashboard)/dictations/[id]/page.test.tsx` — **extend**: assert Modifier button/dialog props on edit and first-save branches.
- `champions-app/app/(dashboard)/dictations/page.tsx` — **read-only** L139–158 Historique; refresh via `/dictations` revalidation.
- `champions-app/lib/services/list-dictations.ts` — **read-only** L13–31 sort `desc(dictationDate), asc(label)`.
- `champions-app/components/dossier/dictation-history-table.tsx` — **read-only** display; refresh via student path revalidation.
- `champions-app/lib/services/dictation-save.ts` — **do not modify** — edit counts path L241–305.

## Tasks & Acceptance

**Execution:**
- [x] `champions-app/lib/services/update-dictation.ts` + test — metadata UPDATE with create-parity validation — core FR49 mutation.
- [x] `champions-app/lib/revalidation/dictation-metadata-paths.ts` — revalidate dictations + dossier paths for affected students — AC immediate refresh.
- [x] `champions-app/app/(dashboard)/dictations/actions.ts` — `updateDictationAction` — server entry point with auth scope.
- [x] `champions-app/components/dictations/edit-dictation-metadata-dialog.tsx` + test — picker + date UI — teacher edit surface.
- [x] `champions-app/app/(dashboard)/dictations/[id]/page.tsx` + test — wire dialog on both saved-entry and first-save branches — FR49 entry from Historique.

**Acceptance Criteria:**
- Given a dictation has been saved (with or without error entries), when I open it from the Dictées tab history list, then I can edit the dictation label and date (FR49), label is required (non-empty trimmed), and date accepts a valid calendar date (defaults unchanged if not edited).
- Given I save updated label and/or date, when the mutation succeeds, then the Dictées history list reflects the new label and date immediately (FR49), student dossier dictation history rows show the updated label and date (FR49), and existing DictationEntry snapshots, global percentages, and promotion state are unchanged — only metadata is updated (FR49, NFR4).
- Given I change only the date, when dossier or presentation mode sorts dictations chronologically, then the dictation appears in the correct chronological position based on the new date (FR49).
- Given I change the label to match an existing matrix row label, when I save, then the update succeeds if the label exists in the word-count matrix (FR10, FR13); if the new label has no matrix row, save is blocked with a clear French error explaining the label must exist in Config.
- Given error counts were previously saved for this dictation, when I edit only metadata, then I can still reopen and edit error counts via Story 3.5 without conflict (FR22, FR42).

## Design Notes

Mirror `create-dictation-dialog.tsx`: native `<dialog>`, matrix label `<select>`, `dictation_date` input pre-filled from current `dictation.dictationDate`. Place « Modifier » as a secondary `Button` beside the detail header, not inside `ClassGrid`.

```tsx
<EditDictationMetadataDialog
  dictationId={dictation.id}
  currentLabel={dictation.label}
  currentDate={dictation.dictationDate}
  matrixLabelOptions={completeMatrixLabels}
/>
```

## Verification

**Commands:**
- `cd champions-app && npm test -- --run update-dictation edit-dictation-metadata dictations/\[id\]/page` — expected: all pass
- `cd champions-app && npm run build` — expected: no type or lint errors

**Manual checks (if no CLI):**
- Open saved dictation from Historique → Modifier → change date → save → Historique and student dossier show new date in correct sort order; grid counts unchanged.
- Change label to invalid option → French matrix error, no DB change.
- After metadata save, edit error counts and save → Story 3.5 path still succeeds.

## Spec Change Log

### Review Findings

- [x] [Review][Patch] Resolve label picker default via normalized matrix key match [`page.tsx:124`](../../champions-app/app/(dashboard)/dictations/[id]/page.tsx#L124)
- [x] [Review][Patch] Validate `dictation_id` as UUID v4 in server action [`actions.ts:137`](../../champions-app/app/(dashboard)/dictations/actions.ts#L137)
- [x] [Review][Patch] Add `updateDictationAction` integration tests [`actions.test.ts:677`](../../champions-app/app/(dashboard)/dictations/actions.test.ts#L677)

- [x] [Review][Patch] Show disabled « Modifier » with explanatory message when matrix has no complete rows [`page.tsx:63`](../../champions-app/app/(dashboard)/dictations/[id]/page.tsx#L63)
- [x] [Review][Patch] Apply `currentLabelOptionValue` on first-save branch [`page.tsx:226`](../../champions-app/app/(dashboard)/dictations/[id]/page.tsx#L226)
- [x] [Review][Patch] Reset edit dialog form after successful save via `key` on form [`edit-dictation-metadata-dialog.tsx:915`](../../champions-app/components/dictations/edit-dictation-metadata-dialog.tsx#L915)
- [x] [Review][Patch] Guard orphan label keys not present in matrix options [`page.tsx:125`](../../champions-app/app/(dashboard)/dictations/[id]/page.tsx#L125)
- [x] [Review][Patch] Add `updateDictationAction` unauthenticated redirect test [`actions.test.ts:677`](../../champions-app/app/(dashboard)/dictations/actions.test.ts#L677)
- [x] [Review][Patch] Assert post-success toast and `router.refresh()` in dialog test [`edit-dictation-metadata-dialog.test.tsx:55`](../../champions-app/components/dictations/edit-dictation-metadata-dialog.test.tsx#L55)
- [x] [Review][Patch] Unit-test `revalidateDictationMetadataPaths` `revalidatePath` calls [`dictation-metadata-paths.ts:3`](../../champions-app/lib/revalidation/dictation-metadata-paths.ts#L3)
- [x] [Review][Patch] Test `updateDictationAction` revalidation with zero student entries [`actions.test.ts:682`](../../champions-app/app/(dashboard)/dictations/actions.test.ts#L682)
- [x] [Review][Patch] Assert disabled « Modifier » shown when matrix is empty [`page.test.tsx:295`](../../champions-app/app/(dashboard)/dictations/[id]/page.test.tsx#L295)

- [x] [Review][Defer] Chronological sort after date-only change — no automated test covers dossier/history reordering [`list-dictations.ts:13`](../../champions-app/lib/services/list-dictations.ts#L13) — deferred, pre-existing

## Suggested Review Order

**Metadata mutation (entry point)**

- Metadata-only UPDATE mirroring create validation, no entry writes.
  [`update-dictation.ts:37`](../../champions-app/lib/services/update-dictation.ts#L37)

**Server action & revalidation**

- Auth-scoped action wires service + dossier path revalidation.
  [`actions.ts:113`](../../champions-app/app/(dashboard)/dictations/actions.ts#L113)

- Centralized revalidation for dictations, mobile, and student dossiers.
  [`dictation-metadata-paths.ts:3`](../../champions-app/lib/revalidation/dictation-metadata-paths.ts#L3)

**Teacher UI**

- Dialog mirrors create picker; toast + refresh without resetting grid state.
  [`edit-dictation-metadata-dialog.tsx:31`](../../champions-app/components/dictations/edit-dictation-metadata-dialog.tsx#L31)

- Header component wires Modifier on both saved and first-save branches.
  [`page.tsx:41`](../../champions-app/app/(dashboard)/dictations/[id]/page.tsx#L41)

**Tests**

- Service matrix covers happy path, validation, and class scope.
  [`update-dictation.test.ts:39`](../../champions-app/lib/services/update-dictation.test.ts#L39)

- Action tests assert revalidation helper invocation with student ids.
  [`actions.test.ts:682`](../../champions-app/app/(dashboard)/dictations/actions.test.ts#L682)
