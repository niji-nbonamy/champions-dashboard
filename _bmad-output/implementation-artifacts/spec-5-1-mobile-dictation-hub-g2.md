---
title: '5-1 Mobile Dictation Hub (G2)'
type: 'feature'
created: '2026-08-31'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'ec0ad77373582716d88f0b2fd8ee3220e7eedf8f'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-5-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** On viewports below 768px, teachers still see the laptop G1 shell (four tabs, full dictation list, class grid links) — unusable for phone capture and contrary to FR40 / UX-DR13.

**Approach:** Introduce the G2 mobile dictation hub as the home surface below `md` (768px): show the last dictation label and date with « Saisir » and « Voir » shortcuts, keep the existing AppBar wordmark at 40px, hide the G1 tab bar, and block navigation to Élèves / Config / Alertes and the laptop class grid on mobile. Tablet (`768–1023px`) and laptop (`≥1024px`) remain unchanged.

## Boundaries & Constraints

**Always:**
- G2 activates only below `768px` (`md` breakpoint). At `≥768px`, existing G1 routes, `NavTabs`, and `/dictations` list/grid behavior are unchanged.
- Hub displays `listDictations(classId)[0]` label + `formatDictationDateForDisplay` date when at least one dictation exists (FR40).
- Primary actions on hub: « Saisir » → `/dictations/{lastId}/mobile`; « Voir » → `/dictations/{lastId}/mobile/summary` (read-only).
- `AppBar` + `ChampionsWordmark variant="appBar"` retained (40px mobile height, 64px bar — already conformant UX-DR5).
- `NavTabs` hidden below `md` on all dashboard routes except presentation mode (`/present` — existing chrome hide unchanged).
- Mobile users hitting `/students`, `/config`, `/alerts`, or `/dictations/[id]` (class grid) are redirected to `/dictations` (hub). No drawer, no hidden nav to those surfaces.
- Read-only summary (`/mobile/summary`): dictation label, date, completion line « {n} sur {total} élèves saisis » derived from `listLeveledActiveStudents` count vs `getDictationEntriesByDictationId` entry count; when `n === total` and `total > 0`, show « Dictée complète » on hub and summary.
- `/dictations/{id}/mobile` (Saisir target): minimal shell page with back link to hub and heading « Sélectionnez un élève » — student picker and B4 form are story 5.2; do not implement entry fields here.
- French microcopy only. Auth + class scope unchanged (NFR1). No schema changes. No student names in server logs (NFR10).

**Ask First:**
- Whether empty-roster / wizard-blocked states on mobile should mirror G1 CTAs linking to `/students` or `/config` — default **exclude** those links on mobile (static guidance: « Utilisez un ordinateur ou une tablette pour configurer votre classe. »).

**Never:**
- B4 per-student form, quick-tap mode, save path (story 5.2).
- Unleveled-student block UI (story 5.3).
- Full mobile class grid, promotion validate/refuse, dossier, presentation mode below 768px.
- Viewport detection in middleware (no User-Agent gating).
- New DB tables or scoring logic changes.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Hub with dictations | Viewport `<768px`, `listDictations` non-empty | Last dictation label + date; « Saisir » and « Voir » enabled | N/A |
| Hub empty | Viewport `<768px`, zero dictations | Status message « Créez votre première dictée depuis un ordinateur ou une tablette. »; no shortcuts | N/A |
| Hub complete | All leveled active students have entries for last dictation | « Dictée complète » badge on hub | N/A |
| Mobile block | Viewport `<768px`, navigate to `/students` | Client redirect to `/dictations` | N/A |
| Grid block | Viewport `<768px`, navigate to `/dictations/{id}` | Client redirect to `/dictations` | N/A |
| Tablet unchanged | Viewport `≥768px` | G1 tabs + existing dictations list/grid | N/A |
| Summary | Viewport `<768px`, valid last dictation | Read-only label, date, completion counts | Invalid UUID → `notFound()` |

</frozen-after-approval>

## Code Map

- `champions-app/components/dashboard/dashboard-chrome.tsx` -- **MODIFY** wrap `NavTabs` in `hidden md:block` container; keep `AppBar` visible. Pattern: existing `/present` hide at L21–25.
- `champions-app/components/dashboard/dashboard-chrome.test.tsx` -- **CREATE** assert `NavTabs` wrapper has `md:block` / mobile-hide classes; `/present` still hides all chrome.
- `champions-app/components/dashboard/mobile-route-guard.tsx` -- **CREATE** client component: `useEffect` + `matchMedia('(max-width: 767px)')` redirects to `/dictations` when active on blocked paths.
- `champions-app/app/(dashboard)/layout.tsx` -- **MODIFY** mount `MobileRouteGuard` with blocked path prefixes (`/students`, `/config`, `/alerts`, `/dictations/` except hub).
- `champions-app/components/dictations/mobile-dictation-hub.tsx` -- **CREATE** presentational hub: last dictation card, « Saisir » / « Voir » `Button`s, completion badge, empty state.
- `champions-app/components/dictations/mobile-dictation-hub.test.tsx` -- **CREATE** render states: populated, empty, complete.
- `champions-app/lib/services/get-dictation-completion-summary.ts` -- **CREATE** `getDictationCompletionSummary(classId, dictationId)` → `{ enteredCount, totalLeveledCount, isComplete }` using `listLeveledActiveStudents` + `getDictationEntriesByDictationId`.
- `champions-app/lib/services/get-dictation-completion-summary.test.ts` -- **CREATE** count logic, zero students, complete case.
- `champions-app/app/(dashboard)/dictations/page.tsx` -- **MODIFY** split layout: G1 block `hidden md:flex`, G2 hub `md:hidden`; fetch completion summary for last dictation when present.
- `champions-app/app/(dashboard)/dictations/page.test.tsx` -- **MODIFY** assert mobile hub markup rendered alongside hidden G1 section.
- `champions-app/app/(dashboard)/dictations/[id]/mobile/page.tsx` -- **CREATE** Saisir stub shell (back link, heading) — 5.2 extends.
- `champions-app/app/(dashboard)/dictations/[id]/mobile/summary/page.tsx` -- **CREATE** read-only summary page; reuse completion service + date formatter.
- `champions-app/app/(dashboard)/dictations/[id]/mobile/summary/page.test.tsx` -- **CREATE** auth, notFound, completion display.
- `champions-app/lib/services/list-dictations.ts` -- **REUSE** `listDictations` L13–31 for last dictation.
- `champions-app/lib/domain/dictation.ts` -- **REUSE** `formatDictationDateForDisplay`, `isValidUuidV4`.
- `champions-app/components/brand/champions-wordmark.tsx` -- **READ** 40px mobile token already set L12.

