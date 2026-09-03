---
title: '7-3 Category Error Curves in Presentation Mode (RDV parents)'
type: 'feature'
created: '09-03-2026'
status: 'done'
baseline_commit: '1f3d59b92898da461d4df7a4be329cb2dcf0faf0'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-7-context.md'
  - '{project-root}/_bmad-output/specs/spec-dashboards-dictees-champions-ce2/scoring-model.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** In parent-meeting presentation mode (C3), teachers can only show the global % success curve. They cannot visualize where errors concentrate per CHAMPIONS category across dictations without mixing percentages and raw integer counts on the same scale.

**Approach:** Add a dual-panel charts row in C3 only: existing `GlobalSuccessCurve` (left, % scale) plus a new integer Y-axis category error chart (right) with nine toggles below both panels. Default active category is C (Conjugaison); state resets each presentation session.

## Boundaries & Constraints

**Always:**
- **C3 only** — compose in `presentation-mode.tsx`; `students/[id]/page.tsx` (C1 dossier) unchanged.
- Data from `StudentDictationHistoryEntry.categoryErrors` — direct snapshot integers per `scoring-model.md`; no % formula.
- Chronological X order matches `toCurvePoints` (ascending `dictationDate`, then `label`, then `entryId`).
- X-axis point positions align with `GlobalSuccessCurve` (same index-based mapping over chart width).
- Right panel heading **« Erreurs par catégorie »** (visible `h2`); chart zone `aria-label="Erreurs par catégorie"`.
- Left panel heading **« Réussite globale (%) »** when dual layout is shown.
- Y-axis (right): integers only; auto-scale to `max(active category errors across dictations) + 1` with integer tick labels.
- Default on open: only **C** active; `useState` initial value — no localStorage; remount resets.
- Toggles below both charts, centered; control right panel only; no max on simultaneous curves.
- Toggle colors: `CHAMPIONS_ERROR_CATEGORIES[].headerBackground`; active = filled, inactive = muted outline.
- Tooltip: `{label} — {categoryName}: {count} erreur(s)` (pluralize `erreur` when count > 1).
- Toggles: `aria-pressed`; keyboard Tab + Space/Enter; SR announces category name + affichée/masquée.
- Layout laptop (≥1024px): two columns side by side; tablet (<1024px): stacked — global above, category below; toggles under both.
- `PresentationHighlights` and collapsed « Détail par catégorie » table unchanged below charts.
- Inline SVG only — no chart library (consistent with 4.2 / 7.2).
- Reuse exported X-axis helpers from `global-success-curve.tsx` (`truncateLabel`, `selectVisibleLabelIndices`, `shouldUseDateLabels`, `getXAxisDisplayLabel`) for aligned labels.

**Ask First:**
- Extracting shared SVG layout constants (`SVG_WIDTH`, `PADDING`) into a new `dossier-chart-layout.ts` vs. duplicating in category chart — prefer shared module if both charts must stay pixel-aligned.
- Changing default active category or toggle visual style if layout breaks on real data.

**Never:**
- Category curves or toggles on C1 dossier hero or Élèves tab.
- Mixing % and integer counts on one Y-axis.
- Recompute scores or alter `get-student-dictation-history` / `toCurvePoints`.
- Persist toggle state across sessions (localStorage, URL params).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| C3 open with history | ≥1 saved dictation | Dual charts on laptop; C curve active; C toggle pressed | N/A |
| Toggle on | Click « H » | H polyline added; toggle active; other curves remain | N/A |
| Toggle off | Deactivate C | C curve removed; others remain | N/A |
| All nine active | All toggles on | Nine polylines render; no error for ~15–20 dictations | N/A |
| Zero errors in category | Active category, count 0 at dictation | Point at Y=0 (not omitted) | N/A |
| All active values zero | Only C active, all C counts 0 | Y-axis shows 0–1 integer scale | N/A |
| C1 dossier | Regular student page | Global % curve only — no category panel or toggles | N/A |
| Empty history | `history=[]` | Existing `CurvePlaceholder`; no category panel | N/A |
| Tablet viewport | <1024px | Stacked layout; toggles below both charts | N/A |
| Keyboard toggle | Space on focused toggle | `aria-pressed` toggles; curve updates | N/A |
| Session reset | Close and reopen presentation | Back to C-only default | N/A |

</frozen-after-approval>

## Code Map

