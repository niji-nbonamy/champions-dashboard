---
title: '4-7 Presentation Mode « RDV parents » (C3)'
type: 'feature'
created: '2026-08-31'
status: 'done'
baseline_commit: '5f0a0754ca914456e555c43238d766b817eed2e2'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-4-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-testBMAD-2026-08-24/EXPERIENCE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The student dossier (4.1–4.2) shows curve and history but has no parent-meeting presentation surface. Teachers must mentally assemble last %, trend, and level when orienting a parent — no ~30-second factual snapshot (FR34–FR36, UX-DR16).

**Approach:** Add an accent-outline « RDV parents » entry on the dossier that navigates to a full-screen presentation route. Reuse persisted dictation snapshots and existing dossier visual components; compute trend in domain from stored `globalPercent` values only — no rescoring.

## Boundaries & Constraints

**Always:**
- Route at `app/(dashboard)/students/[id]/present/` per architecture mapping (FR34).
- Full viewport, **no app chrome** (AppBar, NavTabs hidden on `/present` paths) (UX-DR16).
- Dominant global curve; three factual highlights in `text-data-lg` monospace: last dictation %, trend delta, current level badge (FR35, UX-DR11).
- Trend = most recent `globalPercent` minus previous; display « — » when fewer than 2 dictations (FR35, scoring-model.md).
- Trend color: `text-trend-up` / `text-trend-down` / `text-trend-flat` for positive / negative / zero delta.
- Per-category error counts on demand via collapsed table toggle — reuse `DictationHistoryTable` / `CategoryErrorCounts`; factual counts only, no narrative (FR36).
- `PresentationBrandLogo` bottom-right: 44px height, opacity 0.85, 24px margin (UX-DR6) — component already exists, wire it in.
- Focus trapped in presentation shell; Esc or « Fermer » exits back to dossier; screen reader label « Mode RDV parents, {displayName} » using stored student name as-is (UX-DR16, UX-DR25).
- Read persisted snapshots only — never call `calculateGlobalPercent` or promotion services in presentation mode.
- French factual microcopy. No school grade anywhere (NFR8). No student names in server logs (NFR10). No schema changes.
- Archived students: presentation remains viewable (read-only dossier data).

**Ask First:**
- Client-side overlay instead of dedicated `/present/` route — default **exclude** (architecture path + bookmarkable URL).

**Never:**
- Promotion validate/refuse, manual override, or Alertes queue changes (4.3–4.6).
- Pedagogical commentary, per-category percentages, or recomputed scores.
- Mobile presentation layout (laptop-first ≥1024px per epic context).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Open from dossier | Active student with history | Full-screen mode; curve + 3 highlights + logo | N/A |
| Zero dictations | `history.length === 0` | `CurvePlaceholder`; last % « — »; trend « — »; level badge if assigned | N/A |
| Single dictation | 1 entry | Last % shown; trend « — » | N/A |
| Two+ dictations | ≥2 entries (newest-first from service) | Last % = `history[0].globalPercent`; trend = delta vs `history[1]` | N/A |
| Category toggle | User expands collapsed table | Per-dictation C–S error counts visible | N/A |
| Exit Esc | Keydown Escape | Navigate to `/students/[id]` dossier | N/A |
| Exit Fermer | Button click | Same as Esc | N/A |
| Invalid student | Unknown UUID or other class | `notFound()` | Standard 404 |
| Archived student | `archived: true` | Presentation still loads read-only data | N/A |
| Unauthenticated | No session | Redirect `/login` | Same as dossier |

</frozen-after-approval>

## Code Map

