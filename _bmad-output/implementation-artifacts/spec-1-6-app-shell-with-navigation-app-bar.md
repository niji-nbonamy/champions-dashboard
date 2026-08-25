---
title: '1-6 App Shell with Navigation & App Bar'
type: 'feature'
created: '2026-08-25'
status: 'done'
review_loop_iteration: 0
baseline_commit: '526f286a5a30217aee287bc85c0eb61626f9020b'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-testBMAD-2026-08-24/DESIGN.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Authenticated teachers with a class reach bare dashboard pages — no app bar, no four-tab navigation, no Saint Hermeland branding. The laptop shell promised in FR41/UX-DR12 is missing despite routes and design tokens existing from stories 1.4–1.5.

**Approach:** Wrap `(dashboard)` layout children in a shared shell: app bar (school wordmark + muted « champions » subtitle) and four `Link`-based tabs (Dictées · Élèves · Config · Alertes) with mint active state. Use existing spacing tokens; client-side navigation via Next.js App Router (no full reload).

## Boundaries & Constraints

**Always:**
- Four tabs map to existing routes: `/dictations`, `/students`, `/config`, `/alerts` (FR41, UX-DR12).
- App bar min-height 64px; logo 52px height laptop (≥1024px), 40px mobile/tablet, width auto, `object-fit: contain` (UX-DR5, UX-DR4).
- Logo `alt="École Saint Hermeland"`; not clickable in MVP (DESIGN.md).
- Subtitle « champions » lowercase, muted (`text-muted-foreground`), beside logo on wide screens or below on narrow (UX-DR5).
- Active tab highlighted with primary mint (`text-primary` + bottom border or equivalent).
- Tab labels and dashboard page headings in French (NFR14) — fix dictations stub English copy.
- Auth/class guards in `(dashboard)/layout.tsx` stay server-side; shell is presentational only.
- Reuse Theme C tokens from story 1.5 — no new color definitions.

**Ask First:**
- School logo PNG missing at `{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-testBMAD-2026-08-24/imports/logo-ecole-saint-hermeland.png` — HALT for user to supply asset before committing a substitute.
- Adding shadcn `Tabs` component vs plain `Link` nav (spec prefers Link + `usePathname`).
- Mobile hub layout (<768px) — out of Epic 5 scope; shell may stack tabs but no G2 hub redesign.

**Never:**
- Presentation mode logo placement (UX-DR6 — Epic 4).
- Roster, dictation grid, or config feature content (Epic 2+).
- Logout button, user menu, or clickable logo.
- Orange in UI tokens (logo asset may retain orange — UX-DR1).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Authenticated dashboard | Teacher with class on `/dictations` | App bar + four tabs visible; Dictées tab active (mint) | N/A |
| Tab navigation | Click « Élèves » | Client navigate to `/students`; Élèves tab active; no full reload | N/A |
| Viewport ≥1024px | Laptop width | Logo 52px h; tabs inline or directly below bar in G1 layout | N/A |
| Viewport 768–1023px | Tablet width | Tabs remain visible; responsive wrap/scroll (UX-DR26) | N/A |
| Unauthenticated | No session | Existing redirect to `/login` — shell not rendered | Unchanged guard |
| No class | Session without class row | Redirect `/onboarding/class` — shell not rendered | Unchanged guard |

</frozen-after-approval>

## Code Map

