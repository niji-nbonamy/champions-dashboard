---
name: CHAMPIONS
status: final
updated: 2026-08-24
brand:
  theme: Menthe Douce (C)
  logo: imports/logo-ecole-saint-hermeland.png
sources:
  - ../../../specs/spec-dashboards-dictees-champions-ce2/SPEC.md
  - ../../../specs/spec-dashboards-dictees-champions-ce2/ux-decisions.md
  - ../../../specs/spec-dashboards-dictees-champions-ce2/mvp-scope.md
  - ../../../specs/spec-dashboards-dictees-champions-ce2/dictation-lifecycle.md
  - ../../../specs/spec-dashboards-dictees-champions-ce2/error-categories.md
  - ../../../specs/spec-dashboards-dictees-champions-ce2/level-system.md
  - ../../../specs/spec-dashboards-dictees-champions-ce2/scoring-model.md
  - ../../../specs/spec-dashboards-dictees-champions-ce2/roster-import.md
---

# CHAMPIONS — Experience Spine

> Laptop-first responsive web for CHAMPIONS dictation tracking. Grade-level agnostic — no school grade in UI. shadcn/ui + Tailwind. `DESIGN.md` is the visual identity reference; this spine owns behavior. Patterns G1–G2, A2, B4, C1, C3, D1–D3+, E1/E3, F1 inherited from `ux-decisions.md`. Spines win on conflict with any mock or wireframe.

## Foundation

**Form-factor:** Responsive web. Laptop primary (≥ 1024px) for year config, class grid, dossiers, and parent presentation. Mobile secondary (< 768px) for per-student dictation capture only — no feature parity on mobile.

**UI system:** [ASSUMPTION] shadcn/ui on Next.js + Tailwind. Component library handles dialogs, tabs, tables, toasts; EXPERIENCE.md specifies behavioral delta only.

**Audience:** Primary teachers (Rachel is the named protagonist in journeys below), one class per teacher per school year. Teachers at different grade levels share the same UI — no grade label in the app. French UI microcopy throughout.

**Data posture:** Facts only — global %, error counts, curves, level history. No auto-generated pedagogical narrative for parents.

## Information Architecture

| Surface | Reached from | Purpose |
|---|---|---|
| **Dictées** (tab) | G1 tab bar / mobile hub shortcut | Dictation list, create dictation, open class grid (A2) |
| **Class grid** (A2) | Dictées → dictation row | Condensed student × C–S error-count entry; inline promotion (D3, D3+) |
| **Élèves** (tab) | G1 tab bar | Active roster, student dossier (C1), manual level assignment (E1), archive |
| **Student dossier** (C1) | Élèves → student row | Hero global curve, collapsed dictation table, D1 promotion banner, « RDV parents » (C3) |
| **Presentation mode** (C3) | Dossier → « RDV parents » | Full-screen parent-meeting snapshot (~30 s); school logo bottom-right |
| **App bar** | All G1 surfaces + mobile hub | Saint Hermeland wordmark — 52px height laptop / 40px mobile, width auto |
| **Config** (tab) | G1 tab bar | CSV roster import, word-count matrix (F1), year settings |
| **Year-start wizard** (E3) | Post-CSV import | 3-step: roster confirm → level assignment → word matrix |
| **Alertes** (tab) | G1 tab bar | Promotion queue (D2) — batch review |
| **Mobile dictation hub** (G2) | Mobile home | Last dictation + shortcuts to enter/review |
| **Mobile per-student entry** (B4) | Hub → dictation → student | Nine-field hybrid capture with quick-tap mode |

**Surface closure:** Every capability maps to a surface; every surface has a journey below.

Modal stack: one level deep (e.g., Valider/Refuser dialog on grid, never on another dialog). Sheets on mobile replace dialogs where noted.

## Voice and Tone

Microcopy in French. Brand voice lives in `DESIGN.md`.