- `champions-app/components/dossier/presentation-mode.tsx` L85–94 — replace single `GlobalSuccessCurve` section with `PresentationChartsRow`; pass `history`, `curvePoints`, `hasHistory`.
- `champions-app/components/dossier/global-success-curve.tsx` L13–24, L113–124 — **READ ONLY** `SVG_WIDTH`, `PADDING`, `toChartCoordinates` index formula for X alignment; exported helpers L26–90 for X labels.
- `champions-app/lib/domain/dossier-curve.ts` L10–25 — **READ ONLY** `toCurvePoints` sort order; category chart must use same chronological sequence.
- `champions-app/lib/services/get-student-dictation-history.ts` L10–18 — `categoryErrors: Record<ChampionsErrorCategoryLetter, number>` per entry; no service changes.
- `champions-app/lib/domain/error-categories.ts` L20–87 — `CHAMPIONS_ERROR_CATEGORIES` for names, letters, `headerBackground` / `headerForeground`.
- `champions-app/components/dossier/category-error-counts.tsx` — **READ ONLY** pattern for iterating categories; not reused for toggles (different interaction).
- `champions-app/components/dossier/presentation-mode.test.tsx` L214–232 — extend for dual-panel headings, default C toggle, stacked/responsive markers; preserve existing dialog/navigation tests.
- **New:** `presentation-charts-row.tsx` — owns toggle state (`Set` with initial `['C']`), responsive grid, composes global + category + toggles.
- **New:** `category-error-curves.tsx` — multi-series integer SVG chart; one polyline per active letter; Y auto-scale; shared X with global curve.
- **New:** `category-curve-toggles.tsx` — nine letter buttons, `aria-pressed`, category colors.
- **Optional new:** `dossier-chart-layout.ts` — shared `SVG_WIDTH`, `SVG_HEIGHT`, `PADDING` if extracted from global curve for alignment.
- `champions-app/app/(dashboard)/students/[id]/page.tsx` — **no changes**.
- `champions-app/app/(dashboard)/students/[id]/present/page.tsx` — **no changes** (passes history to `PresentationMode`).

## Tasks & Acceptance

**Execution:**
- [x] `champions-app/components/dossier/category-error-curves.tsx` — integer Y-axis multi-series chart from `history` + `activeCategories`; aligned X, tooltips, a11y — right panel (FR-DOSSIER-2)
- [x] `champions-app/components/dossier/category-curve-toggles.tsx` — nine toggles with `aria-pressed`, category colors, keyboard support — category visibility control
- [x] `champions-app/components/dossier/presentation-charts-row.tsx` — dual layout (lg side-by-side, stacked below), default C-only state, headings — C3 composition
- [x] `champions-app/components/dossier/presentation-mode.tsx` — swap single curve section for `PresentationChartsRow` — wire C3 only
- [x] `champions-app/components/dossier/category-error-curves.test.tsx` — Y integer scale, multi-series, zero points, tooltip format, empty guard
- [x] `champions-app/components/dossier/category-curve-toggles.test.tsx` — default C active, toggle on/off, `aria-pressed`, keyboard
- [x] `champions-app/components/dossier/presentation-charts-row.test.tsx` — layout headings, default state, passes active set to child charts
- [x] `champions-app/components/dossier/presentation-mode.test.tsx` — dual charts present, C1 unchanged indirectly (no category panel), tablet stack class, highlights unchanged

**Acceptance Criteria:**
- Given I open presentation mode for a student with saved dictations on laptop (≥1024px), when the view loads, then I see global % (left) and « Erreurs par catégorie » (right) side by side, with only the C curve active and the C toggle in active state.
- Given the right panel is visible, when I view the Y-axis, then values are integers (error counts), never percentages, and the section is labeled « Erreurs par catégorie ».
- Given I activate a category toggle, when the chart updates, then a curve appears for that category's integer counts per dictation and existing active curves remain — no maximum limit.
- Given all nine toggles are active, when the chart renders, then all nine curves display without error for a typical year (~15–20 dictations).
- Given I deactivate the C toggle, when the chart updates, then the Conjugaison curve is removed while other active curves remain.
- Given I am on the regular student dossier (not presentation), when I view the hero curve, then only the global % curve is shown — no category panel or toggles.
- Given presentation mode on viewport <1024px, when charts render, then global curve stacks above « Erreurs par catégorie » with toggles below both.
- Given a dictation has 0 errors in an active category, when the curve renders, then the point shows 0 on the Y-axis.
- Given I use keyboard navigation on toggles, when I press Space, then `aria-pressed` updates and screen readers announce the category state.

## Design Notes

Y-scale helper (conceptual):

```ts
const maxError = Math.max(0, ...activeSeries.flatMap((s) => s.values));
const yMax = maxError + 1;
// y = PADDING.top + (1 - count / yMax) * chartHeight — integer ticks 0..yMax
```

Toggle state in `PresentationChartsRow`:

```ts
const [active, setActive] = useState<Set<ChampionsErrorCategoryLetter>>(new Set(["C"]));
```

Share X index mapping with global curve: `x = PADDING.left + (index / lastIndex) * chartWidth` over the same sorted history length.

## Verification