- `champions-app/app/(dashboard)/layout.tsx` -- **MODIFY** keep auth + `getTeacherClass` guards; wrap `{children}` in new shell instead of bare return. [`layout.tsx:6`](../../champions-app/app/(dashboard)/layout.tsx#L6)
- `champions-app/app/(dashboard)/layout.test.tsx` -- **UPDATE** expect shell wrapper when guards pass; preserve redirect tests. [`layout.test.tsx:46`](../../champions-app/app/(dashboard)/layout.test.tsx#L46)
- `champions-app/components/dashboard/dashboard-shell.tsx` -- **CREATE** client layout: app bar + `NavTabs` + `{children}` slot; `min-h-screen flex flex-col`.
- `champions-app/components/dashboard/app-bar.tsx` -- **CREATE** logo (`next/image`), subtitle « champions », `min-h-app-bar-min-height` header with border-b.
- `champions-app/components/dashboard/nav-tabs.tsx` -- **CREATE** client nav: four `Link` entries, `usePathname()` for active mint styling; `aria-current="page"` on active tab.
- `champions-app/components/dashboard/nav-tabs.test.tsx` -- **CREATE** render tabs; assert hrefs, French labels, active class on matching path.
- `champions-app/components/dashboard/app-bar.test.tsx` -- **CREATE** assert logo alt, height utility classes, subtitle text.
- `champions-app/public/logo-ecole-saint-hermeland.png` -- **CREATE** copy from DESIGN.md imports path (975×700 RGBA); required runtime asset.
- `champions-app/app/(dashboard)/dictations/page.tsx` -- **MODIFY** French heading « Dictées » (replaces English « Dashboard »). [`page.tsx:5`](../../champions-app/app/(dashboard)/dictations/page.tsx#L5)
- `champions-app/app/globals.css` -- **READ** spacing tokens `--spacing-logo-app-bar-height`, `--spacing-app-bar-min-height` already registered. [`globals.css:119`](../../champions-app/app/globals.css#L119)
- `champions-app/lib/design/tokens.ts` -- **READ** `SPACING.logoAppBarHeight` for test assertions. [`tokens.ts:29`](../../champions-app/lib/design/tokens.ts#L29)
- `champions-app/app/(dashboard)/students/page.tsx` -- **READ** stub page pattern; headings already French. [`page.tsx:5`](../../champions-app/app/(dashboard)/students/page.tsx#L5)

## Tasks & Acceptance

**Execution:**
- [x] `champions-app/public/logo-ecole-saint-hermeland.png` -- Add school wordmark asset from DESIGN.md imports -- runtime logo source.
- [x] `champions-app/components/dashboard/app-bar.tsx` -- App bar with logo + « champions » subtitle -- UX-DR5.
- [x] `champions-app/components/dashboard/nav-tabs.tsx` -- Four-tab Link navigation with active mint state -- FR41, UX-DR12.
- [x] `champions-app/components/dashboard/dashboard-shell.tsx` -- Compose bar + tabs + children -- shared G1 chrome.
- [x] `champions-app/app/(dashboard)/layout.tsx` -- Wrap children in `DashboardShell` after guards -- shell delivery point.
- [x] `champions-app/app/(dashboard)/dictations/page.tsx` -- French page title -- NFR14 microcopy fix.
- [x] `champions-app/components/dashboard/*.test.tsx` -- Unit tests for bar and tabs -- regression guard.
- [x] `champions-app/app/(dashboard)/layout.test.tsx` -- Update children-render assertion for shell wrapper.

**Acceptance Criteria:**
- Given I am authenticated on a viewport ≥ 1024px, when I view any dashboard page, then the app bar displays the Saint Hermeland wordmark at 52px height (width auto, `object-fit: contain`) with muted « champions » subtitle (UX-DR5).
- Given I am on a dashboard page, when I view the navigation, then four tabs are visible: Dictées · Élèves · Config · Alertes, the active tab uses primary mint color, and tab navigation works without full page reload (FR41, UX-DR12).
- Given viewport 768–1023px, when I view the dashboard, then tabs persist with responsive layout (UX-DR26).
- Given any dashboard UI chrome, when inspecting copy, then tab labels and page headings are in French (NFR14).

## Design Notes

Use `next/link` + `usePathname` in a `"use client"` nav component — App Router client transitions satisfy « no full reload » without adding shadcn Tabs (which are for in-page panels, not route switching).

Logo sizing via Tailwind arbitrary or registered spacing: `h-[var(--spacing-logo-app-bar-height)]` at `lg:` breakpoint, `h-[var(--spacing-logo-app-bar-height-mobile)]` below.

```tsx
const tabs = [
  { href: "/dictations", label: "Dictées" },
  { href: "/students", label: "Élèves" },
  { href: "/config", label: "Config" },
  { href: "/alerts", label: "Alertes" },
] as const;
```

## Verification

**Commands:**
- `cd champions-app && npm test` -- expected: layout, app-bar, nav-tabs tests pass.
- `cd champions-app && npm run build` -- expected: production build with `next/image` logo.

**Manual checks (if no CLI):**
- Log in → land on `/dictations` — see logo, subtitle, four tabs; Dictées active in mint.
- Click each tab — URL changes, content swaps, no white flash full reload.
- Resize to ~800px — tabs still visible and usable.

## Spec Change Log

## Suggested Review Order

**Dashboard shell integration**

- Server layout guard wraps authenticated pages in the shared G1 shell
  [`layout.tsx:24`](../../champions-app/app/(dashboard)/layout.tsx#L24)

- Shell composes app bar, tab nav, and page content slot
  [`dashboard-shell.tsx:6`](../../champions-app/components/dashboard/dashboard-shell.tsx#L6)

**App bar branding**

- Saint Hermeland wordmark and muted champions subtitle with responsive stacking
  [`app-bar.tsx:3`](../../champions-app/components/dashboard/app-bar.tsx#L3)

**Four-tab navigation**

- Client Link tabs with mint active state and keyboard focus ring
  [`nav-tabs.tsx:17`](../../champions-app/components/dashboard/nav-tabs.tsx#L17)

**French microcopy**

- Dictations landing page title and placeholder copy in French
  [`page.tsx:5`](../../champions-app/app/(dashboard)/dictations/page.tsx#L5)

**Assets**

- School wordmark PNG served from public
  [`logo-ecole-saint-hermeland.png`](../../champions-app/public/logo-ecole-saint-hermeland.png)

**Tests**

- Shell composition, nav tabs, app bar, and dictations page coverage
  [`dashboard-shell.test.tsx:28`](../../champions-app/components/dashboard/dashboard-shell.test.tsx#L28)