| Do | Don't |
|---|---|
| « Enregistrer » / « Valider » / « Refuser » | « Super ! Ta dictée est sauvegardée 🎉 » |
| « 3 élèves prêts à monter de niveau » | « Félicitations, des progrès incroyables ! » |
| « Σ erreurs > total mots pour Lucas » | « Oups, quelque chose ne va pas » |
| « Prêt à monter → vert » | « Lucas est un champion ! » |
| Facts: « Dernière dictée : 87 % · +4 pts » | Auto-interpretation: « Lucas progresse bien en conjugaison » |

## Component Patterns

Behavioral. Visual specs in `DESIGN.md.Components` or shadcn defaults.

| Component | Surface | Behavioral rules |
|---|---|---|
| **Class grid (A2)** | Dictées | Rows = active leveled students only. Columns = C H A M P I O N S (fixed). Tab moves cell-to-cell. Integer ≥ 0 per cell. Hover/tap shows full category name + definition. Save blocked if any row Σ > word total — inline error on offending row. Global % shown per row after save. |
| **Promotion row indicator (D3)** | Class grid | ⬆️ appears at row start when pending promotion exists. Non-interactive indicator. |
| **Promotion + button (D3+)** | Class grid | **+** at row end when criteria met. Opens Valider/Refuser dialog (same as D1). Confirming records level change without leaving grid. |
| **Student dossier (C1)** | Élèves | Hero global curve top. Dictation table below — collapsed by default; expand reveals per-category error counts (no %). Level badge + history link. |
| **Promotion banner (D1)** | Dossier | « Prêt à monter → [niveau] » + Valider / Refuser. Reads same pending state as D2/D3/D3+. |
| **App bar** | All laptop tabs, mobile hub | CHAMPIONS method wordmark left (`{champions-logo-app-bar}`: 52px h laptop, 40px h mobile, width auto, `object-fit: contain`). No subtitle. App bar min-height 64px. Logo not clickable in MVP. |
| **Landing** | Unauthenticated `/` | Full « La méthode CHAMPIONS » hero centered; CTAs « Se connecter » and « Créer un compte ». Authenticated `/` redirects to Dictées. |
| **Presentation mode (C3)** | Full-screen overlay | Global curve dominant. Three highlights: last %, trend delta, level badge. Per-category counts on demand via collapsed table toggle. CHAMPIONS wordmark bottom-right (`{champions-logo-presentation}`: 44px height, width auto, opacity 0.85, 24px margin from edges) — legible for parents, never overlaps data. Exit via Esc or « Fermer ». |
| **Alerts queue (D2)** | Alertes tab | List of students with pending promotions. Process one-by-one: tap row → Valider/Refuser dialog. Count badge on tab: « N élèves prêts ». |
| **Level dot picker (E1)** | Élèves roster | Four color dots per unassigned student. Tap assigns level; student becomes eligible for grids. |
| **Year-start wizard (E3)** | Post-import | Linear 3 steps with back navigation. Cannot skip level assignment before first scored dictation. |
| **Word matrix (F1)** | Config | Rows = dictations, columns = four level colors. Cells = word count (integer > 0). Required before dictation save. |
| **CSV import** | Config | Single column `NOM + prénom`, UTF-8. Reject with specific error per `roster-import.md`. |
| **Mobile per-student form (B4)** | Mobile | Nine large numeric fields. Quick-tap mode: tap cycles 0→1→2→3; long-press or dedicated field for ≥ 4. Blocked if student has no level — redirect to E1. |
| **Mobile dictation hub (G2)** | Mobile home | Shows last dictation label + date. Shortcuts: « Saisir » (opens B4 student picker), « Voir » (read-only summary). |

## State Patterns

