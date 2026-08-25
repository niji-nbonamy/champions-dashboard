---
name: CHAMPIONS
description: Visual identity for a primary teacher's CHAMPIONS dictation tracking app — laptop-first grids and dossiers, mobile capture secondary. Theme C (Menthe Douce), École Saint Hermeland logo.
status: final
updated: 2026-08-24
colors:
  # Theme C — Menthe Douce (user choice). No orange anywhere in UI.
  primary: '#059669'
  primary-foreground: '#FFFFFF'
  accent: '#7C3AED'
  accent-foreground: '#FFFFFF'
  # CHAMPIONS level semantics — fixed by pedagogy, not brand decoration
  level-yellow: '#F5D547'
  level-yellow-foreground: '#3D3200'
  level-green: '#4CAF50'
  level-green-foreground: '#0A2E0C'
  level-violet: '#7E57C2'
  level-violet-foreground: '#FFFFFF'
  level-gold: '#FFB300'
  level-gold-foreground: '#3D2800'
  # Promotion readiness — distinct from level-violet and accent
  promotion-ready: '#2563EB'
  promotion-ready-foreground: '#FFFFFF'
  # Trend semantics
  trend-up: '#16A34A'
  trend-down: '#DC2626'
  trend-flat: '#6B7280'
typography:
  display:
    fontFamily: "'DM Sans', 'Outfit', system-ui, sans-serif"
    fontSize: 28px
    fontWeight: '300'
    lineHeight: '1.2'
    letterSpacing: '0.01em'
  display-sm:
    fontFamily: "'DM Sans', 'Outfit', system-ui, sans-serif"
    fontSize: 20px
    fontWeight: '300'
    lineHeight: '1.25'
  data-lg:
    fontFamily: 'ui-monospace, monospace'
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: '-0.02em'
rounded:
  sm: 4px
  md: 6px
  lg: 8px
spacing:
  grid-cell-min: 44px
  grid-row-height: 40px
  # Wordmark is ~1.39:1 (975×700). Size by height; width scales automatically.
  logo-app-bar-height: 52px
  logo-app-bar-height-mobile: 40px
  logo-presentation-height: 44px
  app-bar-min-height: 64px
components:
  button-primary:
    background: '{colors.primary}'
    foreground: '{colors.primary-foreground}'
    radius: '{rounded.md}'
  button-accent:
    background: 'transparent'
    foreground: '{colors.accent}'
    border: '1px solid {colors.accent}'
    radius: '{rounded.md}'
  level-badge-yellow:
    background: '{colors.level-yellow}'
    foreground: '{colors.level-yellow-foreground}'
    radius: '{rounded.full}'
  level-badge-green:
    background: '{colors.level-green}'
    foreground: '{colors.level-green-foreground}'
    radius: '{rounded.full}'
  level-badge-violet:
    background: '{colors.level-violet}'
    foreground: '{colors.level-violet-foreground}'
    radius: '{rounded.full}'
  level-badge-gold:
    background: '{colors.level-gold}'
    foreground: '{colors.level-gold-foreground}'
    radius: '{rounded.full}'
  promotion-banner:
    background: '{colors.promotion-ready}'
    foreground: '{colors.promotion-ready-foreground}'
    radius: '{rounded.md}'
  grid-cell:
    minWidth: '{spacing.grid-cell-min}'
    minHeight: '{spacing.grid-row-height}'
    radius: '{rounded.sm}'
  presentation-highlight:
    fontFamily: '{typography.data-lg.fontFamily}'
    fontSize: '{typography.data-lg.fontSize}'
    fontWeight: '{typography.data-lg.fontWeight}'
  school-logo-app-bar:
    asset: 'imports/logo-ecole-saint-hermeland.png'
    height: '{spacing.logo-app-bar-height}'
    width: 'auto'
    objectFit: 'contain'
    aspectRatio: '975 / 700'
    placement: 'app-bar-left'
  school-logo-app-bar-mobile:
    asset: 'imports/logo-ecole-saint-hermeland.png'
    height: '{spacing.logo-app-bar-height-mobile}'
    width: 'auto'
    objectFit: 'contain'
    placement: 'app-bar-left'
  school-logo-presentation:
    asset: 'imports/logo-ecole-saint-hermeland.png'
    height: '{spacing.logo-presentation-height}'
    width: 'auto'
    objectFit: 'contain'
    placement: 'presentation-bottom-right'
    opacity: '0.85'
---

## Brand & Style

CHAMPIONS is a classroom tool for École Saint Hermeland — used by primary teachers between dictation sessions and before parent meetings. The visual posture is **calm, legible, and encouraging**: mint green primary conveys growth without sportiness; violet accent marks high-stakes moments (parent presentation, wizard steps). Grids and numbers read instantly; decoration never competes with data entry speed.

**Theme C — Menthe Douce** is the chosen direction. **No orange** appears anywhere in the UI — the school logo retains its original colors when displayed, without forcing UI harmony with the logo's orange figure.

The product inherits shadcn/ui defaults wholesale. This DESIGN.md specifies the brand-layer delta — primary, accent, level badges, promotion accent, grid sizing, typography, and school logo placement. Standard shadcn components (`Button`, `Card`, `Dialog`, `Tabs`, `Table`, `Toast`, `Sheet`) inherit shadcn specs except where noted below.

