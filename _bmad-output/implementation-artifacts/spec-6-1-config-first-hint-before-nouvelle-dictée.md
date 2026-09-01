---
title: '6-1 Config-First Hint Before « Nouvelle dictée »'
type: 'feature'
created: '09-01-2026'
status: 'done'
baseline_commit: '92755bbf027a7c559ad2d88685cb4f23575db11e'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-6-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Teachers on the Dictées tab can open « Nouvelle dictée » when setup is complete, but the picker only lists labels already defined on Config. Without guidance inside the dialog, an empty or unfamiliar picker feels like a bug and teachers do not know they must add dictations on Config first.

**Approach:** Add a short French config-first hint and an « Aller à Config » link inside the create-dictation dialog, visible whenever the dialog is reachable. Preserve all existing page-level blocking and empty-state behavior from Stories 2.7 and 3.1.

## Boundaries & Constraints

**Always:**
- Hint appears only inside `CreateDictationDialog` when `canCreateDictation` is true (dialog is rendered).
- Microcopy in French (NFR14); reuse centralized constants in `dictation-readiness.ts`.
- Link targets `/config#matrice-mots` (matrix = label source of truth per F1).
- Picker options, server validation, and create flow unchanged from Story 3.1.
- Page-level blocking hints (empty roster, unleveled students, missing matrix) remain on `dictations/page.tsx` — do not move or weaken them.
- When matrix has zero rows, creation stays blocked; Story 2.7 empty-state messages and disabled button unchanged.

**Ask First:**
- Exact hint wording if product wants different tone from the proposed constants below.

**Never:**
- Change `canCreateDictation`, `createDictationAction`, or matrix row filtering logic.
- Add labels to the picker that are not in the word-count matrix.
- Show the config-first hint when the create button is disabled or the dialog cannot open.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Ready class | Roster leveled, matrix has ≥1 complete row, `canCreate` true | Dialog opens; hint explains labels come from Config matrix; « Aller à Config » link visible | N/A |
| Navigate to Config | User clicks « Aller à Config » in dialog | Browser navigates to `/config#matrice-mots` | N/A |
| Empty matrix | `matrixRowCount === 0` | « Nouvelle dictée » disabled; page-level `MATRIX_MISSING_MESSAGE` + CTA; dialog not rendered; no config-first hint | Existing Story 2.7 behavior |
| Empty roster | `activeStudentCount === 0` | `EmptyRosterPreSetup`; disabled button; no dialog | Existing Story 2.7 behavior |
| Unleveled students | Leveled count 0, matrix present | Disabled button + Élèves CTA on page; no dialog | Existing Story 2.7 behavior |
| Partial matrix rows | Incomplete rows in DB | Only complete rows in picker (unchanged); hint still visible | N/A |
| All labels already used | Matrix rows exist, some not yet created as dictations | Picker shows remaining matrix labels; hint visible | N/A |

</frozen-after-approval>

## Code Map

- `champions-app/app/(dashboard)/dictations/create-dictation-dialog.tsx` — **primary change**: replace/enrich subtitle at L97–99 with config-first hint + `Link` to `/config#matrice-mots`; import `Link` from `next/link`.
- `champions-app/lib/domain/dictation-readiness.ts` — add `CONFIG_FIRST_HINT_MESSAGE` and `CONFIG_FIRST_CTA_LABEL` (« Aller à Config »); mirror existing `MATRIX_MISSING_*` constant pattern.
- `champions-app/app/(dashboard)/dictations/page.tsx` — **read-only**: L102–103 renders dialog when `canCreate`; L125–134 shows page-level Config CTA when blocked — do not duplicate or remove.
- `champions-app/lib/domain/dictation-readiness.ts` — `canCreateDictation` L25–27; do not modify gate logic.
- `champions-app/app/(dashboard)/dictations/actions.ts` — `createDictationAction`; read-only, no changes.
- `champions-app/app/(dashboard)/config/page.tsx` — `#matrice-mots` anchor target; read-only.
- `champions-app/app/(dashboard)/dictations/page.test.tsx` — L288–316 asserts enabled create path; extend or add sibling dialog tests.
- `spec-2-7-empty-roster-pre-setup-states.md`, `spec-3-1-create-dictation.md` — behavioral contracts to preserve.

