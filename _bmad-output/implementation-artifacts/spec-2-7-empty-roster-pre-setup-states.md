---
title: '2-7 Empty Roster & Pre-Setup States'
type: 'feature'
created: '2026-08-27'
status: 'done'
review_loop_iteration: 1
baseline_commit: 'd00ba0c55b9f415cb85f6e32d5a05a479a26afab'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-testBMAD-2026-08-24/EXPERIENCE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Teachers with an empty roster or incomplete year setup land on Dictées or Config without the UX-DR22 guidance. Dictées currently gates creation on full wizard completion (`yearStartWizardCompletedAt`) instead of roster + matrix readiness (FR13), and shows a wizard link instead of a Config CSV import CTA.

**Approach:** Introduce a shared empty-roster pre-setup panel (exact French copy + primary CTA) on Dictées and Config when `activeStudentCount === 0`. Add a domain gate `canCreateDictation` (`activeStudentCount > 0 && matrixRowCount > 0` using complete matrix rows). On Dictées, disable « Nouvelle dictée » when the gate fails; show the empty-roster panel when roster is empty, otherwise keep a matrix/wizard hint linking to `/config` or `/onboarding/year-start` as appropriate.

## Boundaries & Constraints

**Always:**
- Exact empty-roster message: « Importez votre liste d'élèves pour commencer. » (UX-DR22) — no variant wording on Dictées or Config.
- Primary CTA on Dictées: `Link` → `/config#liste-eleves` (anchor on Config roster section).
- On Config with empty roster: show the same message above the existing `CsvImportForm` (form remains the functional import; do not remove it).
- `canCreateDictation` = `activeStudentCount > 0 && matrixRowCount > 0` where `matrixRowCount` matches `getYearStartWizardStatus` (complete rows: all four color word counts > 0).
- « Nouvelle dictée » stays `disabled` when `!canCreateDictation`; no server action for dictation creation in this story (Epic 3).
- Reuse `getYearStartWizardStatus` on Dictées; Config may keep `countActiveStudents` + matrix query or adopt the same service for consistency.
- French microcopy; class-scoped auth unchanged (redirect `/login`, `/onboarding/class`).
- Add `id="liste-eleves"` on Config roster `<section>` for CTA anchor.

**Ask First:**
- CTA button label on Dictées empty state (default: « Importer la liste »).
- Subtitle when roster exists but matrix incomplete on Dictées (default: keep « Configurez votre année scolaire pour préparer les dictées. » with link to `/config`).

**Never:**
- Unassigned-level blocking on dictation create beyond what FR13 requires here (level assignment stays wizard/Epic 3 concern unless gate already satisfied).
- Dossier empty states (UX-DR22 dossier row — Epic 4).
- Annual year reset (story 2.8).
- New CSV import logic — reuse `CsvImportForm` and story 2.1 flow.
- Client-only gating without server-rendered status checks.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Empty roster — Dictées | `activeStudentCount=0` | UX-DR22 message + primary CTA to `/config#liste-eleves`; « Nouvelle dictée » disabled | N/A |
| Empty roster — Config | `activeStudentCount=0` | UX-DR22 message + `CsvImportForm` visible in `#liste-eleves` section | N/A |
| Roster + matrix ready | `activeStudentCount>0`, `matrixRowCount>0` | No empty-roster panel; « Nouvelle dictée » enabled (still placeholder until Epic 3) | N/A |
| Roster, no matrix | `activeStudentCount>0`, `matrixRowCount=0` | No empty-roster panel; « Nouvelle dictée » disabled; hint toward Config/wizard | N/A |
| Roster exists — Config | `activeStudentCount>0` | Existing « liste existe déjà » message; header not empty-roster copy | N/A |
| Unauthenticated | No session | Redirect `/login` | N/A |

</frozen-after-approval>

## Code Map

