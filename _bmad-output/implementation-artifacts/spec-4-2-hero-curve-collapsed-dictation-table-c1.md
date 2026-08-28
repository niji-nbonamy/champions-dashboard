---
title: '4-2 Hero Curve & Collapsed Dictation Table (C1)'
type: 'feature'
created: '2026-08-28'
status: 'done'
review_loop_iteration: 0
baseline_commit: '1ed4b24b49d6d9af2e5d2ae71d1116a03eaf75ca'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-4-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Story 4.1 delivers a dossier shell with a static curve placeholder and a flat history list. Teachers cannot see global progression at a glance or inspect per-category error counts without leaving the dossier (FR24, FR25).

**Approach:** Replace the placeholder with an inline-SVG hero success curve when history exists, swap the flat list for a collapsed-by-default dictation table with expandable per-category error counts (C–S, counts only), apply the `max-w-4xl` responsive layout (stacked &lt;1024px, side-by-side ≥1024px), and add a route-level skeleton for cold load.

## Boundaries & Constraints

**Always:**
- Read persisted snapshot fields only — do not recompute scores via `lib/domain/scoring`.
- Empty state unchanged from 4.1: `CurvePlaceholder` + « Aucune dictée enregistrée. » (`role="status"`); no curve line, no trend, no % when zero entries (UX-DR22).
- Hero curve plots `globalPercent` vs `dictationDate` in chronological ascending order (oldest left); service still returns newest-first for the table.
- Table rows collapsed by default; expand reveals nine category error counts only — no per-category percentages (FR25).
- Layout: `max-w-4xl mx-auto`; below `lg` curve stacks above table; at `lg+` curve and table side-by-side (UX-DR15, laptop ≥1024px).
- Cold-load skeleton mirrors dossier layout (curve block + table row stubs) via `[id]/loading.tsx` (UX-DR23).
- Reuse `formatDictationDateForDisplay`, `LevelBadge`, `dbColumnsToCategoryErrors`, `CHAMPIONS_ERROR_CATEGORIES`. French microcopy. No student names in server logs (NFR10).
- Auth + class scope unchanged — no schema changes.

**Ask First:**
- Adding a chart library (recharts, chart.js, etc.) — default **exclude**; inline SVG only.

**Never:**
- Promotion banner D1, manual override, Alertes, presentation mode (stories 4.3–4.7).
- Per-category % columns or auto-generated pedagogical narrative.
- Linking table rows to `/dictations/{id}` (deferred from 4.1).
- Client-side fetch of dossier data — keep server-component data path.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Dossier with history | ≥1 entry | Hero SVG curve + collapsed table with summary rows (label, date, level badge, global %) | N/A |
| No dictations | Zero entries | `CurvePlaceholder` + empty message; no table | N/A |
| Expand row | User activates row toggle | Nine C–S error counts visible; no % per category | N/A |
| Single dictation | One entry | Curve shows one point; table has one collapsed row | N/A |
| Cold navigation | Route transition to `/students/[id]` | `loading.tsx` skeleton until page renders | N/A |
| Wide screen | Viewport ≥1024px | Curve and table in two-column layout inside `max-w-4xl` | N/A |
| Narrow screen | Viewport &lt;1024px | Curve above table, full width within container | N/A |

</frozen-after-approval>

## Code Map

