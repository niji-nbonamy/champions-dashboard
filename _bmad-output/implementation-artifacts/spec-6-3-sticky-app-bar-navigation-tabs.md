---
title: '6-3 Sticky App Bar & Navigation Tabs'
type: 'feature'
created: '09-01-2026'
status: 'done'
baseline_commit: 'de1b837284be553a2604df1e31a966dba8bf30fd'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-6-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** On long dashboard pages (roster, dictation grid, student dossier, Alertes queue), the app bar and G1 tabs scroll out of view. Teachers must scroll back to the top to switch sections, breaking daily workflow rhythm (FR48, UX-DR32).

**Approach:** Make the shared dashboard chrome sticky at the top of the viewport in `dashboard-chrome.tsx` — AppBar always, NavTabs when visible (`md+`). Preserve single-document scroll (no nested scroll containers). Add a shell-height design token and `scroll-margin-top` on Config page anchors deferred from Story 6.1.

## Boundaries & Constraints

**Always:**
- AppBar remains visible at the top while page content scrolls on all dashboard routes (FR48, UX-DR32).
- G1 tabs (Dictées · Élèves · Config · Alertes) remain visible below AppBar while scrolling on viewports where tabs are shown today (`hidden md:block` — unchanged breakpoint) (FR48, UX-DR32).
- Mobile (`< md`): AppBar sticky; G1 tabs stay hidden — dictation-capture-only behavior unchanged (UX-DR13).
- Presentation mode (`pathname.endsWith("/present")`): no AppBar, no NavTabs — existing `hideChrome` branch untouched (UX-DR16).
- Single vertical scroll on `body`/document — no `h-screen overflow-hidden` wrapper that creates double scrollbars.
- Active tab styling (`border-primary text-primary`, `aria-current="page"`) and CHAMPIONS wordmark sizing tokens unchanged (UX-DR5, UX-DR12).
- Shell z-index above grid column sticky headers (`class-grid.tsx` uses `z-10`); use `z-20` or higher on chrome wrapper.
- Config anchors `#liste-eleves` and `#matrice-mots` get `scroll-margin-top` matching sticky shell height so deep links from Story 6.1 « Aller à Config » land correctly.

**Ask First:**
- Changing NavTabs visibility breakpoint from `md` (768px) to `lg` (1024px) to match epic prose — would alter Story 1.6 tablet behavior.

**Never:**
- Modify `presentation-mode.tsx`, `MobileRouteGuard`, or presentation `hideChrome` logic.
- Add per-page shell wrappers — chrome is centralized in `dashboard-chrome.tsx` only.
- Change badge counts, tab labels, sign-out, or auth layout wiring.
- Alter grid horizontal sticky columns or scoring/save flows.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Long laptop page | Authenticated, viewport ≥ md, scroll roster/grid/dossier/alerts | AppBar + NavTabs stay at viewport top; content scrolls underneath; no layout jump | N/A |
| Long mobile hub | Viewport < md, `/dictations` hub | AppBar sticky at top; no NavTabs in DOM flow | N/A |
| Presentation mode | `/students/[id]/present` | No AppBar, no NavTabs, no sticky shell classes | N/A |
| Tab switch | Click Élèves while scrolled mid-page | New page loads; chrome still sticky; active tab highlight correct | N/A |
| Config deep link | Navigate to `/config#matrice-mots` | Section heading visible below sticky shell, not hidden under it | N/A |
| Grid horizontal scroll | Dictation grid with many columns | Column `sticky left-0 z-10` still works; does not overlap shell | N/A |

</frozen-after-approval>

## Code Map

- `champions-app/components/dashboard/dashboard-chrome.tsx` — **primary change** L27-37: wrap AppBar + NavTabs in `sticky top-0 z-20` (or equivalent); keep L20-24 presentation branch read-only; preserve `hidden md:block` on NavTabs wrapper L30.
- `champions-app/components/dashboard/app-bar.tsx` — **read-only**: L7-12 `min-h-[var(--spacing-app-bar-min-height)]`, wordmark, sign-out; ensure `bg-background` on sticky ancestor covers content scrolling beneath.
- `champions-app/components/dashboard/nav-tabs.tsx` — **read-only**: L29-32 nav wrapper, L46-50 active tab classes; sticky applied via parent wrapper, not here.
- `champions-app/lib/design/tokens.ts` — **add**: `dashboardChromeHeight` token (app bar min-height + nav tabs row height) for scroll-margin and tests; mirror in `globals.css` L119-124.
- `champions-app/lib/design/tokens.test.ts` — **update**: assert new token value.
- `champions-app/app/(dashboard)/config/page.tsx` — **update**: L45 `#liste-eleves`, L59 `#matrice-mots` — add `scroll-margin-top` using shell token (closes 6.1 deferral).
- `champions-app/components/grid/class-grid.tsx` — **read-only**: L395/L420 `sticky left-0 z-10` — verify no z-index conflict after shell change.
- `champions-app/components/dashboard/dashboard-chrome.test.tsx` — **update**: assert sticky/fixed classes on chrome wrapper; presentation and mobile tab-hiding tests L28-57 must still pass.
- `champions-app/components/dashboard/dashboard-shell.test.tsx` — **read-only unless** shell propagates new classes.
- `champions-app/app/(dashboard)/config/page.test.tsx` — **update if exists**: scroll-margin on anchor sections.
- `spec-1-6-app-shell-with-navigation-app-bar.md` — behavioral contract for tab visibility breakpoints and wordmark tokens.

