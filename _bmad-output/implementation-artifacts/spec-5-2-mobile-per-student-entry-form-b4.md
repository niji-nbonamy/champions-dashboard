---
title: '5-2 Mobile Per-Student Entry Form (B4)'
type: 'feature'
created: '2026-08-31'
status: 'done'
baseline_commit: '433c6610eb0476808c508bc1f79cdfafbd6a8d08'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-5-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Story 5.1 left `/dictations/{id}/mobile` as a stub heading — teachers on phone can reach « Saisir » but cannot pick a student or enter error counts. The laptop `saveDictation` path requires the full roster on first save, so mobile incremental capture needs a dedicated single-student upsert.

**Approach:** Build the B4 student picker and per-student form below 768px: list leveled active students with « saisi » indicators and remaining count, nine large quick-tap numeric fields per student, and save via a new service that reuses domain scoring/validation and the same snapshot rules as the laptop grid.

## Boundaries & Constraints

**Always:**
- Mobile-only surfaces (`<768px`); tablet/laptop grid and G1 workflows unchanged.
- Picker lists only leveled, non-archived active students via `listLeveledActiveStudents` (same denominator as `getDictationCompletionSummary`).
- « saisi » derived from persisted `DictationEntry` for the dictation — no separate tracking entity.
- Picker subtitle shows remaining count (e.g. « 3 restants ») = `totalLeveledCount - enteredCount`.
- Nine error-category fields from `CHAMPIONS_ERROR_CATEGORIES` (label + value side-by-side per field, full row width); min 48px height (`min-h-12`), `inputMode="numeric"` on manual input, min 44px touch targets.
- Pre-fill fields when an entry exists (`dbColumnsToCategoryErrors` on existing entry).
- Quick-tap: tap cycles 0→1→2→3 per field (FR38). Values ≥4 via long-press **or** a dedicated numeric input affordance on the field.
- « Enregistrer » saves one student, then navigates back to picker with updated counts.
- Prev/next **arrow icon buttons** (← / →) on the form navigate between leveled students in roster sort order (no swipe).
- New `saveDictationStudentEntry` service: insert for new entry (word denominator from matrix + current level), update for existing (immutable `levelAtSave` + `wordDenominator` snapshot). Reuse `normalizeCategoryCounts`, `validateGridRow`, `calculateGlobalPercent`, `categoryErrorsToDbColumns`, `cascadePromotionReevaluation`.
- Server Action wraps service; `revalidatePath` for `/dictations`, `/dictations/{id}/mobile`, `/dictations/{id}/mobile/summary`.
- French microcopy. Auth + class scope unchanged. No schema changes. No student names in server logs.

**Ask First:**
- Long-press vs explicit « Saisir un nombre » text input for values ≥4 — default **both**: long-press opens native numeric input overlay; tap still cycles 0–3.
- Show student first name only (`getStudentFirstName`) vs full `displayName` in picker rows — **resolved: full `displayName`** (code review 2026-08-31, choice 1B).
- Field layout full-width stacked vs label/value side-by-side — **resolved: side-by-side** (code review 2026-08-31, choice 2B).

**Never:**
- Unleveled-student block UI (story 5.3) — unleveled students are excluded from picker entirely.
- Full mobile class grid, promotion validate/refuse, dossier, presentation mode.
- Calling `saveDictation` / `saveDictationAction` with partial roster counts.
- Client-side authoritative score or promotion computation.
- Viewport detection in middleware.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Picker load | Valid dictation, 5 leveled students, 2 entries exist | 5 rows; 2 show « saisi »; subtitle « 3 restants » | Invalid UUID / dictation → `notFound()` |
| New entry save | Student has no entry, valid counts | Insert with matrix word denominator + `levelAtSave`; redirect to picker; remaining count decrements | Validation fail → inline French message from `formatGridRowValidationMessage`; no DB write |
| Edit entry save | Student has entry, changed counts | Update scores using frozen snapshot denominator; redirect to picker | Missing entry on update path → generic save error |
| Quick-tap cycle | Field value 3, tap | Value becomes 0 | N/A |
| High count | Long-press or numeric input, enter 7 | Field shows 7; save accepts if valid | Reject negative or non-integer |
| Prev/next | Middle student in roster | Arrows navigate to adjacent leveled students without saving draft | First/last student disables prev/next respectively |
| Empty roster | Zero leveled students | Picker shows status message; no student rows (align with hub zero-leveled copy) | N/A |
| No matrix row | Dictation label has no matching matrix row | Save blocked with user-facing error | No insert |