**Commands:**
- `cd champions-app && npm test -- category-error-curves category-curve-toggles presentation-charts-row presentation-mode` — expected: all new and extended tests pass
- `cd champions-app && npm test` — expected: full suite green
- `cd champions-app && npm run lint` — expected: no errors

**Manual checks:**
- Open `/students/[id]/present` with ≥2 dictations: dual panels on laptop; only C curve; toggles add/remove series.
- Resize below 1024px: stacked layout.
- Open regular dossier `/students/[id]`: no category panel.

## Suggested Review Order

**C3 composition**

- Dual-panel entry point wiring presentation mode to charts row.
  [`presentation-mode.tsx:84`](../../champions-app/components/dossier/presentation-mode.tsx#L84)

- Toggle state, responsive layout, and default C-only session reset.
  [`presentation-charts-row.tsx:21`](../../champions-app/components/dossier/presentation-charts-row.tsx#L21)

**Category error chart**

- Integer Y-axis multi-series chart with aligned X positions.
  [`category-error-curves.tsx:62`](../../champions-app/components/dossier/category-error-curves.tsx#L62)

- Nine letter toggles with category colors and aria-pressed.
  [`category-curve-toggles.tsx:22`](../../champions-app/components/dossier/category-curve-toggles.tsx#L22)

**Shared chart layout**

- Extracted SVG dimensions and coordinate helpers for pixel alignment.
  [`dossier-chart-layout.ts:1`](../../champions-app/components/dossier/dossier-chart-layout.ts#L1)

- Global curve now imports shared layout constants.
  [`global-success-curve.tsx:8`](../../champions-app/components/dossier/global-success-curve.tsx#L8)

**Tests**

- Toggle-to-series integration and session reset behavior.
  [`presentation-charts-row.interaction.test.tsx:54`](../../champions-app/components/dossier/presentation-charts-row.interaction.test.tsx#L54)

- Category chart integer scale, chronological order, inactive series guard.
  [`category-error-curves.test.tsx:74`](../../champions-app/components/dossier/category-error-curves.test.tsx#L74)

- Presentation mode dual-panel smoke tests.
  [`presentation-mode.test.tsx:214`](../../champions-app/components/dossier/presentation-mode.test.tsx#L214)

### Review Findings

- [x] [Review][Decision] `aria-label` du graphique catégorie — **résolu : option 1** — utiliser la chaîne exacte `"Erreurs par catégorie"` sur le SVG (spec L28).
- [x] [Review][Decision] Toutes les catégories désactivées — **résolu : option 1** — empêcher la désactivation de la dernière catégorie active (minimum 1).
- [x] [Review][Patch] Tooltip sans libellé de dictée [`category-error-curves.tsx:71`]
- [x] [Review][Patch] `aria-label` exact `"Erreurs par catégorie"` sur le SVG catégorie [`category-error-curves.tsx:828`]
- [x] [Review][Patch] Empêcher désactivation de la dernière catégorie active [`presentation-charts-row.tsx:44`]
- [x] [Review][Patch] ESLint `react-hooks/set-state-in-effect` sur reset toggles [`presentation-charts-row.tsx:37`]
- [x] [Review][Patch] ESLint `react-hooks/set-state-in-effect` sur clear hover [`category-error-curves.tsx:104`]
- [x] [Review][Patch] Variable `chartHeight` inutilisée [`category-error-curves.tsx:120`]
- [x] [Review][Patch] IDEA-007 hors périmètre dans le diff [`future-ideas.md`]
- [x] [Review][Patch] Test Space simule `click()` manuellement au lieu de valider le comportement natif [`category-curve-toggles.test.tsx:311`]
- [x] [Review][Patch] Pas de test 9 courbes sur ~15–20 dictées (AC4) [`category-error-curves.test.tsx`]
- [x] [Review][Patch] Pas de test d'alignement X inter-graphiques [`presentation-charts-row.interaction.test.tsx`]
- [x] [Review][Patch] Pas de test point à `cy=0` sur série mixte (AC8) [`category-error-curves.test.tsx`]
- [x] [Review][Patch] Pas de test d'interaction tooltip catégorie (hover/focus) [`category-error-curves.interaction.test.tsx`]
- [x] [Review][Patch] Pas de test reset C-only au changement `history` sans remount [`presentation-charts-row.interaction.test.tsx`]
- [x] [Review][Patch] Pas de test session reset au niveau `PresentationMode` [`presentation-mode.test.tsx`]
- [x] [Review][Patch] Hauteur fixe du tooltip peut clipper les noms longs [`category-error-curves.tsx:713`]
- [x] [Review][Patch] Tooltip tactile disparaît immédiatement au `touchend` [`category-error-curves.tsx:943`]
- [x] [Review][Defer] ESLint `set-state-in-effect` sur `GlobalSuccessCurve` hover reset — deferred, pre-existing [`global-success-curve.tsx:141`]
