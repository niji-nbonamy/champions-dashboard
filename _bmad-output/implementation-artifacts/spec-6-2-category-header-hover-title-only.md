---
title: '6-2 Category Header Hover — Title Only'
type: 'feature'
created: '09-01-2026'
status: 'done'
baseline_commit: '25dc84ea6df7532cc09d09e7b6aa16096d7f2ad2'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-6-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** During fast grid entry, CHAMPIONS column header tooltips show the full category definition paragraph alongside the name (e.g. « Conjugaison — Les verbes sont-ils correctement conjugués ? »). The verbose text slows scanning and clutters hover/tap interactions without helping experienced teachers who already know the letters.

**Approach:** Change `CategoryHeader` so hover, tap, and accessible labels expose the category name only (e.g. « Conjugaison »). Full definitions remain in `error-categories.ts` and reference documentation — they are not surfaced in the grid header interaction. Preserve existing header colors, tap-toggle, Escape dismiss, and hover CSS behavior.

## Boundaries & Constraints

**Always:**
- Tooltip popover, `title`, and `aria-label` on each CHAMPIONS header (C–S) show `category.name` only — no definition text anywhere in the header hover/tap interaction (FR16).
- `CHAMPIONS_ERROR_CATEGORIES[].definition` stays in the domain module and `error-categories.md` for reference — do not delete definitions from constants.
- Header background/foreground colors, letter display, tap-to-toggle, Escape dismiss, and `group-hover:opacity-100` behavior unchanged from Story 3.2.
- Cell `aria-label` format (« {displayName}, {catégorie}, {valeur} erreurs ») and row-major keyboard navigation through grid cells unchanged (UX-DR25, Story 3.2).
- Column headers remain outside row-major Tab order (cells only); name-only `aria-label` satisfies assistive-tech header identification.

**Ask First:**
- Adding `tabIndex={0}` on headers to put them in Tab order — would conflict with Story 3.2 row-major cell navigation.

**Never:**
- Change scoring, validation, save flow, promotion cells, or mobile dictation forms.
- Remove `definition` fields from `error-categories.ts`.
- Surface definition paragraphs in any grid header channel (popover, `title`, `aria-label`, visible text).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Hover header | Mouse over column C | Tooltip shows « Conjugaison » only; definition text absent | N/A |
| Tap header | Click/tap column C on touch device | Popover opens with name only; `aria-expanded` true | N/A |
| Escape dismiss | Tooltip open via tap | Escape closes popover; `aria-expanded` false | N/A |
| All nine categories | Grid rendered | Each header tooltip/label uses name only; 9 `[role="tooltip"]` elements | N/A |
| Screen reader | Header inspected | `aria-label` equals category name, no definition clause | N/A |
| Cell navigation | Tab through grid cells | Tab order unchanged; cells still receive focus in row-major order | N/A |

</frozen-after-approval>

## Code Map

- `champions-app/components/grid/category-header.tsx` — **primary change**: L16 `tooltipText` currently `${category.name} — ${category.definition}`; L37–38 `title`/`aria-label`; L64–65 popover renders name + definition paragraph — remove definition from all three.
- `champions-app/components/grid/class-grid.tsx` — **read-only**: L399–401 mounts `CategoryHeader` per category; L444–475 `GridCell` passes `categoryName` only (unchanged).
- `champions-app/components/grid/class-grid.test.tsx` — **update**: L471–488 asserts definition in `textContent` (L484–486); L490–544 tap/hover/Escape tests — keep behavior, assert name-only content.
- `champions-app/lib/domain/error-categories.ts` — **read-only**: L20–87 `CHAMPIONS_ERROR_CATEGORIES` source of `name` + `definition`; L106–112 `formatGridCellAriaLabel` uses `categoryName` only.
- `champions-app/lib/domain/error-categories.test.ts` — **read-only**: category constant tests; no tooltip assertions.
- `_bmad-output/specs/spec-dashboards-dictees-champions-ce2/error-categories.md` — reference doc for full definitions outside grid (FR16).
- `spec-3-2-class-grid-ui-with-keyboard-navigation-a2.md` — behavioral contract for keyboard nav and header colors to preserve.

