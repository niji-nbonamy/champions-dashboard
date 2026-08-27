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
  champions-logo-app-bar:
    asset: 'public/logo-champions-wordmark.jpg'
    height: '{spacing.logo-app-bar-height}'
    width: 'auto'
    objectFit: 'contain'
    aspectRatio: '1024 / 409'
    placement: 'app-bar-left'
  champions-logo-app-bar-mobile:
    asset: 'public/logo-champions-wordmark.jpg'
    height: '{spacing.logo-app-bar-height-mobile}'
    width: 'auto'
    objectFit: 'contain'
    placement: 'app-bar-left'
  champions-landing-hero:
    asset: 'public/logo-champions-method-full.jpg'
    maxWidth: '48rem'
    objectFit: 'contain'
    placement: 'landing-center'
  champions-logo-presentation:
    asset: 'public/logo-champions-wordmark.jpg'
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

- **App bar** — Min height `{spacing.app-bar-min-height}` (64px). CHAMPIONS method wordmark left at `{spacing.logo-app-bar-height}` (52px laptop / 40px mobile) — width auto-scales. No subtitle. Tabs below or inline on wide screens.
- **Class grid** — Cell min `{spacing.grid-cell-min}` (44px), row height `{spacing.grid-row-height}` (40px). Horizontal scroll when viewport < 9 columns + name column.
- **Dossier** — `max-w-4xl` (896px).
- **Presentation mode (C3)** — Full viewport, no chrome. CHAMPIONS wordmark fixed bottom-right at `{spacing.logo-presentation-height}` (44px, width auto), `{champions-logo-presentation.opacity}` — legible for parents, never overlaps curve or highlights. Safe margin 24px from viewport edges.
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
- **CHAMPIONS logo (app bar)** — `{champions-logo-app-bar}`. All laptop G1 surfaces and mobile hub header. `alt="La méthode CHAMPIONS"`. Not clickable in MVP.
- **CHAMPIONS hero (landing)** — `{champions-landing-hero}`. Public `/` only when unauthenticated.
- **CHAMPIONS logo (presentation)** — `{champions-logo-presentation}`. C3 full-screen only. Bottom-right, does not capture focus or block Fermer.
- **Level badges** — Four variants, pill shape.
- **Promotion banner (D1)** — `{colors.promotion-ready}` bar, Valider / Refuser.
- **Grid cell** — Centered integer, `{spacing.grid-cell-min}`. Destructive border when Σ > word total.
- **Promotion + (D3+)** — Circular `{colors.promotion-ready}`, row end.
- **Presentation highlight** — `{typography.data-lg}` for three factual highlights.
- **Password field** — shadcn Input + trailing eye toggle (`aria-label` « Afficher le mot de passe » / « Masquer le mot de passe »).
- **Password requirements** — bordered inset with live checklist (satisfied items use `{colors.primary}`).
- **reCAPTCHA field** — reCAPTCHA v2 widget wrapper for registration only.

## Auth Forms

Registration and login live at `app/(auth)/`. All copy in French (NFR14). Forms use shadcn input styling with `{rounded.sm}` borders.

### Registration (`/register`)

Layout (top → bottom):

1. **Email** — label « Email », required asterisk
2. **Mot de passe** — label « MOT DE PASSE », required; input with visibility toggle (œil) at trailing end
3. **Confirmation du mot de passe** — label « Confirmation du mot de passe », required; same toggle pattern
4. **Password requirements inset** — bordered box (`border border-border`, `{rounded.md}`, padding 12px):
   - Header: « Saisissez un mot de passe comportant au moins : »
   - Bulleted list, each item toggles satisfied/unsatisfied state in real time as user types:
     • 8 caractères · 1 chiffre · 1 minuscule · 1 majuscule · 1 caractère spécial · Correspondance des deux mots de passe
   - Satisfied: bullet/text shifts to `{colors.primary}` (mint); unsatisfied: muted foreground
5. **reCAPTCHA v2** — Google checkbox widget « Je ne suis pas un robot »; centered below inset
6. **Submit** — primary button « Créer mon compte »

### Login (`/login`)

1. **Email** — label « Email »
2. **Mot de passe** — label « MOT DE PASSE »; visibility toggle (œil)
3. **Submit** — primary button « Se connecter »
4. No captcha, no requirements inset

### Password visibility toggle

- Icon button inside input (trailing), `aria-label` « Afficher le mot de passe » / « Masquer le mot de passe »
- Toggles `type="password"` ↔ `type="text"`; does not affect form submission
- Min touch target 44×44px (mobile-friendly)

## Do's and Don'ts

| Do | Don't |
|---|---|
| Use `{colors.primary}` mint for everyday actions | Use orange anywhere in UI |
| Use `{colors.accent}` violet for RDV parents and wizard CTAs | Use accent for promotion (use `promotion-ready`) |
| Show CHAMPIONS logo in app bar + presentation mode | Stretch, recolor, or crop the logo asset |
| Size logo by height (52px bar / 44px presentation), width auto | Squash/stretch logo or crop the wordmark |
| Keep app bar min-height 64px to fit wordmark | Shrink logo below 40px mobile / 48px laptop |
| Use level badge colors only for CHAMPIONS levels | Color-code error categories C–S |
| DM Sans Light on display titles only | Thin display font in grid cells |
| Monospace `data-lg` in presentation highlights | Show school grade (CE2, CM1, etc.) anywhere in UI |
| | Decorative gradients or illustrations |