- `champions-app/app/(dashboard)/students/[id]/page.tsx` -- **MODIFY** add `Button variant="accent"` link « RDV parents » → `/students/[id]/present` in header zone (near name/level). [`page.tsx:92`](../../champions-app/app/(dashboard)/students/[id]/page.tsx#L92)
- `champions-app/app/(dashboard)/students/[id]/page.test.tsx` -- **MODIFY** assert RDV parents link href and accent variant.
- `champions-app/app/(dashboard)/students/[id]/present/page.tsx` -- **CREATE** server page: auth/scope mirror dossier; load `getClassStudent` + `getStudentDictationHistory`; render `PresentationMode` client shell with props.
- `champions-app/app/(dashboard)/students/[id]/present/page.test.tsx` -- **CREATE** auth redirect, notFound, data passed to presentation component.
- `champions-app/components/dossier/presentation-mode.tsx` -- **CREATE** `"use client"` fullscreen `<dialog>` (pattern from `PromotionDialog`); focus trap via native `showModal()`; Esc/`onCancel` → `router.push` dossier; `aria-label` SR announcement; layout: curve dominant, highlights row, collapsed errors toggle, Fermer button, `PresentationBrandLogo`.
- `champions-app/components/dossier/presentation-mode.test.tsx` -- **CREATE** open state, Esc exit, Fermer navigation, aria-label with full `displayName`, logo present.
- `champions-app/components/dossier/presentation-highlights.tsx` -- **CREATE** three `text-data-lg` cards: last %, trend (with color token), `LevelBadge`.
- `champions-app/components/dossier/presentation-highlights.test.tsx` -- **CREATE** last %, trend « — » when <2 dictations, trend color mapping.
- `champions-app/lib/domain/dossier-presentation.ts` -- **CREATE** `getLastDictationPercent(history)`, `getPresentationTrendDelta(history)` → `number | null` (null → display « — »); operate on newest-first history from service.
- `champions-app/lib/domain/dossier-presentation.test.ts` -- **CREATE** 0/1/2+ dictation cases, delta sign.
- `champions-app/components/dashboard/dashboard-shell.tsx` -- **MODIFY** hide AppBar + NavTabs when pathname ends with `/present` (client wrapper or `usePathname` sub-component) — required for no-chrome AC.
- `champions-app/components/dashboard/dashboard-shell.test.tsx` -- **MODIFY** chrome hidden on present path, visible elsewhere.
- `champions-app/components/dossier/global-success-curve.tsx` -- **MODIFY (optional)** accept `className` for taller presentation curve (e.g. `h-72` or `min-h-[320px]`). Already accepts `className`. [`global-success-curve.tsx:27`](../../champions-app/components/dossier/global-success-curve.tsx#L27)
- `champions-app/components/dossier/dictation-history-table.tsx` -- **REUSE** collapsed per-category errors in presentation toggle section. [`dictation-history-table.tsx:24`](../../champions-app/components/dossier/dictation-history-table.tsx#L24)
- `champions-app/lib/domain/dossier-curve.ts` -- **REUSE** `toCurvePoints` for curve data. [`dossier-curve.ts:10`](../../champions-app/lib/domain/dossier-curve.ts#L10)
- `champions-app/components/dashboard/presentation-brand-logo.tsx` -- **REUSE** fixed bottom-right wordmark. [`presentation-brand-logo.tsx:8`](../../champions-app/components/dashboard/presentation-brand-logo.tsx#L8)
- `champions-app/lib/services/get-student-dictation-history.ts` -- **REUSE** newest-first history with `globalPercent`, `categoryErrors`. [`get-student-dictation-history.ts:51`](../../champions-app/lib/services/get-student-dictation-history.ts#L51)
- `champions-app/lib/domain/student-display-name.ts` -- **READ** `normalizeDisplayName` only; presentation SR label uses full `displayName`.
- `champions-app/components/promotion/promotion-dialog.tsx` -- **READ** `<dialog>` + `showModal()` + `onCancel` pattern for focus trap reference. [`promotion-dialog.tsx:28`](../../champions-app/components/promotion/promotion-dialog.tsx#L28)

## Tasks & Acceptance

**Execution:**
- [x] `champions-app/lib/domain/dossier-presentation.ts` + test -- last % and trend delta from persisted snapshots -- FR35 domain logic.
- [x] `champions-app/components/dossier/presentation-highlights.tsx` + test -- three data-lg highlight cards -- UX-DR11.
- [x] `champions-app/components/dossier/presentation-mode.tsx` + test -- fullscreen shell, focus trap, exit, logo, curve, errors toggle -- UX-DR16.
- [x] `champions-app/app/(dashboard)/students/[id]/present/page.tsx` + test -- server data load + render -- FR34 route.
- [x] `champions-app/components/dashboard/dashboard-shell.tsx` + test -- hide chrome on `/present` -- no app chrome AC.
- [x] `champions-app/app/(dashboard)/students/[id]/page.tsx` + test -- RDV parents accent button link -- C3 entry point.

### Review Findings

- [x] [Review][Patch] Level badge not rendered in `text-data-lg` monospace per UX-DR11 [`presentation-highlights.tsx:48`]
- [x] [Review][Patch] Dialog not closed before navigation on exit [`presentation-mode.tsx:44`]
- [x] [Review][Patch] PresentationMode integration tests missing curve placeholder, highlights, category toggle [`presentation-mode.test.tsx:183`]
- [x] [Review][Defer] Explicit focus restoration on dossier return — browser default on navigation
- [x] [Review][Defer] `pathname.endsWith("/present")` chrome detection — only student presentation route exists
- [x] [Review][Defer] Double accordion UX for category errors — spec required DictationHistoryTable reuse
- [x] [Review][Defer] Defensive sort in dossier-presentation domain — service contract is newest-first
- [x] [Review][Defer] Presentation page document title / metadata — not in AC

- [x] [Review][Decision] Tendance nulle : afficher « Stable » ou « 0 % » ? — **Résolu : garder « Stable »** (choix produit, 2026-08-31)
- [x] [Review][Patch] Remplacer les classes inline par le token `text-data-lg` (UX-DR11) [`presentation-highlights.tsx:17`]
- [x] [Review][Patch] Tester la présence de `GlobalSuccessCurve` quand `history.length > 0` [`presentation-mode.test.tsx:199`]
- [x] [Review][Patch] Vérifier `dialog.close()` avant navigation (Esc / Fermer) [`presentation-mode.test.tsx:120`]
- [x] [Review][Patch] Tester le filtre `isChampionsLevel` sur la page présentation (niveau invalide → `data-level=""`) [`present/page.test.tsx:134`]
- [x] [Review][Patch] Tester le lien « RDV parents » sur dossier d'élève archivé [`page.test.tsx:378`]
- [x] [Review][Patch] Assertion ciblée monospace/data-lg sur `LevelBadge` quand un niveau est défini [`presentation-highlights.test.tsx:35`]
- [x] [Review][Patch] Vérifier l'absence du toggle « Détail par catégorie » quand `history=[]` [`presentation-mode.test.tsx:183`]
- [x] [Review][Patch] Test NFR8 : aucun libellé de niveau scolaire (CE2, CM1…) en mode présentation [`presentation-mode.test.tsx`]
- [x] [Review][Patch] Cleanup `dialog.close()` au démontage du composant [`presentation-mode.tsx:37`]
- [x] [Review][Defer] Flash potentiel du chrome dashboard avant masquage client sur `/present` — [`dashboard-chrome.tsx:20`] — hydratation `usePathname`, impact visuel bref
- [x] [Review][Defer] Test E2E flux dossier → présentation → retour — hors périmètre AC unitaires
- [x] [Review][Defer] Spec Change Log vide après patches de review — hygiène documentation

**Acceptance Criteria:**
- Given I am on a student's dossier, when I tap « RDV parents », then a full-screen presentation mode opens with no app chrome (FR34, UX-DR16).
- Given the student has dictation history, when presentation loads, then the global curve is dominant and three highlights show last %, trend delta, and current level badge in `data-lg` monospace (FR35, UX-DR11).
- Given fewer than 2 dictations, when presentation loads, then trend displays « — » (FR35).
- Given I expand the category errors toggle, when table opens, then per-category C–S counts are shown with no pedagogical narrative (FR36).
- Given presentation mode is open, when I press Esc or tap « Fermer », then I return to the dossier and focus is restored sensibly (UX-DR16).
- Given presentation mode opens, when a screen reader announces the view, then it reads « Mode RDV parents, {displayName} » (UX-DR25).
- Given presentation mode is open, then the CHAMPIONS wordmark appears bottom-right at 44px height with 0.85 opacity and 24px margin (UX-DR6).
- Given any presentation view, then no school grade (CE2, CM1, etc.) appears (NFR8).

## Design Notes

Entry button: `Button variant="accent"` (violet outline per UX-DR7) as `Link` to `/students/[id]/present`. Place in dossier header row beside archive action.

Presentation layout (laptop): vertical stack — student `text-display` name (optional, compact), enlarged curve (`GlobalSuccessCurve` with taller className), horizontal row of three highlight cards, `<details>` wrapping `DictationHistoryTable` for on-demand errors, top-right or bottom « Fermer » outline button.

```tsx
// Trend display helper
const delta = getPresentationTrendDelta(history);
const trendLabel = delta === null ? "—" : delta === 0 ? "Stable" : `${delta > 0 ? "+" : ""}${delta} %`;
const trendClass =
  delta === null ? "" : delta > 0 ? "text-trend-up" : delta < 0 ? "text-trend-down" : "text-trend-flat";
```

Chrome bypass: extract `DashboardChrome` client sub-component using `usePathname()`; when `pathname.endsWith("/present")`, render `{children}` only inside `min-h-screen` wrapper.

## Verification

**Commands:**
- `cd champions-app && npm test` -- expected: dossier-presentation domain, presentation-mode, presentation-highlights, present page, dashboard-shell chrome hide, dossier RDV link tests pass.
- `cd champions-app && npm run build` -- expected: production build succeeds.

**Manual checks (if no CLI):**
- Dossier with 3+ dictations: RDV parents opens fullscreen, no tabs/app bar, curve large, last % and trend match manual calculation.
- Student with 0 dictations: placeholder curve, « — » highlights where applicable, Fermer returns to dossier.
- Esc exits cleanly; wordmark visible bottom-right without overlapping highlights.

## Spec Change Log

- Post-delivery (2026-09-01): Presentation SR label uses full `displayName`; `getStudentFirstName` removed project-wide.

## Suggested Review Order

**Entry point & routing**

- Dossier accent link opens dedicated presentation route.
  [`page.tsx:95`](../../champions-app/app/(dashboard)/students/[id]/page.tsx#L95)

- Server page loads student + history then mounts client shell.
  [`page.tsx:48`](../../champions-app/app/(dashboard)/students/[id]/present/page.tsx#L48)

**Chrome bypass**

- Pathname gate hides AppBar and NavTabs on presentation routes.
  [`dashboard-chrome.tsx:21`](../../champions-app/components/dashboard/dashboard-chrome.tsx#L21)

**Presentation shell (C3)**

- Fullscreen dialog with trap, exit, enlarged curve, category toggle, logo.
  [`presentation-mode.tsx:54`](../../champions-app/components/dossier/presentation-mode.tsx#L54)

**Highlights & domain**

- Trend delta and last % from persisted snapshots only.
  [`dossier-presentation.ts:13`](../../champions-app/lib/domain/dossier-presentation.ts#L13)

- Three data-lg highlight cards including level badge.
  [`presentation-highlights.tsx:15`](../../champions-app/components/dossier/presentation-highlights.tsx#L15)

**Tests**

- Shell integration: placeholder curve, highlights wiring, category toggle.
  [`presentation-mode.test.tsx:183`](../../champions-app/components/dossier/presentation-mode.test.tsx#L183)

- Chrome hidden on `/present`, visible on dossier.
  [`dashboard-shell.test.tsx:94`](../../champions-app/components/dashboard/dashboard-shell.test.tsx#L94)