| State | Surface | Treatment |
|---|---|---|
| **Cold load** | Any tab | shadcn `Skeleton` matching expected layout. Resolves on data. |
| **Empty roster** | Dictées, Config | « Importez votre liste d'élèves pour commencer. » Primary CTA → Config CSV import. Dictation create disabled. |
| **Unassigned levels** | Élèves | Students with « niveau requis » badge. Hidden from grids. Warning count on Élèves tab if > 0. |
| **Grid validation error** | Class grid | Inline red border on offending cell/row. Message: « Σ erreurs ({N}) > total mots ({M}) pour {displayName} ». Save button disabled until resolved. |
| **Pending promotions** | Alertes tab, grid rows, dossiers | Badge count on Alertes tab. Synced pending state across D1/D2/D3/D3+ — first action wins. |
| **No dictations yet** | Dossier | Empty curve placeholder: « Aucune dictée enregistrée. » No trend, no %. |
| **Single dictation** | Presentation mode | Trend shows « — » (needs ≥ 2 dictations per `scoring-model.md`). |
| **Archived student** | Élèves (filter) | Read-only dossier. Hidden from active grids. Label: « Archivé ». |
| **Save in progress** | Class grid, mobile form | Save button shows spinner; optimistic lock on grid cells until confirm or error. |
| **Save failure** | Any | shadcn `Toast` (destructive): « Enregistrement impossible. Réessayez. » Data retained in form. |

## Interaction Primitives

**Laptop — keyboard-first grid entry (A2):**

- `Tab` / `Shift+Tab` — Move between grid cells (row-major: C→S, then next student)
- `Enter` — Save grid (when focus not in cell edit) or confirm cell value
- `Esc` — Cancel inline promotion dialog; exit presentation mode
- Arrow keys — Move between cells when cell focused
- Digit keys `0–9` — Direct entry in focused cell (no modal)

**Laptop — navigation:**

- Tab bar click — Switch G1 surfaces (Dictées · Élèves · Config · Alertes)
- No keyboard shortcuts for tab switching in MVP [ASSUMPTION]

**Mobile — touch-first (B4):**

- Tap field — Focus numeric input
- Tap (quick-tap mode) — Cycle 0→1→2→3 per category
- Long-press field — Open numeric keypad for values ≥ 4
- Swipe between students — [ASSUMPTION] prev/next arrows instead of swipe for MVP simplicity

**Banned everywhere:** Auto level promotion without teacher validation. Per-category % display. Pedagogical narrative generation. Dictation delete/purge.

## Accessibility Floor

- WCAG 2.2 AA target. Visual contrast inherits shadcn defaults; brand overrides in `DESIGN.md` verified at implementation.
- Grid cells: `aria-label` = « {displayName}, {catégorie}, {valeur} erreurs »
- Promotion banner: `role="alert"` when newly surfaced
- Presentation mode: focus trapped; Esc exits; screen reader announces « Mode RDV parents, {displayName} »
- Level badges: text label alongside color dot (not color-only)
- Tab order on grid matches visual row-major order
- Mobile numeric fields: `inputmode="numeric"`; minimum 44px touch targets per `{spacing.grid-cell-min}`

## Responsive & Platform

| Breakpoint | Behavior |
|---|---|
| **≥ 1024px (laptop)** | G1 four-tab layout. Full class grid (A2). Side-by-side dossier curve + table on wide screens. |
| **768–1023px (tablet)** | G1 tabs persist. Grid horizontally scrollable if needed. Dossier stacks curve above table. |
| **< 768px (mobile)** | G2 dictation hub replaces tab bar for dictation workflows. **No Élèves/Config/Alertes on mobile** — laptop required for roster, config, and alerts. B4 per-student entry only — no full class grid. |

No native app. PWA install optional [ASSUMPTION] but not required for MVP.

## Key Flows

### Flow 1 — Post-dictation capture (Rachel, laptop, 10h15)

Rachel just finished a CHAMPIONS dictation with her class. She has the paper tally sheet and 22 leveled students.

1. Rachel opens **Dictées**, taps today's dictation (created before the session).
2. Class grid (A2) loads: 22 rows × 9 columns. She starts top-left, enters error counts from her paper sheet.
3. Tab key jumps cell to cell. Mid-grid, she notices ⬆️ on Emma's row — promotion criteria met from the *previous* dictation.
4. She taps **+** on Emma's row. Dialog: « Prêt à monter → vert ». She taps **Valider**. Dialog closes; Emma's level dot updates to green; row denominator adjusts.
5. She finishes remaining students. One row shows red border — Lucas has Σ 12 errors but word total is 10.
6. She corrects Lucas's N column from 5 to 3. Border clears.
7. **Climax:** Rachel hits **Enregistrer**. Toast: « Dictée enregistrée. » All row % appear. She closes the laptop — 8 minutes total, faster than reconciling paper sheets later.