## Tasks & Acceptance

**Execution:**
- [x] `champions-app/components/grid/category-header.tsx` — set `tooltipText` to `category.name` only; remove definition `<p>` from popover (L65); keep single name paragraph and existing hover/tap/Escape mechanics.
- [x] `champions-app/components/grid/class-grid.test.tsx` — update L471–488: assert `title`/`aria-label` contain category name, do **not** contain definition text; assert tooltip `textContent` has name, lacks definition sentence; keep L490–544 interaction tests passing.
- [x] `champions-app/components/grid/category-header.tsx` or `class-grid.test.tsx` — add assertion that `aria-label` for column C equals « Conjugaison » (exact or `toBe`) to lock name-only accessible label.

**Acceptance Criteria:**
- Given I am viewing the class grid on a dictation (Story 3.2), when I hover or tap a CHAMPIONS column header (C–S), then a tooltip or popover shows the category name only (e.g. « Conjugaison ») — no definition paragraph (FR16).
- Given I need the full category definition, when I consult reference material outside the grid, then definitions remain available in `error-categories.md` and project documentation — the grid does not surface them (FR16).
- Given I use keyboard navigation on the grid, when a screen reader or assistive tech reads a column header, then the accessible label is the category name only (UX-DR25, NFR13); row-major Tab order through cells is unchanged.

### Review Findings

- [x] [Review][Decision] Popover CSS layout tweak vs Story 3.2 preserve constraint — **Resolved: A** — keep compact centered popover (`w-max whitespace-nowrap text-center px-2 py-1`) and commit with story.

- [x] [Review][Patch] Assert name-only tooltip for all 9 category headers [`class-grid.test.tsx:471`]
- [x] [Review][Patch] Assert name-only tooltip content on hover path [`class-grid.test.tsx:539`]
- [x] [Review][Patch] Commit or drop uncommitted popover CSS before merge [`category-header.tsx:58`]
- [x] [Review][Patch] Pin popover layout classes in tests if CSS tweak is kept (depends on Decision above) [`class-grid.test.tsx:471`]

- [x] [Review][Defer] `ux-decisions.md` still documents name+definition hover [`_bmad-output/specs/spec-dashboards-dictees-champions-ce2/ux-decisions.md:18`] — deferred, pre-existing doc drift
- [x] [Review][Defer] Native `title` + custom popover double-tooltip risk [`category-header.tsx:37`] — deferred, pre-existing Story 3.2 pattern
- [x] [Review][Defer] No dedicated `category-header.test.tsx` — deferred, integration coverage sufficient for MVP
- [x] [Review][Defer] `spec-3-2` documents historical name+definition tooltip — deferred, amend when convenient

## Design Notes

Minimal diff — three touch points in one component:

```tsx
const tooltipText = category.name;
// ...
<p className="font-medium">{category.name}</p>
// remove second <p> with category.definition
```

Headers stay non-focusable in Tab order (Story 3.2 contract). The keyboard AC is met via name-only `aria-label` on `<th>` for assistive technologies; tap and hover channels use the same name-only content.

## Verification

**Commands:**
- `cd champions-app && npm test -- --run class-grid` — expected: all grid tests pass including updated tooltip assertions
- `cd champions-app && npm run build` — expected: no type or lint errors

**Manual checks (if no CLI):**
- Open a dictation grid; hover column C — tooltip shows « Conjugaison » without definition; tap header on tablet — same; Tab through cells — order unchanged.

## Spec Change Log

## Suggested Review Order

- Name-only tooltip text on title and aria-label attributes.
  [`category-header.tsx:16`](../../champions-app/components/grid/category-header.tsx#L16)

- Popover content reduced to category name paragraph only.
  [`category-header.tsx:64`](../../champions-app/components/grid/category-header.tsx#L64)

**Tests**

- Locks exact aria-label, title, and tooltip text without definition.
  [`class-grid.test.tsx:480`](../../champions-app/components/grid/class-grid.test.tsx#L480)

- Tap interaction asserts name-only popover content when open.
  [`class-grid.test.tsx:507`](../../champions-app/components/grid/class-grid.test.tsx#L507)