## Tasks & Acceptance

**Execution:**
- [x] `champions-app/lib/services/get-dictation-completion-summary.ts` + test -- completion counts for hub/summary -- FR40 completion state without new DB entity.
- [x] `champions-app/components/dictations/mobile-dictation-hub.tsx` + test -- G2 UI shell -- primary mobile home surface.
- [x] `champions-app/components/dashboard/mobile-route-guard.tsx` -- block G1-only routes on mobile -- UX-DR13 capture-only mobile.
- [x] `champions-app/components/dashboard/dashboard-chrome.tsx` + test -- hide `NavTabs` below `md` -- G2 replaces tab bar on phone.
- [x] `champions-app/app/(dashboard)/layout.tsx` -- wire route guard -- enforce mobile surface restrictions.
- [x] `champions-app/app/(dashboard)/dictations/page.tsx` + test -- dual G1/G2 layout on `/dictations` -- hub entry point post-login.
- [x] `champions-app/app/(dashboard)/dictations/[id]/mobile/page.tsx` -- Saisir stub route -- shortcut target for 5.2 picker.
- [x] `champions-app/app/(dashboard)/dictations/[id]/mobile/summary/page.tsx` + test -- « Voir » read-only summary -- FR40 review shortcut.

**Acceptance Criteria:**
- Given I access the app on a viewport `<768px`, when the mobile dictation hub loads, then I see the last dictation label and date (FR40).
- Given the hub loads with a last dictation, when I view the actions, then « Saisir » and « Voir » shortcuts are available and link to the mobile routes (FR40, UX-DR13).
- Given I am on mobile, when the dashboard renders, then the G1 tab bar (Dictées · Élèves · Config · Alertes) is not shown (UX-DR13).
- Given I am on mobile, when I attempt to open Élèves, Config, Alertes, or the class grid, then I am redirected to the dictation hub without drawer navigation.
- Given I am on a viewport `≥768px`, when I use the app, then G1 tabs and existing dictation workflows are unchanged.

## Design Notes

Use CSS visibility (`hidden md:*` / `md:hidden`) for hub vs G1 list — avoids SSR viewport mismatch. Pair with client `MobileRouteGuard` only for deep-link blocking (users bookmarking `/students`).

`getDictationCompletionSummary` counts entries only for leveled active students (same denominator as B4 picker in 5.2) — do not include unleveled or archived students in `totalLeveledCount`.

## Verification

**Commands:**
- `cd champions-app && npm test` -- expected: new hub, guard, chrome, completion service, and summary page tests pass.
- `cd champions-app && npm run build` -- expected: production build succeeds.

**Manual checks (if no CLI):**
- Resize browser to `<768px`, sign in → hub shows last dictation, no tab bar, « Saisir »/« Voir » navigate correctly. At `≥768px`, dictations list and tabs unchanged. Navigate to `/students` on mobile → lands on `/dictations`.

## Spec Change Log

- Review loop 0: Added `mobile-route-guard.test.ts` for I/O matrix mobile/grid block paths; fixed duplicate `<main>` on `/dictations`; summary zero-leveled copy; `role="status"` on completion badge.

## Suggested Review Order

**Mobile shell & routing**

- Dual G1/G2 layout splits laptop list from phone hub via CSS breakpoints.
  [`page.tsx:64`](../../champions-app/app/(dashboard)/dictations/page.tsx#L64)

- Client guard redirects blocked G1 deep-links below 768px to the hub.
  [`mobile-route-guard.tsx:10`](../../champions-app/components/dashboard/mobile-route-guard.tsx#L10)

- NavTabs hidden under `md`; AppBar wordmark unchanged.
  [`dashboard-chrome.tsx:30`](../../champions-app/components/dashboard/dashboard-chrome.tsx#L30)

**Hub & completion**

- Presentational G2 hub: last dictation, shortcuts, empty and complete states.
  [`mobile-dictation-hub.tsx:14`](../../champions-app/components/dictations/mobile-dictation-hub.tsx#L14)

- Completion counts reuse leveled roster + persisted entries (no new entity).
  [`get-dictation-completion-summary.ts:10`](../../champions-app/lib/services/get-dictation-completion-summary.ts#L10)

**Mobile routes**

- « Voir » read-only summary with completion line.
  [`summary/page.tsx:19`](../../champions-app/app/(dashboard)/dictations/[id]/mobile/summary/page.tsx#L19)

- « Saisir » stub shell for story 5.2 picker.
  [`mobile/page.tsx:15`](../../champions-app/app/(dashboard)/dictations/[id]/mobile/page.tsx#L15)

**Tests**

- Blocked-path table for mobile route guard.
  [`mobile-route-guard.test.ts:7`](../../champions-app/components/dashboard/mobile-route-guard.test.ts#L7)