- `champions-app/lib/domain/dictation-readiness.ts` -- **CREATE** `EMPTY_ROSTER_MESSAGE`, `canCreateDictation(status)` — FR13 gate shared by Dictées.
- `champions-app/lib/domain/dictation-readiness.test.ts` -- **CREATE** gate matrix: empty roster, matrix-only missing, both ready.
- `champions-app/lib/services/get-year-start-wizard-status.ts` -- **READ** source for `activeStudentCount`, `matrixRowCount` on Dictées. [`get-year-start-wizard-status.ts:57`](../../champions-app/lib/services/get-year-start-wizard-status.ts#L57)
- `champions-app/app/(dashboard)/dictations/page.tsx` -- **MODIFY** replace `wizardStatus.completed` gate; empty-roster panel + CTA; conditional hints. [`page.tsx:22`](../../champions-app/app/(dashboard)/dictations/page.tsx#L22)
- `champions-app/app/(dashboard)/config/page.tsx` -- **MODIFY** conditional header; `id="liste-eleves"`; empty-roster message above form. [`page.tsx:32`](../../champions-app/app/(dashboard)/config/page.tsx#L32)
- `champions-app/components/dashboard/empty-roster-pre-setup.tsx` -- **CREATE** shared message + optional CTA `Link` (Dictées); message-only variant (Config above form).
- `champions-app/app/(dashboard)/config/csv-import-form.tsx` -- **READ** unchanged import UI. [`csv-import-form.tsx`](../../champions-app/app/(dashboard)/config/csv-import-form.tsx)
- `champions-app/app/(dashboard)/students/roster-list.tsx` -- **READ** inline empty `<p>` pattern for styling consistency. [`roster-list.tsx:41`](../../champions-app/app/(dashboard)/students/roster-list.tsx#L41)
- `champions-app/app/(dashboard)/dictations/page.test.tsx` -- **MODIFY** empty-roster message, CTA href, gate uses roster+matrix not `completed`. [`page.test.tsx:67`](../../champions-app/app/(dashboard)/dictations/page.test.tsx#L67)
- `champions-app/app/(dashboard)/config/page.test.tsx` -- **MODIFY** UX-DR22 exact copy when roster empty; anchor id present. [`page.test.tsx:55`](../../champions-app/app/(dashboard)/config/page.test.tsx#L55)

## Tasks & Acceptance

**Execution:**
- [x] `champions-app/lib/domain/dictation-readiness.ts` -- Message constant + `canCreateDictation` helper -- FR13 single source of truth.
- [x] `champions-app/lib/domain/dictation-readiness.test.ts` -- Unit tests -- gate edge cases from I/O matrix.
- [x] `champions-app/components/dashboard/empty-roster-pre-setup.tsx` -- Shared empty-roster panel -- UX-DR22 consistent UI.
- [x] `champions-app/app/(dashboard)/dictations/page.tsx` -- Empty-roster state, CTA, updated gate + hints -- Dictées pre-setup surface.
- [x] `champions-app/app/(dashboard)/config/page.tsx` -- Conditional header, anchor, empty-roster intro -- Config pre-setup surface.
- [x] `champions-app/app/(dashboard)/dictations/page.test.tsx` -- Empty roster + roster-without-matrix cases -- regression guard.
- [x] `champions-app/app/(dashboard)/config/page.test.tsx` -- Exact UX-DR22 copy + `#liste-eleves` -- Config empty state.

**Acceptance Criteria:**
- Given my roster is empty, when I visit Dictées, then I see « Importez votre liste d'élèves pour commencer. » with a primary CTA to Config CSV import and « Nouvelle dictée » is disabled (UX-DR22).
- Given my roster is empty, when I visit Config, then I see the same message with the CSV import form available in the liste d'élèves section (UX-DR22).
- Given roster and word-count matrix are both configured (`activeStudentCount > 0` and at least one complete matrix row), when I visit Dictées, then « Nouvelle dictée » is enabled (FR13 gate satisfied for this story).
- Given my roster has students but no complete matrix row, when I visit Dictées, then « Nouvelle dictée » remains disabled (FR13).

## Design Notes

Dictées empty state (roster empty):

```tsx
<EmptyRosterPreSetup showCta ctaHref="/config#liste-eleves" />
<Button disabled>Nouvelle dictée</Button>
```

Config empty roster: same message component without external CTA; `CsvImportForm` directly below in `#liste-eleves`.

## Verification

**Commands:**
- `cd champions-app && npm test` -- expected: all tests pass including new domain, dictations, and config cases.
- `cd champions-app && npm run build` -- expected: production build succeeds.

**Manual checks (if no CLI):**
- Login with empty class roster → Dictées shows UX-DR22 message + CTA → Config shows message + CSV form at `#liste-eleves`.
- Import roster + configure matrix → Dictées enables « Nouvelle dictée ».

## Spec Change Log

- [x] [Review][Patch] Config empty-roster test did not assert message-only variant (no CTA) [`config/page.test.tsx`]
- [x] [Review][Patch] Dictations ready-state test did not assert empty-roster panel hidden [`dictations/page.test.tsx`]
- [x] [Review][Patch] Gate divergence when `wizardStatus.completed` true but roster/matrix missing untested [`dictations/page.test.tsx`]
- [x] [Review][Patch] Dictations enabled test checked only `aria-disabled`, not absence of native `disabled` [`dictations/page.test.tsx`]
- [x] [Review][Patch] Matrix hint on Dictées linked to `/config` without anchor — added `#matrice-mots` [`dictations/page.tsx`, `config/page.tsx`]
- [x] [Review][Patch] `canCreateDictation` missing explicit `0,0` case [`dictation-readiness.test.ts`]

## Suggested Review Order

**FR13 dictation gate**

- Single source of truth: roster plus complete matrix row count
  [`dictation-readiness.ts:11`](../../champions-app/lib/domain/dictation-readiness.ts#L11)

**Empty-roster UX (UX-DR22)**

- Shared message and optional Config CTA for Dictées
  [`empty-roster-pre-setup.tsx:16`](../../champions-app/components/dashboard/empty-roster-pre-setup.tsx#L16)

- Dictées: gate, empty panel, matrix hint with anchor
  [`page.tsx:25`](../../champions-app/app/(dashboard)/dictations/page.tsx#L25)

- Config: anchor sections, message above CSV import form
  [`page.tsx:44`](../../champions-app/app/(dashboard)/config/page.tsx#L44)

**Tests**

- Gate edge cases including wizard-complete regressions
  [`page.test.tsx:107`](../../champions-app/app/(dashboard)/dictations/page.test.tsx#L107)

- Config message-only variant and liste-eleves anchor
  [`page.test.tsx:55`](../../champions-app/app/(dashboard)/config/page.test.tsx#L55)