</frozen-after-approval>

## Code Map

- `champions-app/lib/services/dictation-save.ts` -- **EXTEND** add `saveDictationStudentEntry(classId, dictationId, studentId, counts)`; reuse L88–200 helpers (`normalizeCategoryCounts`, `prepareDictationEntries` single-student slice, `prepareDictationEntryUpdates` single snapshot, `cascadePromotionReevaluation` L206–217). Current `saveDictation` L303–320 blocks partial first save — do not modify batch contract.
- `champions-app/lib/services/dictation-save.test.ts` -- **EXTEND** insert, update, validation reject, missing matrix row cases for single-student path.
- `champions-app/app/(dashboard)/dictations/actions.ts` -- **EXTEND** `saveDictationStudentEntryAction` mirroring `saveDictationAction` L101–128 pattern with mobile path revalidation.
- `champions-app/lib/services/list-leveled-active-students.ts` -- **REUSE** L13–41 roster query + `fr` sort for picker order.
- `champions-app/lib/services/get-dictation-entries.ts` -- **REUSE** L24–55 `getDictationEntriesByDictationId` for « saisi » set + pre-fill.
- `champions-app/lib/domain/error-categories.ts` -- **REUSE** `CHAMPIONS_ERROR_CATEGORIES` L20–87, `dbColumnsToCategoryErrors` L141–167, `formatGridCellAriaLabel` L106–112.
- `champions-app/lib/domain/grid-validation.ts` -- **REUSE** `validateGridRow`, `formatGridRowValidationMessage` L22–59.
- `champions-app/lib/domain/word-count-matrix.ts` -- **REUSE** `getWordCountForLevel` L58–72 for new entries.
- `champions-app/lib/domain/dictation.ts` -- **REUSE** `findMatchingMatrixRow` L108–118.
- `champions-app/lib/domain/student-display-name.ts` -- **READ** full `displayName` in mobile validation messages and field aria-labels (no name split).
- `champions-app/components/grid/grid-cell.tsx` -- **READ** L33–45 `parseNonNegativeInteger` pattern for numeric parsing in mobile field.
- `champions-app/app/(dashboard)/students/roster-list.tsx` -- **READ** L73–79 row layout pattern for large touch list rows.
- `champions-app/components/ui/level-badge.tsx` -- **REUSE** level color dot in picker rows.
- `champions-app/components/dictations/mobile-error-field.tsx` -- **CREATE** client field: tap cycle 0–3, long-press/input for ≥4, `min-h-12`, `inputMode="numeric"`.
- `champions-app/components/dictations/mobile-error-field.test.tsx` -- **CREATE** cycle, long-press/input, aria labels.
- `champions-app/components/dictations/mobile-student-picker.tsx` -- **CREATE** presentational picker: rows, « saisi » badge, remaining subtitle, links to `/mobile/[studentId]`.
- `champions-app/components/dictations/mobile-student-picker.test.tsx` -- **CREATE** saisi markers, remaining count, empty state.
- `champions-app/components/dictations/mobile-per-student-form.tsx` -- **CREATE** client form: nine `MobileErrorField`s, validation display, Enregistrer, prev/next arrows, calls action.
- `champions-app/components/dictations/mobile-per-student-form.test.tsx` -- **CREATE** pre-fill, save success/error, prev/next disabled edges.
- `champions-app/app/(dashboard)/dictations/[id]/mobile/page.tsx` -- **MODIFY** replace stub L41–52 with server-fetched picker data (reuse auth boilerplate L18–39).
- `champions-app/app/(dashboard)/dictations/[id]/mobile/[studentId]/page.tsx` -- **CREATE** server page: load student, entry, matrix row, word denominator; render `MobilePerStudentForm`.
- `champions-app/app/(dashboard)/dictations/[id]/mobile/[studentId]/page.test.tsx` -- **CREATE** auth, notFound, pre-fill props.
- `champions-app/components/dashboard/mobile-route-guard.tsx` -- **READ** L7–8 regex already permits `/mobile/[studentId]` — no change unless test gap found.