## Tasks & Acceptance

**Execution:**
- [x] `champions-app/components/dashboard/dashboard-chrome.tsx` — wrap AppBar + conditional NavTabs in sticky top-0 container with `z-20` and `bg-background`; keep single flex column layout without nested overflow scroll — centralizes FR48 behavior for all dashboard pages.
- [x] `champions-app/lib/design/tokens.ts` + `champions-app/app/globals.css` — add `--spacing-dashboard-chrome-height` (and `md` variant if shell height differs when tabs hidden) for scroll-margin and documentation — supports Config anchor offset.
- [x] `champions-app/lib/design/tokens.test.ts` — assert new spacing token(s).
- [x] `champions-app/app/(dashboard)/config/page.tsx` — apply `scroll-margin-top` to `#liste-eleves` and `#matrice-mots` using shell token — resolves deferred 6.1 deep-link gap.
- [x] `champions-app/components/dashboard/dashboard-chrome.test.tsx` — assert chrome wrapper has sticky positioning and `z-20`; confirm presentation route L41-57 and `hidden md:block` L28-38 still hold.
- [x] `champions-app/components/dashboard/dashboard-chrome.test.tsx` or `config/page.test.tsx` — assert Config anchor sections include scroll-margin class/token reference.

**Acceptance Criteria:**
- Given I am authenticated on a laptop viewport (≥ 1024px), when I scroll a long dashboard page (Élèves roster, dictation grid, student dossier, Alertes queue), then the app bar remains fixed at the top of the viewport (FR48, UX-DR32) and the G1 tab navigation remains visible directly below or within the fixed shell (FR48, UX-DR32), and page content scrolls underneath without layout jump or double scrollbars.
- Given I am on mobile (< 768px), when I use the dictation hub (Story 5.1), then the mobile app bar remains fixed at the top during scroll (FR48, UX-DR32) and G1 tabs remain hidden — mobile dictation-capture-only behavior is unchanged (UX-DR13).
- Given I open presentation mode (Story 4.7), when the full-screen RDV parents view is active, then no dashboard app bar or G1 tabs are shown — presentation chrome rules unchanged (UX-DR16).
- Given the sticky shell is applied, when I switch tabs or navigate between pages, then the active tab highlight and CHAMPIONS wordmark sizing follow existing tokens (UX-DR5, UX-DR12).

### Review Findings

- [x] [Review][Patch] Assert scroll-mt on both Config anchor sections [`config/page.test.tsx:87`]
- [x] [Review][Patch] Mirror new spacing CSS variables in globals test [`tokens.test.ts:92`]
- [x] [Review][Defer] E2E scroll-time stickiness (bounding-box after scroll) — static class tests sufficient for MVP
- [x] [Review][Defer] Responsive mobile scroll-mt on Config anchors — `/config` blocked on mobile by `MobileRouteGuard`
- [x] [Review][Defer] `dashboardChromeHeight` literal vs CSS calc drift — mitigated by globals mirror test
- [x] [Review][Defer] NavTabs multi-row wrap exceeding 41px token — typical tab bar is single row at md+

## Design Notes

Prefer `position: sticky; top: 0` on a single chrome wrapper over `position: fixed` — sticky keeps the shell in document flow, avoiding padding-top compensation and layout jump:

```tsx
<div className="sticky top-0 z-20 bg-background">
  <AppBar />
  <div className="hidden md:block"><NavTabs ... /></div>
</div>
```

Nav tabs row height is ~40px (`py-2` links + border); shell token can be `calc(var(--spacing-app-bar-min-height) + var(--spacing-nav-tabs-height))` with a dedicated `--spacing-nav-tabs-height` (~41px) for precision.

## Verification

**Commands:**
- `cd champions-app && npm test -- --run dashboard-chrome dashboard-shell app-bar nav-tabs tokens` — expected: all pass including new sticky assertions
- `cd champions-app && npm run build` — expected: no type or lint errors

**Manual checks (if no CLI):**
- Open Élèves roster or dictation grid on laptop; scroll down — AppBar and tabs stay visible; switch to Config tab without scrolling up.
- Open `/dictations` on mobile viewport — AppBar stays visible while scrolling hub; no tab bar.
- Open student presentation mode — no dashboard chrome.

## Suggested Review Order

**Sticky shell**

- Single sticky wrapper keeps AppBar and NavTabs fixed without layout jump.
  [`dashboard-chrome.tsx:29`](../../champions-app/components/dashboard/dashboard-chrome.tsx#L29)

**Design tokens**

- Shell height tokens support scroll-margin and future offset needs.
  [`tokens.ts:33`](../../champions-app/lib/design/tokens.ts#L33)

- CSS variables mirror TS tokens for runtime scroll-margin.
  [`globals.css:128`](../../champions-app/app/globals.css#L128)

**Config deep links**

- Anchor sections offset below sticky chrome for Story 6.1 links.
  [`page.tsx:45`](../../champions-app/app/(dashboard)/config/page.tsx#L45)

**Tests**

- Sticky classes and presentation exception pinned.
  [`dashboard-chrome.test.tsx:39`](../../champions-app/components/dashboard/dashboard-chrome.test.tsx#L39)

- Both anchor sections assert scroll-margin class twice.
  [`page.test.tsx:87`](../../champions-app/app/(dashboard)/config/page.test.tsx#L87)

- New spacing variables verified in globals.css.
  [`tokens.test.ts:92`](../../champions-app/lib/design/tokens.test.ts#L92)

## Spec Change Log
