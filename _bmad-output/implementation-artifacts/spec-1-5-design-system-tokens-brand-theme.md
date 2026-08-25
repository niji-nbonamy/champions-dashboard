---
title: '1-5 Design System Tokens & Brand Theme'
type: 'feature'
created: '2026-08-25'
status: 'done'
review_loop_iteration: 0
baseline_commit: '2a90637c8e5c4cc271c595c9a37b65f4fca2d2b3'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-testBMAD-2026-08-24/DESIGN.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The app still uses default shadcn neutral theme (black primary, Geist fonts) — none of the CHAMPIONS Menthe Douce brand tokens, level-badge colors, or typography/spacing primitives from DESIGN.md are wired into Tailwind or components.

**Approach:** Replace `:root` CSS variables and `@theme inline` registrations in `globals.css` with Theme C values from DESIGN.md, load DM Sans for display typography, add canonical token constants for tests, extend Button with an accent-outline variant, and ship minimal `LevelBadge` + typography utilities so existing auth/onboarding pages visibly reflect the brand.

## Boundaries & Constraints

**Always:**
- Theme C Menthe Douce: primary `#059669`, accent `#7C3AED`, promotion-ready `#2563EB`, trend-up/down/flat, four level-badge color pairs exactly as DESIGN.md (UX-DR1, UX-DR2).
- Typography: DM Sans Light (300) for display titles (`text-display` 28px, `text-display-sm` 20px); monospace `text-data-lg` (32px/600) for numeric highlights (UX-DR3).
- Spacing tokens exposed as CSS vars / Tailwind theme: `grid-cell-min` 44px, `grid-row-height` 40px, `app-bar-min-height` 64px, logo heights 52/40/44px (UX-DR4).
- No orange hex values in any UI token, theme registration, or design constant — school logo asset may retain orange when added in story 1.6 (UX-DR1).
- Primary `Button` default variant = mint fill (`bg-primary`); new `accent` variant = transparent fill + violet border (UX-DR7).
- Tailwind v4 `@theme inline` pattern — extend existing `globals.css`, do not add legacy `tailwind.config.js`.
- Token source of truth: DESIGN.md hex values; `lib/design/tokens.ts` mirrors them for unit tests only.

**Ask First:**
- Switching body/UI sans from system/Geist to DM Sans globally (spec limits DM Sans to display roles only).
- Adding dark-mode token overrides beyond fixing obvious contrast breaks.
- Introducing additional shadcn components beyond Button + LevelBadge preview.

**Never:**
- Build app shell, tabs, app bar, or school logo placement (story 1.6).
- French microcopy sweep on auth pages (NFR14 — separate pass; do not change login/register strings here).
- Promotion banner, grid cell, or presentation highlight components (later epics).
- Orange anywhere in `:root`, `@theme`, `tokens.ts`, or component class maps.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Primary color applied | Any page using `bg-primary` / default Button | Computed color matches `#059669` mint | N/A |
| Accent outline button | `<Button variant="accent">` | Violet border `#7C3AED`, transparent background | N/A |
| Level badge variant | `<LevelBadge level="green" />` | Pill with `#4CAF50` bg and `#0A2E0C` foreground | Invalid level → TypeScript error at compile time |
| Display typography | Element with `text-display` | DM Sans 28px weight 300 | Font load failure falls back to Outfit/system per DESIGN.md |
| No orange tokens | Scan `tokens.ts` + `globals.css` theme vars | Zero matches for orange hues (`#F97316`, `#EA580C`, `#FF8C00`, `orange`) | Test fails CI |
| Existing buttons unchanged API | Login/register/class forms submit | Still use default Button; visually mint without code changes | N/A |

</frozen-after-approval>

## Code Map