## Tasks & Acceptance

**Execution:**
- [x] `champions-app/lib/services/dictation-save.ts` + test -- `saveDictationStudentEntry` upsert -- enables incremental mobile capture without breaking batch grid save.
- [x] `champions-app/app/(dashboard)/dictations/actions.ts` -- `saveDictationStudentEntryAction` + revalidation -- server-authoritative mobile mutation path.
- [x] `champions-app/components/dictations/mobile-error-field.tsx` + test -- quick-tap 0–3 + ≥4 input -- FR38 / UX-DR21 touch targets.
- [x] `champions-app/components/dictations/mobile-student-picker.tsx` + test -- picker UI with saisi + restants -- B4 entry point from hub « Saisir ».
- [x] `champions-app/components/dictations/mobile-per-student-form.tsx` + test -- nine fields, save, prev/next -- per-student capture surface.
- [x] `champions-app/app/(dashboard)/dictations/[id]/mobile/page.tsx` -- wire picker server data -- replace 5.1 stub.
- [x] `champions-app/app/(dashboard)/dictations/[id]/mobile/[studentId]/page.tsx` + test -- form route with pre-fill and navigation context -- deep link per student.

**Acceptance Criteria:**
- Given I tap « Saisir » on the mobile hub for an open dictation, when the student picker loads, then all active leveled non-archived students are listed with « saisi » on those who have an entry and a subtitle showing remaining count.
- Given I select a student, when the per-student form loads, then nine full-width numeric fields (min 48px height, `inputmode="numeric"`) are shown and pre-filled if an entry exists.
- Given quick-tap mode is active, when I tap a field repeatedly, then values cycle 0→1→2→3, and I can enter values ≥4 via long-press or dedicated input.
- Given valid counts, when I tap Enregistrer, then the entry is saved with the same scoring and snapshot rules as the laptop grid and I return to the picker with updated completion counts.
- Given I am on the per-student form, when I use prev/next arrows, then I navigate between leveled students in roster order without swipe gestures.

## Design Notes

Single-student save extracts one iteration from `prepareDictationEntries` (new) or `prepareDictationEntryUpdates` (existing). On insert when **no** entries exist yet for the dictation, only insert the one row — do not require other students' counts (differs from `saveDictation` L320).

After save, `router.push` back to `/dictations/{id}/mobile` (client) plus server `revalidatePath` keeps hub summary fresh on next visit.

Quick-tap fields use a `<button>` for tap-to-cycle with an visually hidden or expandable `<input>` for manual entry — keeps 48px touch target without laptop grid keyboard nav.

## Verification

**Commands:**
- `cd champions-app && npm test` -- expected: new dictation-save, picker, error-field, form, and page tests pass.
- `cd champions-app && npm run build` -- expected: production build succeeds.

**Manual checks (if no CLI):**
- Below 768px: hub → Saisir → picker shows students and restants → select student → enter counts via tap cycle → Enregistrer → picker updates « saisi ». Edit existing entry pre-fills. Prev/next moves between students. Laptop grid save still works unchanged at ≥768px.

## Spec Change Log

- Review loop 1: Matrix-missing case shows inline alert on student form page instead of `notFound()`; added picker page integration test.
- Code review 2026-08-31: Resolved Ask First — keep full `displayName` (1B), keep label/value side-by-side layout (2B), adopt arrow icon prev/next (3A).

## Suggested Review Order

**Single-student save path**

