---
title: '7-2 Global Curve Axis Labels and Y-Axis Scale'
type: 'feature'
created: '09-03-2026'
status: 'done'
baseline_commit: 'a64e004ed373839fd430937acb7c3975b55cd1a1'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-7-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The dossier global success curve (C1 hero and C3 presentation) plots points without dictation names on the X-axis and only shows 0 % / 100 % on the Y-axis, forcing teachers to guess which point is which dictation during parent meetings.

**Approach:** Extend the existing inline-SVG `GlobalSuccessCurve` with readable X-axis dictation labels and a fixed 0–100 % Y-axis scale (ticks every 20 % plus optional horizontal guides). Data path and curve math stay unchanged — presentation only.

## Boundaries & Constraints

**Always:**
- Axis work lives in `GlobalSuccessCurve` only — both C1 (`students/[id]/page.tsx`) and C3 (`presentation-mode.tsx`) consume the same component with no page-level chart changes.
- X-axis labels come from `CurvePoint.label` (already populated by `toCurvePoints`); chronological order unchanged.
- Long labels truncate visually on the axis; full label remains available via native tooltip (`<title>` on axis label or point).
- Y-axis ticks at 0, 20, 40, 60, 80, 100 % with `%` suffix; render faint horizontal guide lines at each tick (same muted stroke as axis borders).
- Curve behavior unchanged: same polyline/point mapping (`percent` 0–100), single-point renders one circle without polyline, empty `points` returns `null`.
- `aria-label` on the SVG describes the curve and dictation count in French (NFR13) — extend if needed but keep the existing phrasing pattern.
- Inline SVG only — no chart library (consistent with Story 4.2).
- French microcopy for any new visible axis text.

**Ask First:**
- Adding a chart library — default **exclude**.
- Changing truncation length or rotation of X labels if layout breaks on real data.

**Never:**
- Category error curves, toggles, or dual-panel layout (Story 7.3).
- Recompute scores or alter `toCurvePoints` / history services.
- Per-category axes or integer error-count Y scale (7.3 scope).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Multi-dictation curve | ≥2 `CurvePoint`s with labels | X-axis shows one label per point; Y ticks 0–100 % every 20 %; polyline + circles unchanged | N/A |
| Single dictation | 1 point | One X label, one circle, no polyline; axis/grid still renders | N/A |
| Long label | Label > ~12 chars | Truncated X-axis text; full label in tooltip | N/A |
| Empty history | `points=[]` | Component returns `null` (unchanged) | N/A |
| C3 presentation | Same points as C1 | Identical axis treatment (component reuse) | N/A |
| Screen reader | SVG focused | `role="img"` + French `aria-label` includes dictation count | N/A |

</frozen-after-approval>

## Code Map

- `champions-app/components/dossier/global-success-curve.tsx` L9–11 — constants `SVG_WIDTH`, `SVG_HEIGHT`, `PADDING`; extend bottom padding if X labels need space (currently `bottom: 32`).
- `champions-app/components/dossier/global-success-curve.tsx` L13–24 — `toChartCoordinates`: keep index-based X mapping; Y still `(1 - percent/100) * chartHeight`.
- `champions-app/components/dossier/global-success-curve.tsx` L71–86 — today only 0 % / 100 % Y labels; replace with loop over `[0,20,40,60,80,100]` for ticks + optional `<line>` guides.
- `champions-app/components/dossier/global-success-curve.tsx` L40–42 — existing `aria-label` pattern to preserve/extend.
- `champions-app/components/dossier/global-success-curve.test.tsx` — extend assertions for X labels, intermediate Y ticks, grid lines, truncation, single-point axes.
- `champions-app/lib/domain/dossier-curve.ts` — **READ ONLY** `CurvePoint.label` source; no changes expected.
- `champions-app/app/(dashboard)/students/[id]/page.tsx` L146–147 — **READ ONLY** passes `curvePoints` to `GlobalSuccessCurve`.
- `champions-app/components/dossier/presentation-mode.tsx` L82–87 — **READ ONLY** same component with taller SVG via `className`; axes inherit automatically.

## Tasks & Acceptance

**Execution:**
- [x] `champions-app/components/dossier/global-success-curve.tsx` — add Y-axis ticks (0, 20, 40, 60, 80, 100 %) with horizontal guide lines; add X-axis dictation labels aligned to point X positions with truncation + tooltip — FR-DOSSIER-1 axis presentation
- [x] `champions-app/components/dossier/global-success-curve.test.tsx` — cover multi-point X/Y labels, single-point layout, truncation tooltip, empty guard, aria-label — regression safety for 7.3 X-axis alignment

**Acceptance Criteria:**
- Given a student dossier with at least two saved dictations, when I view the hero global curve, then the X-axis shows dictation labels and the Y-axis shows ticks at 0, 20, 40, 60, 80, and 100 % with horizontal guide lines, and the global % curve behavior is unchanged.
- Given presentation mode, when the global curve is displayed, then the same axis labels and Y-axis scale apply.
- Given only one dictation, when the curve renders, then a single point is shown with appropriate axis labels and no layout break.
- Given I use a screen reader, when the chart is announced, then the aria-label describes the curve and dictation count.

## Design Notes

Y tick loop (conceptual):

```tsx
const Y_TICKS = [0, 20, 40, 60, 80, 100];
// y = PADDING.top + (1 - tick / 100) * chartHeight
// optional: <line x1={left} x2={right} y1={y} y2={y} className="stroke-border/50" />
```

X labels: place `<text>` at each point's `x`, `y = SVG_HEIGHT - PADDING.bottom + 14`, `textAnchor="middle"`, truncate with ellipsis helper; `<title>{point.label}</title>` for hover.

Increase `PADDING.bottom` (e.g. 40–48) if labels clip — keep `viewBox` stable so C3 height override still works.

## Verification

**Commands:**
- `cd champions-app && npm test -- global-success-curve` — expected: all axis label tests pass
- `cd champions-app && npm test` — expected: full suite green
- `cd champions-app && npm run lint` — expected: no errors

**Manual checks:**
- Open a student dossier with ≥2 dictations: X labels visible under points; Y grid at 20 % steps.
- Open `/students/[id]/present`: same axis treatment on taller chart.
- Single-dictation student: one label, one point, no broken layout.

## Suggested Review Order

**Axis rendering**

- Fixed 0–100 % Y scale with six horizontal guides sharing chart height.
  [`global-success-curve.tsx:72`](../../champions-app/components/dossier/global-success-curve.tsx#L72)

- Dictation labels on X-axis with truncation and native tooltip fallback.
  [`global-success-curve.tsx:139`](../../champions-app/components/dossier/global-success-curve.tsx#L139)

- Bottom padding increased to fit X labels without changing viewBox contract.
  [`global-success-curve.tsx:11`](../../champions-app/components/dossier/global-success-curve.tsx#L11)

**Tests**

- Coordinate alignment and axis coverage guard regressions before story 7.3.
  [`global-success-curve.test.tsx:79`](../../champions-app/components/dossier/global-success-curve.test.tsx#L79)