- `champions-app/app/globals.css` -- **MODIFY** replace default shadcn neutral `:root` values with Theme C; add `--level-*`, `--promotion-ready`, `--trend-*`, spacing vars; register Tailwind colors (`--color-level-yellow`, etc.), spacing (`--spacing-grid-cell-min`), typography utilities in `@theme inline`. [`globals.css:51`](../../champions-app/app/globals.css#L51)
- `champions-app/lib/design/tokens.ts` -- **CREATE** exported hex constants mirroring DESIGN.md `colors`, `spacing`, `typography` keys — test anchor, not runtime styling source.
- `champions-app/lib/design/tokens.test.ts` -- **CREATE** assert canonical hex values; assert no orange in token set; assert primary/accent/promotion-ready exact match.
- `champions-app/app/layout.tsx` -- **MODIFY** load `DM_Sans` (weights 300, 400) via `next/font/google` as `--font-display`; keep `Geist_Mono` or system mono as `--font-geist-mono` for `text-data-lg`. [`layout.tsx:5`](../../champions-app/app/layout.tsx#L5)
- `champions-app/components/ui/button.tsx` -- **MODIFY** add `accent` variant: `border-accent text-accent bg-transparent hover:bg-accent/10`. [`button.tsx:10`](../../champions-app/components/ui/button.tsx#L10)
- `champions-app/components/ui/button.test.tsx` -- **UPDATE** cover `accent` variant classes; verify default still uses `bg-primary`.
- `champions-app/components/ui/level-badge.tsx` -- **CREATE** pill badge with `level` prop (`yellow` | `green` | `violet` | `gold`); maps to `bg-level-* text-level-*-foreground`.
- `champions-app/components/ui/level-badge.test.tsx` -- **CREATE** render each variant; assert level color classes present.
- `champions-app/app/globals.css` (typography layer) -- **ADD** utility classes `.text-display`, `.text-display-sm`, `.text-data-lg` in `@layer utilities` using theme tokens.
- `_bmad-output/planning-artifacts/ux-designs/ux-testBMAD-2026-08-24/DESIGN.md` -- **READ-ONLY** canonical Theme C values. [`DESIGN.md:6`](../../_bmad-output/planning-artifacts/ux-designs/ux-testBMAD-2026-08-24/DESIGN.md#L6)
- `champions-app/app/(auth)/login/page.tsx` -- **OPTIONAL READ** apply `text-display` on `<h1>` only — demonstrates typography without copy changes. [`page.tsx:24`](../../champions-app/app/(auth)/login/page.tsx#L24)
- `champions-app/components.json` -- **READ** shadcn cssVariables mode; tokens stay in globals.css. [`components.json:6`](../../champions-app/components.json#L6)

## Tasks & Acceptance

**Execution:**
- [x] `champions-app/lib/design/tokens.ts` -- Export DESIGN.md color/spacing constants -- canonical test reference.
- [x] `champions-app/lib/design/tokens.test.ts` -- Unit tests for hex values and no-orange guard -- prevents token drift.
- [x] `champions-app/app/globals.css` -- Wire Theme C CSS variables + `@theme inline` registrations + typography utilities -- core token delivery.
- [x] `champions-app/app/layout.tsx` -- Load DM Sans display font variable -- UX-DR3 display typography.
- [x] `champions-app/components/ui/button.tsx` -- Add `accent` outline variant -- UX-DR7 accent buttons.
- [x] `champions-app/components/ui/button.test.tsx` -- Test accent variant and primary mint classes -- regression guard.
- [x] `champions-app/components/ui/level-badge.tsx` + `level-badge.test.tsx` -- Four CHAMPIONS level badge variants -- UX-DR2 deliverable.
- [x] `champions-app/app/(auth)/login/page.tsx` -- Apply `text-display` to page title -- visible token smoke test on existing page.

**Acceptance Criteria:**
- Given the shadcn/ui base theme is installed, when any page renders, then CSS tokens implement Theme C: primary `#059669`, accent `#7C3AED`, promotion-ready `#2563EB`, trend-up/down/flat, and four level-badge colors (UX-DR1, UX-DR2).
- Given display typography is configured, when an element uses `text-display` or `text-data-lg`, then DM Sans Light applies to display roles and monospace 32px/600 applies to data highlights (UX-DR3).
- Given spacing tokens are defined, when Tailwind utilities reference `min-h-grid-row-height` or CSS vars `--spacing-grid-cell-min`, then values are 44px cell min, 40px row height, 64px app-bar min (UX-DR4).
- Given the token set, when scanning theme sources, then no orange appears in any UI token (UX-DR1).
- Given Button variants, when using default vs `accent`, then primary buttons use mint fill and accent buttons use violet outline (UX-DR7).

## Design Notes

Map DESIGN.md hex to CSS custom properties using literal hex or oklch — shadcn expects `--primary`, `--accent`, etc. on `:root`. Level colors use a separate namespace (`--level-yellow`, …) registered as `--color-level-yellow` in `@theme inline` for `bg-level-yellow` utilities.

```css
:root {
  --primary: #059669;
  --primary-foreground: #ffffff;
  --accent: #7c3aed;
  --accent-foreground: #ffffff;
  --level-yellow: #f5d547;
  /* ... */
}
```

`LevelBadge` is intentionally minimal (span + CVA) — full dossier/grid usage ships in later epics; this story only proves tokens compose correctly.

## Verification

**Commands:**
- `cd champions-app && npm test` -- expected: tokens, button, level-badge tests pass.
- `cd champions-app && npm run build` -- expected: production build succeeds with DM Sans font loading.

**Manual checks (if no CLI):**
- Open `/login` — title uses DM Sans Light; submit button is mint green, not default black/gray primary.
- Inspect `:root` in devtools — `--primary` resolves to `#059669`; no orange in computed theme variables.

## Suggested Review Order

**Theme C CSS tokens**

- Theme C mint/violet palette replaces default shadcn neutral variables
  [`globals.css:72`](../../champions-app/app/globals.css#L72)

- Level, promotion, trend, and spacing vars registered for Tailwind utilities
  [`globals.css:7`](../../champions-app/app/globals.css#L7)

**Typography**

- DM Sans loaded for display roles; body stays on Geist sans
  [`layout.tsx:10`](../../champions-app/app/layout.tsx#L10)

- Display and data-lg utility classes for titles and numeric highlights
  [`globals.css:172`](../../champions-app/app/globals.css#L172)

**Components**

- Accent outline button variant for violet secondary actions
  [`button.tsx:14`](../../champions-app/components/ui/button.tsx#L14)

- Minimal LevelBadge mapping four CHAMPIONS level colors
  [`level-badge.tsx:6`](../../champions-app/components/ui/level-badge.tsx#L6)

**Canonical constants & smoke test**

- DESIGN.md hex mirror for drift detection in tests
  [`tokens.ts:7`](../../champions-app/lib/design/tokens.ts#L7)

- Login title uses `text-display` as visible token smoke test
  [`page.tsx:24`](../../champions-app/app/(auth)/login/page.tsx#L24)

**Tests**

- Token, button, level-badge, and auth page coverage
  [`tokens.test.ts:33`](../../champions-app/lib/design/tokens.test.ts#L33)