- Incremental upsert reuses domain scoring without breaking batch grid save.
  [`dictation-save.ts:366`](../../champions-app/lib/services/dictation-save.ts#L366)

- Server action wraps service with mobile path revalidation after save.
  [`actions.ts:137`](../../champions-app/app/(dashboard)/dictations/actions.ts#L137)

**Mobile B4 UI**

- Picker lists leveled students with saisi badges and remaining count.
  [`mobile-student-picker.tsx:49`](../../champions-app/components/dictations/mobile-student-picker.tsx#L49)

- Quick-tap field cycles 0–3 with dedicated manual numeric affordance.
  [`mobile-error-field.tsx:36`](../../champions-app/components/dictations/mobile-error-field.tsx#L36)

- Per-student form validates, saves, and navigates prev/next in roster order.
  [`mobile-per-student-form.tsx:52`](../../champions-app/components/dictations/mobile-per-student-form.tsx#L52)

**Routes**

- Picker page loads roster + entries and derives completion state.
  [`page.tsx:44`](../../champions-app/app/(dashboard)/dictations/[id]/mobile/page.tsx#L44)

- Student form page pre-fills snapshots or blocks on missing matrix row.
  [`page.tsx:75`](../../champions-app/app/(dashboard)/dictations/[id]/mobile/[studentId]/page.tsx#L75)

**Tests**

- Service insert/update/validation coverage for single-student save.
  [`dictation-save.test.ts:696`](../../champions-app/lib/services/dictation-save.test.ts#L696)

- Picker, field, form, and page integration tests for B4 flows.
  [`mobile/page.test.tsx:58`](../../champions-app/app/(dashboard)/dictations/[id]/mobile/page.test.tsx#L58)

### Review Findings

- [x] [Review][Decision] Affichage prénom vs nom complet — **Résolu 1B** : garder `displayName` complet ; spec mise à jour.
- [x] [Review][Decision] Layout champs pleine largeur empilés — **Résolu 2B** : garder layout label/valeur côte à côte ; spec mise à jour.
- [x] [Review][Patch] Navigation prev/next : remplacer texte par icônes flèches ← / → — **Résolu 3A** [`mobile-per-student-form.tsx:135`]

- [x] [Review][Patch] Tap cycle remet à 0 les valeurs ≥ 4 [`mobile-error-field.tsx:65`]
- [x] [Review][Patch] Cible tactile « Saisir un nombre » < 44 px [`mobile-error-field.tsx:146`]
- [x] [Review][Patch] Pas d’indicateur de chargement sur Enregistrer pendant `isPending` [`mobile-per-student-form.tsx:188`]
- [x] [Review][Patch] Navigation prev/next active pendant `isPending` (abandon silencieux de la sauvegarde) [`mobile-per-student-form.tsx:135`]
- [x] [Review][Patch] Timer long-press non nettoyé au démontage du composant [`mobile-error-field.tsx:48`]
- [x] [Review][Patch] Tests manquants — long-press et propagation saisie manuelle ≥ 4 [`mobile-error-field.test.tsx`]
- [x] [Review][Patch] Tests manquants — erreur serveur après Enregistrer et Suivant désactivé sur dernier élève [`mobile-per-student-form.test.tsx`]
- [x] [Review][Patch] Tests manquants — `saveDictationStudentEntryAction` et `revalidatePath` [`actions.test.ts`]
- [x] [Review][Patch] Tests manquants — assertion préremplissage sur page élève [`[studentId]/page.test.tsx`]
- [x] [Review][Patch] Tests manquants — picker page auth, notFound, roster vide [`mobile/page.test.tsx`]
- [x] [Review][Patch] Tests manquants — entrées archivées exclues du décompte + route guard `/mobile/[studentId]` [`mobile/page.test.tsx`, `mobile-route-guard.test.ts`]
- [x] [Review][Patch] Tests manquants — cascade promotion sur `saveDictationStudentEntry` [`dictation-save.test.ts`]
- [x] [Review][Patch] Tests manquants — edge cases service (dictation introuvable, élève absent) [`dictation-save.test.ts`]

- [x] [Review][Defer] Mises à jour concurrentes last-write-wins — même pattern que `saveDictation` batch [`dictation-save.ts:410`] — deferred, pre-existing
- [x] [Review][Defer] Brouillon perdu sans confirmation sur navigation prev/next — hors spec MVP [`mobile-per-student-form.tsx:135`] — deferred, pre-existing
- [x] [Review][Defer] `saveDictationAction` sans tests action dédiés — trou pré-existant [`actions.test.ts`] — deferred, pre-existing

## Spec Change Log

- Post-delivery (2026-09-01): Mobile B4 validation and field aria-labels use full `displayName`; `getStudentFirstName` removed (picker already used full name per decision 1B).
- [x] [Review][Defer] Incohérence statut spec `done` vs sprint `review` — hygiène artefact [`spec-5-2-*.md`, `sprint-status.yaml`] — deferred, pre-existing