→ Logo asset: [`imports/logo-ecole-saint-hermeland.png`](imports/logo-ecole-saint-hermeland.png) — PNG RGBA, fond transparent, 975×700. Theme preview: [`.working/color-themes-saint-hermeland.html`](.working/color-themes-saint-hermeland.html). Spines win on conflict.

## Colors

- **Primary (`#059669`)** — Mint emerald. Active tab indicator, primary buttons (Enregistrer, Valider, import confirm), focus rings on grid cells. Replaces shadcn `primary`.
- **Accent (`#7C3AED`)** — Violet. Outline buttons for « RDV parents », year-start wizard step CTAs, secondary emphasis. Never used for level badges or grid chrome.
- **Level badges** — Four fixed CHAMPIONS semantics (jaune · vert · violet · or). Exclusive to level dots, badges, matrix column headers. Not repurposed for UI chrome.
- **Promotion ready (`#2563EB`)** — Blue, distinct from `accent` and `level-violet`. D1 banner, D3 ⬆️, D3+ **+** button.
- **Trend tokens** — `trend-up` / `trend-down` / `trend-flat` for presentation-mode delta only.
- **Banned:** Orange in any UI token (user decision). Gradients, per-category color coding (C–S are letters).
- **All other tokens** inherit from shadcn defaults.

## Typography

Body and labels inherit shadcn system sans. Display roles use **DM Sans Light** (fallback Outfit Light, then system-ui) — echoes the thin lowercase of the Saint Hermeland wordmark without sacrificing grid legibility.

- **`display`** — Student name on dossier header, presentation-mode title. 28px weight 300.
- **`data-lg`** — Monospace numerals for presentation highlights (last %, trend delta).

Grid cells use shadcn default body size at regular weight.

## Layout & Spacing

shadcn / Tailwind spacing inherited. Product overrides:

- **App bar** — Min height `{spacing.app-bar-min-height}` (64px). School wordmark left at `{spacing.logo-app-bar-height}` (52px laptop / 40px mobile) — width auto-scales (~72px / ~56px at native aspect ratio) so « Hermeland » stays legible. Subtitle « champions » in muted grey to the right of the logo or below on narrow viewports. Tabs below or inline on wide screens.
- **Class grid** — Cell min `{spacing.grid-cell-min}` (44px), row height `{spacing.grid-row-height}` (40px). Horizontal scroll when viewport < 9 columns + name column.
- **Dossier** — `max-w-4xl` (896px).
- **Presentation mode (C3)** — Full viewport, no chrome. School wordmark fixed bottom-right at `{spacing.logo-presentation-height}` (44px, ~61px wide), `{school-logo-presentation.opacity}` — legible for parents, never overlaps curve or highlights. Safe margin 24px from viewport edges.
- **Mobile per-student form** — Full width, 48px min field height.

## Elevation & Depth

Inherited from shadcn — shadow on dialogs/sheets only. Grids flat. Promotion banner flat `{colors.promotion-ready}` fill. Logo in presentation mode has no shadow.

## Shapes

`{rounded.sm}` grid cells/inputs, `{rounded.md}` cards/buttons, `{rounded.lg}` dialogs. Level badges `{rounded.full}`. Presentation cards `{rounded.lg}`.

## Components

Inherited from shadcn: `Button` (secondary/outline/ghost/destructive), `Card`, `Dialog`, `Sheet`, `Tabs`, `Table`, `Toast`, `DropdownMenu`, `Popover`.

Brand-layer:

- **Button (primary)** — `{colors.primary}` fill. Save, Valider, confirm actions.
- **Button (accent outline)** — `{button-accent}`. « RDV parents », wizard forward steps.
- **School logo (app bar)** — `{school-logo-app-bar}`. All laptop G1 surfaces and mobile hub header. `alt="École Saint Hermeland"`. Not clickable in MVP.
- **School logo (presentation)** — `{school-logo-presentation}`. C3 full-screen only. Bottom-right, does not capture focus or block Fermer.
- **Level badges** — Four variants, pill shape.
- **Promotion banner (D1)** — `{colors.promotion-ready}` bar, Valider / Refuser.
- **Grid cell** — Centered integer, `{spacing.grid-cell-min}`. Destructive border when Σ > word total.
- **Promotion + (D3+)** — Circular `{colors.promotion-ready}`, row end.
- **Presentation highlight** — `{typography.data-lg}` for three factual highlights.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Use `{colors.primary}` mint for everyday actions | Use orange anywhere in UI |
| Use `{colors.accent}` violet for RDV parents and wizard CTAs | Use accent for promotion (use `promotion-ready`) |
| Show school logo in app bar + presentation mode | Stretch, recolor, or crop the logo asset |
| Size logo by height (52px bar / 44px presentation), width auto | Squash/stretch logo or crop the wordmark |
| Keep app bar min-height 64px to fit wordmark | Shrink logo below 40px mobile / 48px laptop |
| Use level badge colors only for CHAMPIONS levels | Color-code error categories C–S |
| DM Sans Light on display titles only | Thin display font in grid cells |
| Monospace `data-lg` in presentation highlights | Show school grade (CE2, CM1, etc.) anywhere in UI |
| | Decorative gradients or illustrations |