- `champions-app/app/(dashboard)/students/[id]/page.tsx` -- **MODIFY** wrap curve+table in `max-w-4xl` responsive grid; branch `GlobalSuccessCurve` vs `CurvePlaceholder`; replace list with table. [`page.tsx:70`](../../champions-app/app/(dashboard)/students/[id]/page.tsx#L70)
- `champions-app/app/(dashboard)/students/[id]/loading.tsx` -- **CREATE** route skeleton fallback (UX-DR23).
- `champions-app/app/(dashboard)/students/[id]/page.test.tsx` -- **MODIFY** assert curve/table/skeleton contracts; update mocks for `categoryErrors`.
- `champions-app/lib/services/get-student-dictation-history.ts` -- **MODIFY** select `errorsC`–`errorsS`; map via `dbColumnsToCategoryErrors`. [`get-student-dictation-history.ts:22`](../../champions-app/lib/services/get-student-dictation-history.ts#L22)
- `champions-app/lib/services/get-student-dictation-history.test.ts` -- **MODIFY** fixtures + assertions for error columns.
- `champions-app/lib/services/get-dictation-entries.ts` -- **READ** error-column select pattern. [`get-dictation-entries.ts:38`](../../champions-app/lib/services/get-dictation-entries.ts#L38)
- `champions-app/lib/domain/dossier-curve.ts` -- **CREATE** `toCurvePoints(history)` — sort asc by date, map `{ date, label, percent }`.
- `champions-app/lib/domain/dossier-curve.test.ts` -- **CREATE** sort order, single/multi point.
- `champions-app/lib/domain/error-categories.ts` -- **REUSE** `dbColumnsToCategoryErrors`, `CHAMPIONS_ERROR_CATEGORIES`. [`error-categories.ts:152`](../../champions-app/lib/domain/error-categories.ts#L152)
- `champions-app/components/dossier/global-success-curve.tsx` -- **CREATE** inline SVG line chart; `aria-label` for accessibility.
- `champions-app/components/dossier/global-success-curve.test.tsx` -- **CREATE** render points, empty guard.
- `champions-app/components/dossier/dictation-history-table.tsx` -- **CREATE** `"use client"` table; rows collapsed by default (`<details>` or equivalent).
- `champions-app/components/dossier/dictation-history-table.test.tsx` -- **CREATE** collapsed default, expand shows counts not %.
- `champions-app/components/dossier/category-error-counts.tsx` -- **CREATE** nine-letter count grid from `CHAMPIONS_ERROR_CATEGORIES`.
- `champions-app/components/dossier/dossier-skeleton.tsx` -- **CREATE** pulse/skeleton blocks matching layout.
- `champions-app/components/dossier/curve-placeholder.tsx` -- **KEEP** empty-state only. [`curve-placeholder.tsx:5`](../../champions-app/components/dossier/curve-placeholder.tsx#L5)
- `champions-app/components/dossier/dictation-history-list.tsx` -- **DELETE** replaced by table (only consumer is dossier page).
- `champions-app/app/onboarding/year-start/wizard-shell.tsx` -- **READ** prior `max-w-4xl` usage. [`wizard-shell.tsx:29`](../../champions-app/app/onboarding/year-start/wizard-shell.tsx#L29)

## Tasks & Acceptance

**Execution:**
- [x] `champions-app/lib/services/get-student-dictation-history.ts` + test -- add `categoryErrors` to history entries -- FR25 data layer.
- [x] `champions-app/lib/domain/dossier-curve.ts` + test -- chronological curve points from history -- FR24 axis data.
- [x] `champions-app/components/dossier/global-success-curve.tsx` + test -- inline SVG hero curve -- FR24 visual anchor.
- [x] `champions-app/components/dossier/category-error-counts.tsx` -- C–S count grid -- FR25 expand detail.
- [x] `champions-app/components/dossier/dictation-history-table.tsx` + test -- collapsed table replacing flat list -- FR25.
- [x] `champions-app/components/dossier/dossier-skeleton.tsx` -- layout-matched skeleton blocks -- UX-DR23.
- [x] `champions-app/app/(dashboard)/students/[id]/loading.tsx` -- wire skeleton on cold load -- UX-DR23.
- [x] `champions-app/app/(dashboard)/students/[id]/page.tsx` + test -- `max-w-4xl` responsive layout + component swap -- UX-DR15.
- [x] `champions-app/components/dossier/dictation-history-list.tsx` -- remove obsolete flat list.

**Acceptance Criteria:**
- Given a student has one or more saved dictations, when I open their dossier, then a hero global success curve is displayed at the top (FR24, UX-DR15).
- Given a student has dictation history, when the dossier loads, then a dictation history table appears below the curve, collapsed by default (FR25).
- Given a collapsed dictation row, when I expand it, then per-category error counts (C–S) are shown with counts only and no per-category percentages (FR25).
- Given a wide screen (≥1024px), when I view the dossier, then the layout uses `max-w-4xl` with curve and table side-by-side (UX-DR15).
- Given a student has no saved dictations, when I view their dossier, then I see « Aucune dictée enregistrée. » with the empty curve placeholder and no table (UX-DR22).
- Given I navigate to a student dossier, when the page is loading, then a skeleton loader matching the expected layout is displayed (UX-DR23).

## Design Notes

`toCurvePoints()` must reverse the service's newest-first order to ascending date for left-to-right progression. The table keeps newest-first (most recent row at top).

Prefer native `<details>/<summary>` per row to avoid new collapsible dependencies; ensure keyboard activation and visible focus ring.

SVG curve: simple polyline + dots at data points; Y-axis 0–100 %; no animation library. Reuse `tabular-nums` for % labels.

## Verification

**Commands:**
- `cd champions-app && npm test` -- expected: dossier-curve, global-success-curve, dictation-history-table, extended history service, and updated page tests pass.
- `cd champions-app && npm run build` -- expected: production build succeeds.

**Manual checks (if no CLI):**
- Student with 3+ dictations: curve shows ascending progression; table collapsed; expand one row → nine integer counts, no %.
- Student with zero dictations: placeholder only, empty message, no table.
- Resize across 1024px breakpoint: layout stacks then goes side-by-side.

## Spec Change Log

### Review Findings

- [x] [Review][Patch] Tie-breaker label ascendant dans `toCurvePoints` pour dates identiques [`dossier-curve.ts:14`]
- [x] [Review][Patch] `entryId` dans `CurvePoint` pour clés React stables [`dossier-curve.ts:4`, `global-success-curve.tsx:99`]
- [x] [Review][Patch] Test ordre chronologique multi-dictées au niveau page [`page.test.tsx:192`]
- [x] [Review][Patch] Assertion des neuf lettres C–S à l'expansion [`dictation-history-table.test.tsx:76`]
- [x] [Review][Patch] Test skeleton `lg:grid-cols-2` [`loading.test.tsx:13`]
- [x] [Review][Patch] Test `loading.tsx` cold-load skeleton [`loading.test.tsx`]

- [x] [Review][Defer] Étiquettes axe X sur la courbe SVG — hors scope spec (courbe hero sans axe date explicite)
- [x] [Review][Defer] Centrage point unique sur la courbe — cosmétique, spec non exigeante
- [x] [Review][Defer] Chevron visuel sur `<details>` — amélioration UX future
- [x] [Review][Defer] Parcours e2e viewport 1024px — couvert par classes CSS en tests unitaires
- [x] [Review][Reject] Clamp 0–100 % sur snapshots persistés — données DB déjà validées à la sauvegarde
- [x] [Review][Reject] Sémantique liste `ul/li` — `<details>` par ligne suffit pour FR25

## Suggested Review Order

**Dossier page orchestration**

- Server page wires curve, table, and responsive max-w-4xl layout.
  [`page.tsx:48`](../../champions-app/app/(dashboard)/students/[id]/page.tsx#L48)

**Data layer**

- History service now maps per-category error counts from persisted columns.
  [`get-student-dictation-history.ts:33`](../../champions-app/lib/services/get-student-dictation-history.ts#L33)

- Curve points sort ascending by date with label tie-breaker.
  [`dossier-curve.ts:12`](../../champions-app/lib/domain/dossier-curve.ts#L12)

**Hero curve (FR24)**

- Inline SVG polyline with stable entryId keys and accessible aria-label.
  [`global-success-curve.tsx:27`](../../champions-app/components/dossier/global-success-curve.tsx#L27)

**Collapsed dictation table (FR25)**

- Client table with details/summary rows and category count grid.
  [`dictation-history-table.tsx:13`](../../champions-app/components/dossier/dictation-history-table.tsx#L13)

- Nine-letter error count cells — counts only, no percentages.
  [`category-error-counts.tsx:8`](../../champions-app/components/dossier/category-error-counts.tsx#L8)

**Cold-load skeleton (UX-DR23)**

- Route-level loading fallback mirroring dossier grid layout.
  [`loading.tsx:3`](../../champions-app/app/(dashboard)/students/[id]/loading.tsx#L3)

**Tests**

- Page integration covers chronological curve order across multiple entries.
  [`page.test.tsx:192`](../../champions-app/app/(dashboard)/students/[id]/page.test.tsx#L192)

- Table expand contract asserts all C–S letters without per-category %.
  [`dictation-history-table.test.tsx:61`](../../champions-app/components/dossier/dictation-history-table.test.tsx#L61)