## Tasks & Acceptance

**Execution:**
- [x] `champions-app/lib/domain/dictation-readiness.ts` — add `CONFIG_FIRST_HINT_MESSAGE` (e.g. « Les dictées disponibles proviennent de la matrice sur Config. Ajoutez une nouvelle dictée sur Config avant de la créer ici. ») and `CONFIG_FIRST_CTA_LABEL` (« Aller à Config ») — centralize French microcopy for tests and reuse.
- [x] `champions-app/app/(dashboard)/dictations/create-dictation-dialog.tsx` — render hint paragraph below dialog title using new constants; add underlined `Link` to `/config#matrice-mots`; keep `text-sm text-muted-foreground` styling consistent with page hints.
- [x] `champions-app/app/(dashboard)/dictations/create-dictation-dialog.test.tsx` — new file: render dialog with sample options; assert hint text and link `href="/config#matrice-mots"` present; assert constants imported from domain module.
- [x] `champions-app/lib/domain/dictation-readiness.test.ts` — export smoke test for new constants (non-empty strings) if not covered by dialog test.

**Acceptance Criteria:**
- Given I am on Dictées with a configured roster and word-count matrix, when I click « Nouvelle dictée », then the dialog shows a short hint that dictation labels come from the Config word-count matrix and I must add new dictations there first.
- Given the dialog is open, when I view the hint, then it includes a link or button « Aller à Config » that navigates to `/config#matrice-mots`.
- Given the word-count matrix has no rows, when I view the Dictées page, then creation remains blocked and the empty-state message still directs me to Config (Story 2.7 preserved).
- Given the matrix has rows, when I open the create-dictation picker, then only matrix-defined labels appear as selectable options (Story 3.1 unchanged) and the config-first hint is visible.

## Design Notes

Follow the existing inline-link pattern from `dictations/page.tsx` L125–134:

```tsx
<p className="text-sm text-muted-foreground">
  {CONFIG_FIRST_HINT_MESSAGE}{" "}
  <Link href="/config#matrice-mots" className="underline underline-offset-4">
    {CONFIG_FIRST_CTA_LABEL}
  </Link>
  .
</p>
```

Replace the current generic subtitle « Choisissez une dictée de la matrice et sa date. » — the new hint subsumes that guidance while adding the Config mental model.

## Verification

**Commands:**
- `cd champions-app && npm test -- --run create-dictation-dialog dictation-readiness dictations/page` — expected: all pass
- `cd champions-app && npm run build` — expected: no type or lint errors

**Manual checks (if no CLI):**
- Log in with a class that has leveled students and at least one matrix row; open Dictées → « Nouvelle dictée »; confirm hint + link; click link → lands on Config matrice section.

## Spec Change Log

## Suggested Review Order

- Config-first hint replaces generic subtitle with matrix guidance and Config link.
  [`create-dictation-dialog.tsx:102`](../../champions-app/app/(dashboard)/dictations/create-dictation-dialog.tsx#L102)

- Centralized French microcopy constants for hint and CTA label.
  [`dictation-readiness.ts:16`](../../champions-app/lib/domain/dictation-readiness.ts#L16)

**Tests**

- Dialog renders hint, link target, and matrix picker options.
  [`create-dictation-dialog.test.tsx:48`](../../champions-app/app/(dashboard)/dictations/create-dictation-dialog.test.tsx#L48)

- Constants export smoke test locks CTA label text.
  [`dictation-readiness.test.ts:34`](../../champions-app/lib/domain/dictation-readiness.test.ts#L34)