**Failure:** Network error on save → Toast destructive, data retained, retry on Enregistrer.

### Flow 2 — Parent meeting in 30 seconds (Rachel, laptop, 17h40)

Parent of Lucas arrives for a 10-minute slot. Rachel has 30 seconds to orient.

1. Rachel opens **Élèves**, taps **Lucas MARTIN**.
2. Dossier (C1) loads: hero curve shows 12-dictation progression. Last entry: 87 %.
3. She taps **« RDV parents »** (C3). Full-screen presentation mode.
4. Screen shows: large global curve, **87 %** (last), **+4 pts** (trend up), **badge vert** (current level). Saint Hermeland logo sits discreetly bottom-right.
5. Parent asks about conjugation errors. Rachel taps « Détail par catégorie » — collapsed table expands showing C=2, H=0, A=1… raw counts only.
6. **Climax:** Rachel gestures at the upward curve and +4 pts. The school logo anchors credibility without stealing focus. She owns the pedagogical narrative; facts on screen in under 30 seconds. She taps **Fermer** — back to dossier.

**Failure:** Fewer than 2 dictations → trend shows « — ». Rachel verbally notes it's early in the year.

### Flow 3 — Year start setup (Rachel, laptop, September)

New school year. Rachel has the class list from the admin portal.

1. Rachel opens **Config** → **Importer CSV**. Uploads one-column file (`NOM + prénom`, 24 students).
2. Import succeeds. Year-start wizard (E3) opens automatically.
3. **Step 1 — Roster:** Reviews 24 names, removes duplicate test entry, confirms.
4. **Step 2 — Niveaux:** After her CHAMPIONS evaluation, she assigns color dots to each student (E1 pattern in wizard). 24/24 assigned.
5. **Step 3 — Matrice mots:** Enters word counts per dictation × level (F1). Fills 4 dictations × 4 levels.
6. **Climax:** Wizard completes. **Dictées** tab unlocks « Nouvelle dictée ». Rachel creates « Dictée 1 — rentrée ». Grid opens with 24 leveled rows — she's ready for the first scored session.

**Failure:** CSV wrong encoding → « Fichier non UTF-8. Réexportez depuis votre logiciel. » No partial import.

### Flow 4 — Mobile capture on the go (Rachel, phone, playground duty)

Rachel has 3 students left to enter from this morning's dictation. She's on playground duty with her phone.

1. Opens app → mobile dictation hub (G2). Last dictation: « Dictée 4 — homophones ».
2. Taps **Saisir** → student picker shows all leveled students; those with an existing DictationEntry are marked « saisi »; subtitle shows remaining count.
3. Selects **Léa**. B4 form: nine large fields. Quick-tap mode on — taps H twice (2 homophone errors), taps through others.
4. **Enregistrer** → returns to student picker. 2 remaining.
5. **Climax:** After the third student, hub shows « Dictée 4 complète ». Rachel pockets the phone — no need to wait for the laptop.

**Failure:** Student without level → « Niveau requis pour {displayName}. Assignez le niveau depuis un ordinateur. » (e.g. `MARTIN Léa`). Entry blocked; no mobile path to E1.

## Open Items

| Item | Status | Notes |
|---|---|---|
| Brand color palette | **Resolved** | Theme C Menthe Douce — primary `#059669`, accent `#7C3AED`, no orange |
| School logo placement | **Resolved** | CHAMPIONS wordmark in app bar + presentation mode bottom-right |
| Mobile hub access to Élèves/Config/Alertes | **Resolved** | Mobile is dictation-capture-only; Élèves/Config/Alertes require laptop (≥ 1024px). No hub drawer. |
| Per-student completion tracking on mobile | **Resolved** | Completion derived from existing DictationEntry per (dictation, student); picker shows « saisi » indicator and remaining count. |
| PWA install | `[ASSUMPTION]` | Optional post-MVP |
| Validation review lenses | Skipped | Fast path — available on request via Validate mode |
