---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-01-requirements-confirmed
  - step-01-requirements-update-2026-09-01
  - step-01-requirements-confirmed-2026-09-01
  - step-02-design-epics-approved-2026-09-01
  - step-03-create-stories
  - step-04-final-validation
  - assumptions-mobile-resolved-2026-08-25
inputDocuments:
  - _bmad-output/specs/spec-dashboards-dictees-champions-ce2/SPEC.md
  - _bmad-output/specs/spec-dashboards-dictees-champions-ce2/error-categories.md
  - _bmad-output/specs/spec-dashboards-dictees-champions-ce2/roster-import.md
  - _bmad-output/specs/spec-dashboards-dictees-champions-ce2/scoring-model.md
  - _bmad-output/specs/spec-dashboards-dictees-champions-ce2/level-system.md
  - _bmad-output/specs/spec-dashboards-dictees-champions-ce2/dictation-lifecycle.md
  - _bmad-output/specs/spec-dashboards-dictees-champions-ce2/mvp-scope.md
  - _bmad-output/specs/spec-dashboards-dictees-champions-ce2/ux-decisions.md
  - _bmad-output/planning-artifacts/architecture/architecture-testBMAD-2026-08-24/ARCHITECTURE-SPINE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-testBMAD-2026-08-24/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-testBMAD-2026-08-24/EXPERIENCE.md
  - _bmad-output/planning-artifacts/sprint-change-proposal-08-27-2026.md
  - _bmad-output/planning-artifacts/sprint-change-proposal-08-27-2026-landing-branding.md
  - _bmad-output/planning-artifacts/future-ideas.md
---

# testBMAD - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for testBMAD, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Teacher self-registers with email and password via Auth.js (AD-2).
FR2: On first login, teacher creates one Class for the current school year (MVP: one class per teacher per year).
FR3: Teacher imports student roster via single-column UTF-8 CSV with header `NOM + prénom` (CAP-3).
FR4: CSV import rejects non-UTF-8 files, wrong headers, duplicate names, and empty rosters with specific error messages.
FR5: Teacher manually adds individual students to the roster as fallback to CSV import.
FR6: Teacher archives departing students — dossier preserved read-only, hidden from active grids, never deleted (CAP-3).
FR7: Teacher assigns initial color level to each student after year-start CHAMPIONS evaluation (not from CSV).
FR8: Teacher assigns level to mid-year arrivals via color-dot picker on Élèves tab (E1).
FR9: Students without assigned level are hidden from dictation grids and blocked from scored dictations until level is set.
FR10: Teacher configures editable word-count matrix: rows = dictations, columns = four color levels, cells = integer > 0 (F1).
FR11: Year-start wizard (E3) guides teacher through 3 steps: roster confirm → level assignment → word matrix; cannot skip level assignment.
FR12: Teacher creates dictation with free-text label and date (defaults to today) from Dictées tab.
FR13: Dictation creation is blocked when roster is empty or word-count matrix row is missing for that dictation.
FR14: Teacher enters non-negative integer error counts on condensed class grid — rows = active leveled students, columns = C H A M P I O N S (CAP-1, A2).
FR15: Class grid supports keyboard-first entry: Tab/Shift+Tab row-major navigation, arrow keys, digit keys 0–9, Enter to save.
FR16: Class grid shows category name only (no definition text) on column header hover/tap per error-categories.md.
FR17: Class grid save is blocked when any student row has Σ category errors > word total; inline error on offending row.
FR18: Class grid displays ⬆️ promotion indicator (D3) on row when pending promotion exists.
FR19: Class grid displays **+** button (D3+) on row when promotion criteria met; opens Valider/Refuser dialog without leaving grid.
FR20: System auto-calculates global % per student on dictation save: (total words − min(Σ errors, total words)) ÷ total words × 100, clamped [0, 100] (CAP-4).
FR21: On dictation save, system snapshots per student: levelAtSave, wordDenominator, globalPercent, and nine category error counts (AD-5).
FR22: Teacher may reopen and edit past dictation error counts; recalculation uses original snapshot level/denominator, then re-runs promotion detection forward.
FR23: System auto-generates per-student dossier aggregating all dictations — teacher never manually assembles views (CAP-2).
FR24: Student dossier displays hero global progression curve at top (C1).
FR25: Student dossier shows collapsed dictation history table; expand reveals per-category error counts only (no per-category %).
FR26: Student dossier displays promotion banner (D1) « Prêt à monter → [niveau] » with Valider / Refuser when pending promotion exists.
FR27: Teacher manually sets or changes any student's color level at any time from dossier or roster; recorded as action = manual.
FR28: System detects promotion readiness automatically after each save based on consecutive-dictation thresholds (yellow→green >90%, green→violet >90%, violet→gold >95%).
FR29: Teacher validates or refuses each promotion explicitly — no automatic level change (CAP-5).
FR30: At most one pending promotion per student; all surfaces (D1, D2, D3, D3+) read same state; first validate/refuse wins (AD-6).
FR31: On promotion refuse, consecutive-dictation streak resets; teacher must re-achieve qualifying streak.
FR32: Teacher processes pending promotions via Alertes tab queue (D2) — one-by-one Valider/Refuser with count badge « N élèves prêts ».
FR33: All level changes recorded in level history with date, color, and action (assigned, promoted, refused, manual).
FR34: Teacher opens full-screen presentation mode « RDV parents » from dossier (C3, CAP-6).
FR35: Presentation mode shows global curve, last dictation %, trend delta vs previous dictation, and current level badge — presentable in ~30 seconds.
FR36: Presentation mode provides per-category error counts on demand via collapsed table toggle; no pedagogical narrative.
FR37: Teacher enters dictation errors on mobile via per-student hybrid form with nine large numeric fields (B4, CAP-7).
FR38: Mobile quick-tap mode increments error count by +1 on each tap (no 0–3 cap); long-press or dedicated field for manual numeric entry (including decrease).
FR39: Mobile entry blocked for students without assigned level; redirect to level assignment (E1).
FR40: Mobile dictation hub (G2) shows last dictation label + date with shortcuts « Saisir » and « Voir ».
FR41: Laptop navigation uses four tabs: Dictées · Élèves · Config · Alertes (G1).
FR42: Dictation lifecycle supports create, save, and edit; delete/purge deferred to post-MVP.
FR43: Teacher can trigger annual year reset from Config tab with explicit confirmation modal warning irreversibility.
FR44: Year reset atomically deletes all Class-scoped data (students, dictations, entries, word matrix, level history, pending promotions) in a single transaction.
FR45: After year reset, teacher is redirected to year-start wizard (E3) to configure the new school year (CSV import → levels → word matrix).
FR-AUTH-1: Registration form displays password visibility toggle on password and confirmation fields.
FR-AUTH-2: Registration requires password confirmation; mismatch blocks submit with inline feedback.
FR-AUTH-3: Registration displays real-time password requirement checklist in French: « Saisissez un mot de passe comportant au moins : » + 8 caractères, 1 chiffre, 1 minuscule, 1 majuscule, 1 caractère spécial, correspondance des deux mots de passe.
FR-AUTH-4: Registration requires Google reCAPTCHA v2 (« Je ne suis pas un robot »); server verifies token before account creation.
FR-AUTH-5: Login form displays password visibility toggle.
FR-AUTH-6: All auth form labels, requirement text, and error messages in French.
FR46: Unauthenticated visitors see a branded public landing at `/` with centered « La méthode CHAMPIONS » hero image and French CTAs « Se connecter » and « Créer un compte ».
FR47: Authenticated users visiting `/` are redirected to `/dictations` (onboarding/class guards unchanged).
FR48: App bar and main G1 tab navigation remain fixed (sticky) while scrolling dashboard content.
FR49: Teacher can edit a saved dictation's label and date after creation (typo or session date correction).
FR50: Dictation creation flow shows guidance that dictation labels must exist in the Config word-count matrix first, with a link to Config.

### NonFunctional Requirements

NFR1: Class-scoped tenancy — every entity belongs to one Class; no cross-class reads or writes; authorization enforced in application services (AD-1).
NFR2: All state mutations go through Server Actions → application services → domain validation → database transaction; browser never computes authoritative scores or promotion outcomes (AD-3).
NFR3: Scoring and promotion logic live in pure domain modules (`lib/domain/scoring`, `lib/domain/promotion`); no duplication across UI or DB layers (AD-4).
NFR4: Dictation row snapshots are immutable per save; subsequent level changes do not retroactively alter stored percentages (AD-5).
NFR5: EU data residency — Neon Postgres in AWS EU (Frankfurt); Vercel deployment targets EU; no data outside EU (AD-8).
NFR6: Request/refresh data model — no WebSockets or live subscriptions; data fetched on page load and after mutations; stale concurrent sessions acceptable (AD-9).
NFR7: Nine CHAMPIONS error categories (C–S) are compile-time/domain constants; not teacher-configurable (AD-10).
NFR8: Grade-level agnostic — no school grade (CE2, CM1, etc.) in schema, UI labels, or business rules (AD-11).
NFR9: Auth errors use generic messages on login failure; no email-exists leak on registration.
NFR10: Server-side logging only; never log student names in production info logs.
NFR11: Secrets via Vercel env vars; `DATABASE_URL` and `AUTH_SECRET` required.
NFR12: UUID v4 for all primary keys; `timestamptz` in DB; ISO 8601 at API boundaries.
NFR13: WCAG 2.2 AA accessibility target for all surfaces.
NFR14: French UI microcopy throughout; factual tone — no auto-generated pedagogical narrative for parents.
NFR15: Laptop-first responsive design (≥1024px primary); mobile secondary (<768px) for per-student capture only — no feature parity on mobile.
NFR16: Performance: parent-meeting presentation mode usable in ~30 seconds from dossier open.
NFR17: CI via GitHub → Vercel auto-deploy; migrations via drizzle-kit push or migrate in deploy step.
NFR-AUTH-1: Password policy enforced server-side: min 8 chars, ≥1 digit, ≥1 lowercase, ≥1 uppercase, ≥1 special character.
NFR-AUTH-2: reCAPTCHA bypass allowed only in non-production when `RECAPTCHA_SECRET_KEY` is absent (dev/CI convenience).
NFR-AUTH-3: Existing NFR9 preserved — generic errors, no email-exists leak on registration.

### Additional Requirements

- **Starter template (Epic 1 Story 1):** Greenfield Next.js 16.3.2 App Router project with TypeScript 5.x, React 19.x, Node.js 22 LTS — layered monolith structure per ARCHITECTURE-SPINE structural seed (`app/`, `components/`, `lib/domain/`, `lib/services/`, `lib/db/`, `drizzle/`).
- **Stack:** Auth.js v5 with @auth/neon-adapter, Drizzle ORM, Neon Postgres (Frankfurt), bcryptjs, shadcn/ui + Tailwind CSS.
- **Auth & onboarding:** Self-registration flow at `app/(auth)/`; Teacher.id equals Auth.js users.id (1:1); first login creates Class.
- **Data model:** Entities per ER diagram — Teacher, Class, Student, Dictation, DictationEntry, WordCountMatrixRow, LevelHistoryEntry, PendingPromotion.
- **Naming conventions:** PascalCase types; DB tables snake_case plural; kebab-case filenames; FK `*_id`.
- **Level colors enum:** `yellow`, `green`, `violet`, `gold`. Level history actions enum: `assigned`, `promoted`, `refused`, `manual`.
- **Deployment environments:** production (Vercel Hobby main + Neon Frankfurt), preview (Vercel preview + optional Neon branch), local (`next dev` + Neon dev branch).
- **Capability → path mapping:** Grid entry in `app/(dashboard)/dictations/`; dossier in `app/(dashboard)/students/[id]/`; config in `app/(dashboard)/config/`; presentation in `app/(dashboard)/students/[id]/present/`; mobile entry in `app/(dashboard)/dictations/[id]/mobile/`.
- **Auth security (AD-12):** Server-side password policy + reCAPTCHA v2 verification via `lib/services/recaptcha-verify.ts`; shared auth components under `components/auth/` (`password-field.tsx`, `password-requirements.tsx`, `recaptcha-field.tsx`); env vars `RECAPTCHA_SITE_KEY` + `RECAPTCHA_SECRET_KEY` required in production.
- **Public landing:** `app/page.tsx` branded hero + CTAs; middleware extends `/` matcher — logged-in redirect to `/dictations`; assets `public/logo-champions-method-full.jpg` (landing) and `public/logo-champions-wordmark.jpg` (app bar).
- **Deferred (not in MVP stories):** Per-category %, full mobile class grid, pixel-perfect paper layout, dictation delete/purge, word-count matrix CSV import (F3), PWA/offline, WebSocket sync, Postgres RLS, email verification, automated GDPR export/erasure.
- **Future (captured in future-ideas.md, scheduled Epic 7):** Password reset self-service (IDEA-001 → 7-1); interactive dossier curves — axis labels + per-category toggles (IDEA-004 → 7-2, 7-3).

### UX Design Requirements

UX-DR1: Implement Theme C — Menthe Douce color tokens: primary `#059669`, accent `#7C3AED`, promotion-ready `#2563EB`, trend-up/down/flat tokens; **no orange anywhere in UI**.
UX-DR2: Implement four CHAMPIONS level badge variants (yellow, green, violet, gold) with pill shape and semantic foreground colors per DESIGN.md.
UX-DR3: Implement typography tokens: DM Sans Light for display titles (28px/300), display-sm (20px/300), monospace data-lg (32px/600) for presentation highlights.
UX-DR4: Implement spacing tokens: grid-cell-min 44px, grid-row-height 40px, app-bar-min-height 64px, logo heights 52px laptop / 40px mobile / 44px presentation.
UX-DR5: Implement app bar with CHAMPIONS method wordmark left (52px h laptop, 40px h mobile, width auto, object-fit contain) — no separate subtitle; tabs below/inline on wide screens.
UX-DR6: Implement CHAMPIONS wordmark in presentation mode bottom-right (44px height, opacity 0.85, 24px safe margin, non-interactive, does not overlap curve/highlights).
UX-DR7: Implement primary button style (mint fill) for Enregistrer, Valider, confirm actions; accent outline button for « RDV parents » and wizard forward steps.
UX-DR8: Implement promotion banner component (D1) with promotion-ready blue fill, Valider / Refuser actions.
UX-DR9: Implement promotion + button (D3+) — circular promotion-ready blue at row end on class grid.
UX-DR10: Implement class grid cell component — centered integer, min 44×40px, destructive border when Σ > word total.
UX-DR11: Implement presentation highlight component using data-lg monospace typography for last %, trend delta, level badge.
UX-DR12: Implement G1 four-tab navigation (Dictées · Élèves · Config · Alertes) for laptop ≥1024px.
UX-DR13: Implement G2 mobile dictation hub as mobile home with last dictation + Saisir/Voir shortcuts; mobile is dictation-capture-only — no Élèves/Config/Alertes navigation on phone (laptop required for roster, config, and alerts).
UX-DR14: Implement class grid (A2) with horizontal scroll when viewport < 9 columns + name column.
UX-DR15: Implement student dossier layout — max-w-4xl, hero curve top, collapsed table below; side-by-side on wide screens.
UX-DR16: Implement presentation mode (C3) — full viewport, no chrome, focus trapped, Esc or « Fermer » exits, screen reader announces « Mode RDV parents, {displayName} ».
UX-DR17: Implement alerts queue (D2) with tab badge count « N élèves prêts » and one-by-one Valider/Refuser processing.
UX-DR18: Implement level dot picker (E1) — four color dots per unassigned student row on Élèves tab.
UX-DR19: Implement year-start wizard (E3) — linear 3-step flow with back navigation, cannot skip level assignment.
UX-DR20: Implement word matrix table (F1) on Config tab — rows = dictations, columns = four level colors, cells = word count integer > 0.
UX-DR21: Implement mobile per-student form (B4) — full width, 48px min field height, inputmode="numeric", quick-tap +1 increment per tap (no cycle cap).
UX-DR22: Implement empty states: empty roster CTA to Config CSV import; no dictations placeholder on dossier; unassigned levels badge on Élèves tab.
UX-DR23: Implement loading states — shadcn Skeleton matching expected layout on cold load; save-in-progress spinner with optimistic lock on grid cells.
UX-DR24: Implement error states — inline grid validation message « Σ erreurs ({N}) > total mots ({M}) pour {displayName} »; destructive Toast on save failure with data retained.
UX-DR25: Implement accessibility: grid cell aria-label « {displayName}, {catégorie}, {valeur} erreurs »; promotion banner role="alert"; level badges with text label alongside color dot; tab order matches row-major grid order. `{displayName}` = stored student name (trim only on input; no first/last-name parsing).
UX-DR26: Implement responsive breakpoints — ≥1024px full G1 layout; 768–1023px scrollable grid + stacked dossier; <768px G2 hub + B4 entry only.
UX-DR27: Implement French microcopy per voice/tone table — factual labels only, no celebratory or pedagogical auto-text.
UX-DR28: Implement archived student UI — « Archivé » label, read-only dossier, hidden from active grids, filter on Élèves tab.
UX-DR29: Implement registration form per DESIGN.md § Auth Forms — password toggles, confirmation field, bordered requirements inset with real-time satisfied/unsatisfied bullets, reCAPTCHA v2 centered below inset, submit « Créer mon compte ».
UX-DR30: Implement login form per DESIGN.md § Auth Forms — password toggle only, submit « Se connecter », no captcha or requirements inset.
UX-DR31: Implement public landing surface — `{champions-landing-hero}` centered on `/` for unauthenticated users; primary CTAs « Se connecter » and « Créer un compte »; no dev scaffold copy.
UX-DR32: Implement sticky app shell — app bar and G1 tab navigation remain visible while scrolling long dashboard pages (roster, grid, dossier).

### FR Coverage Map

FR1: Epic 1 - Teacher self-registration via Auth.js
FR2: Epic 1 - Create Class on first login for current school year
FR3: Epic 2 - CSV roster import (single column, UTF-8)
FR4: Epic 2 - CSV import validation with specific error messages
FR5: Epic 2 - Manual student add as CSV fallback
FR6: Epic 2 - Archive departing students (read-only dossier, hidden from grids)
FR7: Epic 2 - Assign initial color level after year-start evaluation
FR8: Epic 2 - Assign level to mid-year arrivals via color-dot picker (E1)
FR9: Epic 2 - Block unleveled students from dictation grids
FR10: Epic 2 - Configure word-count matrix (F1)
FR11: Epic 2 - Year-start wizard E3 (roster → levels → matrix)
FR12: Epic 3 - Create dictation with label and date
FR13: Epic 3 - Block dictation creation when roster empty or matrix missing
FR14: Epic 3 - Enter error counts on condensed class grid (A2)
FR15: Epic 3 - Keyboard-first grid navigation (Tab, arrows, digits)
FR16: Epic 3 / Epic 6 - Category name only on column header hover (amended by Epic 6)
FR17: Epic 3 - Block save when Σ errors > word total per row
FR18: Epic 3 - Display ⬆️ promotion indicator on grid row (D3)
FR19: Epic 3 - Display + button with inline Valider/Refuser dialog (D3+)
FR20: Epic 3 - Auto-calculate global % on dictation save
FR21: Epic 3 - Snapshot levelAtSave, wordDenominator, globalPercent, error counts
FR22: Epic 3 - Edit past dictation using original snapshot denominators
FR23: Epic 4 - Auto-generate per-student dossier aggregating all dictations
FR24: Epic 4 - Display hero global progression curve on dossier (C1)
FR25: Epic 4 - Collapsed dictation table with expandable per-category error counts
FR26: Epic 4 - Promotion banner on dossier with Valider/Refuser (D1)
FR27: Epic 4 - Manual level override from dossier or roster
FR28: Epic 4 - Auto-detect promotion readiness after each save
FR29: Epic 4 - Teacher validates/refuses every promotion explicitly
FR30: Epic 4 - Single pending promotion per student across all surfaces
FR31: Epic 4 - Reset consecutive-dictation streak on promotion refuse
FR32: Epic 4 - Process pending promotions via Alertes queue (D2)
FR33: Epic 4 - Record all level changes in level history
FR34: Epic 4 - Open full-screen presentation mode « RDV parents » (C3)
FR35: Epic 4 - Show curve, last %, trend delta, level badge in presentation
FR36: Epic 4 - Per-category error counts on demand in presentation mode
FR37: Epic 5 - Mobile per-student hybrid error entry form (B4)
FR38: Epic 5 - Quick-tap mode +1 per tap (no 0–3 cap); manual entry via long-press or dedicated field
FR39: Epic 5 - Block mobile entry for unleveled students, redirect to E1
FR40: Epic 5 - Mobile dictation hub with last dictation and shortcuts (G2)
FR41: Epic 1 - Four-tab laptop navigation (Dictées · Élèves · Config · Alertes)
FR42: Epic 3 - Dictation lifecycle: create, save, edit (no delete in MVP)
FR43: Epic 2 - Annual year reset from Config with confirmation modal
FR44: Epic 2 - Atomic cascade delete of all Class-scoped data on reset
FR45: Epic 2 - Redirect to year-start wizard E3 after reset
FR-AUTH-1: Epic 1 - Registration password visibility toggle
FR-AUTH-2: Epic 1 - Password confirmation with mismatch blocking
FR-AUTH-3: Epic 1 - Real-time French password requirements checklist
FR-AUTH-4: Epic 1 - reCAPTCHA v2 on registration with server verification
FR-AUTH-5: Epic 1 - Login password visibility toggle
FR-AUTH-6: Epic 1 - French auth form microcopy
FR46: Epic 1 - Public landing hero and auth CTAs
FR47: Epic 1 - Authenticated redirect from `/` to `/dictations`
FR48: Epic 6 - Sticky app bar and tab navigation
FR49: Epic 6 - Edit dictation label and date
FR50: Epic 6 - Config-first hint before « Nouvelle dictée »

## Epic List

### Epic 1: Foundation & Teacher Access
Teacher can register, log in, access a branded public landing, and navigate the application shell with CHAMPIONS identity applied.
**FRs covered:** FR1, FR2, FR41, FR-AUTH-1, FR-AUTH-2, FR-AUTH-3, FR-AUTH-4, FR-AUTH-5, FR-AUTH-6, FR46, FR47

### Epic 2: Year Setup & Roster Management
Teacher can configure the school year: import roster via CSV, assign color levels, configure word-count matrix, manage mid-year roster changes, and reset for a new year.
**FRs covered:** FR3, FR4, FR5, FR6, FR7, FR8, FR9, FR10, FR11, FR43, FR44, FR45

### Epic 3: Dictation Capture & Scoring (Laptop)
Teacher can create dictations, enter error counts on the condensed class grid with keyboard-first UX, save with auto-calculated global %, edit past dictation error counts, and see inline promotion indicators during entry.
**FRs covered:** FR12, FR13, FR14, FR15, FR16, FR17, FR18, FR19, FR20, FR21, FR22, FR42

### Epic 4: Student Progress, Levels & Parent Meetings
Teacher can view auto-generated student dossiers with progression curves, manage level promotions across all surfaces, and present factual parent-meeting snapshots in ~30 seconds.
**FRs covered:** FR23, FR24, FR25, FR26, FR27, FR28, FR29, FR30, FR31, FR32, FR33, FR34, FR35, FR36

### Epic 5: Mobile Dictation Capture
Teacher can capture dictation errors on mobile via the dictation hub and hybrid per-student entry form with quick-tap mode.
**FRs covered:** FR37, FR38, FR39, FR40

### Epic 6: Daily Workflow Polish
Teacher benefits from smoother daily workflows: persistent navigation while scrolling, clearer dictation setup guidance, faster grid entry with lighter tooltips, and the ability to correct dictation metadata after creation.
**FRs covered:** FR16 (amendment), FR48, FR49, FR50

### Epic 7: Post-MVP — Auth Recovery & Dossier Analytics
Teacher can recover a forgotten password without support intervention, and explore category error trends alongside the global curve during parent meetings.
**FRs covered:** FR-AUTH-7, FR-AUTH-8, FR-DOSSIER-1, FR-DOSSIER-2 (new — see stories below)
**Source ideas:** IDEA-001, IDEA-004 (triaged 2026-09-02)

## Epic 1: Foundation & Teacher Access

Teacher can register, log in, and navigate the application shell with brand identity applied.

### Story 1.1: Project Scaffold & Development Environment

As a developer,
I want a greenfield Next.js 16 project with layered monolith structure and EU-hosted database connectivity,
So that all subsequent features are built on a consistent, deployable foundation.

**Acceptance Criteria:**

**Given** a fresh repository
**When** the scaffold is initialized
**Then** the project runs on Node.js 22 LTS with Next.js 16.3.2, React 19, TypeScript 5.x, Tailwind CSS, and shadcn/ui
**And** the folder structure matches the architecture seed (`app/(auth)/`, `app/(dashboard)/`, `components/`, `lib/domain/`, `lib/services/`, `lib/db/`, `drizzle/`)
**And** Drizzle ORM connects to Neon Postgres (Frankfurt) via `DATABASE_URL`
**And** Vercel deployment config targets EU region
**And** `AUTH_SECRET` and `DATABASE_URL` are documented as required environment variables

### Story 1.2: Teacher Registration

As a primary teacher,
I want to create an account with my email and password,
So that I can access my class data securely.

**Acceptance Criteria:**

**Given** I am on the registration page and no account exists for my email
**When** I submit a valid email and password
**Then** a Teacher record is created with `Teacher.id` equal to the Auth.js `users.id`
**And** I am redirected to the login page with a success message
**And** if the email is already registered, I see a generic error without revealing whether the email exists (NFR9)

### Story 1.3: Teacher Login & Session Management

As a primary teacher,
I want to log in with my email and password,
So that I can access my authenticated dashboard.

**Acceptance Criteria:**

**Given** I have a registered account
**When** I submit valid credentials on the login page
**Then** an authenticated session is created via Auth.js v5
**And** I am redirected to the dashboard
**And** if credentials are invalid, I see a generic error message without indicating which field failed (NFR9)
**And** unauthenticated access to dashboard routes redirects to login

### Story 1.4: First-Login Class Creation

As a primary teacher logging in for the first time,
I want to create my class for the current school year,
So that my roster and dictations are scoped to my classroom.

**Acceptance Criteria:**

**Given** I am authenticated and have no Class yet
**When** I complete the class creation form with a school year label (e.g. « 2025-2026 »)
**Then** a Class record is created linked to my Teacher account
**And** all subsequent data operations are scoped to this `classId` (NFR1)
**And** if I already have a Class, I skip this step and land on the dashboard

### Story 1.5: Design System Tokens & Brand Theme

As a primary teacher,
I want the application to reflect the CHAMPIONS Menthe Douce visual identity,
So that the interface feels calm, legible, and consistent with École Saint Hermeland branding.

**Acceptance Criteria:**

**Given** the shadcn/ui base theme is installed
**When** the app renders any page
**Then** CSS tokens implement Theme C: primary `#059669`, accent `#7C3AED`, promotion-ready `#2563EB`, trend-up/down/flat, and four level-badge colors (UX-DR1, UX-DR2)
**And** typography tokens apply DM Sans Light for display titles and monospace `data-lg` for numeric highlights (UX-DR3)
**And** spacing tokens define grid-cell-min 44px, grid-row-height 40px, app-bar-min-height 64px (UX-DR4)
**And** no orange appears in any UI token (UX-DR1)
**And** primary buttons use mint fill; accent outline buttons use violet border (UX-DR7)

### Story 1.6: App Shell with Navigation & App Bar

As a primary teacher on laptop,
I want a consistent app bar and four-tab navigation,
So that I can reach Dictées, Élèves, Config, and Alertes from any screen.

**Acceptance Criteria:**

**Given** I am authenticated on a viewport ≥ 1024px
**When** I view any dashboard page
**Then** the app bar displays the CHAMPIONS method wordmark at 52px height (width auto, `object-fit: contain`) — no separate subtitle (UX-DR5)
**And** four tabs are visible: Dictées · Élèves · Config · Alertes (FR41, UX-DR12)
**And** the active tab is highlighted with the primary mint color
**And** tab navigation works without full page reload
**And** on viewports 768–1023px, tabs persist with responsive layout (UX-DR26)
**And** all UI microcopy is in French (NFR14)

### Story 1.7: Auth Form UX & Registration Security

As a primary teacher,
I want clearer and safer registration and login forms,
So that I can create my account confidently and sign in without friction.

**Acceptance Criteria:**

**Given** I am on the registration page
**When** I interact with the password fields
**Then** each password field displays a visibility toggle (œil) to show or hide typed characters
**And** a « Confirmation du mot de passe » field is required; submit is blocked if passwords do not match
**And** a bordered requirements inset displays « Saisissez un mot de passe comportant au moins : » with real-time satisfied/unsatisfied state for:
  • 8 caractères
  • 1 chiffre
  • 1 minuscule
  • 1 majuscule
  • 1 caractère spécial
  • Correspondance des deux mots de passe
**And** a Google reCAPTCHA v2 checkbox (« Je ne suis pas un robot ») is required before submit; the server verifies the token
**And** server-side validation enforces the same password rules (not only client-side)
**And** all registration labels, requirement text, and error messages are in French
**And** existing NFR9 is preserved: generic error on failure, no email-exists leak

**Given** I am on the login page
**When** I interact with the password field
**Then** the password field displays a visibility toggle (œil) to show or hide typed characters
**And** all login labels and error messages are in French
**And** no captcha is shown on login

### Story 1.8: Public Landing Page & CHAMPIONS App Bar Branding

As a primary teacher (or prospective user),
I want a branded landing page with clear auth entry points and consistent CHAMPIONS branding in the app bar,
So that I can discover the method and reach login/registration quickly, and authenticated sessions skip the public page.

**Acceptance Criteria:**

**Given** I am not authenticated
**When** I visit `/`
**Then** I see the full « La méthode CHAMPIONS » hero image centered on the page
**And** I see two primary CTAs: « Se connecter » (links to `/login`) and « Créer un compte » (links to `/register`)
**And** all microcopy is in French (NFR14)
**And** the dev scaffold copy is removed

**Given** I am authenticated
**When** I visit `/`
**Then** I am redirected to `/dictations` (existing onboarding/class guards still apply)

**Given** I am authenticated on any dashboard page
**When** I view the app bar
**Then** the CHAMPIONS wordmark logo is displayed (replacing Hermeland logo and « champions » subtitle)
**And** logo height follows existing tokens (40px mobile / 52px laptop)
**And** the logo is not clickable in MVP

## Epic 2: Year Setup & Roster Management

Teacher can configure the school year: import roster via CSV, assign color levels, configure word-count matrix, manage mid-year roster changes, and reset for a new year.

### Story 2.1: CSV Roster Import

As a primary teacher,
I want to import my class roster from a single-column CSV file,
So that I can set up my student list quickly at year start.

**Acceptance Criteria:**

**Given** I am on the Config tab with an empty roster
**When** I upload a UTF-8 CSV with header `NOM + prénom` and one student per row
**Then** Student records are created scoped to my Class with `display_name` from each row (FR3)
**And** empty rows are skipped silently
**And** if the file is not UTF-8, I see « Fichier non UTF-8. Réexportez depuis votre logiciel. » (FR4)
**And** if the header is wrong or extra columns exist, I see a format error (FR4)
**And** if duplicate names exist (case-insensitive trim), the entire import is rejected with duplicates listed (FR4)
**And** if zero valid rows remain, I see an empty-roster error (FR4)

### Story 2.2: Manual Student Add & Roster List

As a primary teacher,
I want to manually add students and view my active roster,
So that I can manage my class list without relying solely on CSV import.

**Acceptance Criteria:**

**Given** I am on the Élèves tab
**When** I add a student manually with a display name
**Then** a new Student record is created on my active roster (FR5)
**And** the student appears in the roster list with their name and level status
**And** I can view all active (non-archived) students on the Élèves tab

### Story 2.3: Level Assignment & Color-Dot Picker (E1)

As a primary teacher,
I want to assign a CHAMPIONS color level to each student,
So that leveled students become eligible for dictation grids.

**Acceptance Criteria:**

**Given** a student exists on my roster without an assigned level
**When** I tap a color dot (yellow, green, violet, gold) on their row in Élèves
**Then** the student's level is set and a LevelHistoryEntry is recorded with action `assigned` (FR7, FR8)
**And** the student becomes visible on future dictation grids
**And** students without a level show a « niveau requis » badge and are hidden from dictation grids (FR9)
**And** a warning count appears on the Élèves tab when unassigned students exist (UX-DR22)

### Story 2.4: Word-Count Matrix Configuration (F1)

As a primary teacher,
I want to configure the dictation × color-level word-count matrix,
So that global percentages use the correct denominators per student level.

**Acceptance Criteria:**

**Given** I am on the Config tab
**When** I edit the word-count matrix table
**Then** rows represent dictations (by label) and columns represent four color levels (yellow, green, violet, gold) (FR10)
**And** each cell accepts an integer word count > 0
**And** the matrix is persisted scoped to my Class
**And** dictation save is blocked later if a required matrix cell is empty for a present student's level

### Story 2.5: Year-Start Wizard (E3)

As a primary teacher after CSV import,
I want a guided 3-step wizard,
So that I confirm my roster, assign all levels, and configure the word matrix before the first dictation.

**Acceptance Criteria:**

**Given** I have just completed a successful CSV import
**When** the year-start wizard opens
**Then** Step 1 lets me review and confirm the roster (remove duplicates, confirm names) (FR11)
**And** Step 2 requires level assignment for all students before proceeding (FR11, UX-DR19)
**And** Step 3 requires word-count matrix configuration (FR11)
**And** I can navigate back between steps
**And** on wizard completion, the Dictées tab unlocks « Nouvelle dictée »
**And** I cannot skip level assignment before the first scored dictation

### Story 2.6: Mid-Year Roster Changes & Student Archiving

As a primary teacher,
I want to add arriving students and archive departing ones,
So that my roster reflects mid-year class changes without losing history.

**Acceptance Criteria:**

**Given** a student arrives mid-year
**When** I add them to the roster and assign a starting level
**Then** they appear on active grids with history starting from add date — no retroactive dictations (FR5, FR8)
**Given** a student departs mid-year
**When** I archive them from the roster
**Then** their dossier is preserved read-only, they are hidden from active grids, and they are never deleted (FR6, UX-DR28)
**And** archived students show an « Archivé » label and are filterable on Élèves
**And** if a dictation grid is open, the archived student's row is removed on next refresh

### Story 2.7: Empty Roster & Pre-Setup States

As a primary teacher with no roster configured,
I want clear guidance on what to do next,
So that I know how to get started.

**Acceptance Criteria:**

**Given** my roster is empty
**When** I visit Dictées or Config
**Then** I see « Importez votre liste d'élèves pour commencer. » with a primary CTA to Config CSV import (UX-DR22)
**And** dictation creation is disabled until roster and matrix are configured (FR13)

### Story 2.8: Annual Year Reset

As a primary teacher at year end,
I want to reset my class data for a new school year,
So that I can start fresh without needing to consult previous years.

**Acceptance Criteria:**

**Given** I am on the Config tab
**When** I click « Remettre à zéro pour la nouvelle année »
**Then** a confirmation modal warns that all students, dictations, levels, and settings will be permanently deleted (FR43)
**And** I can optionally enter a new school year label
**When** I confirm the reset
**Then** all Class-scoped data is deleted atomically in one transaction: students, dictations, entries, word matrix, level history, pending promotions (FR44)
**And** the Class entity and Teacher account are preserved
**And** I am redirected to the year-start wizard E3 (FR45)

## Epic 3: Dictation Capture & Scoring (Laptop)

Teacher can create dictations, enter error counts on the condensed class grid with keyboard-first UX, save with auto-calculated global %, edit past dictations, and see inline promotion indicators during entry.

### Story 3.1: Create Dictation

As a primary teacher,
I want to create a new dictation with a label and date,
So that I can start capturing error counts for a session.

**Acceptance Criteria:**

**Given** my roster has leveled students and the word-count matrix is configured
**When** I click « Nouvelle dictée » on the Dictées tab and enter a label and date (default today)
**Then** a Dictation record is created scoped to my Class (FR12)
**And** the dictation appears in the year history list
**And** if my roster is empty or no matrix row exists for this dictation, creation is blocked with an explanatory message (FR13)

### Story 3.2: Class Grid UI with Keyboard Navigation (A2)

As a primary teacher,
I want a condensed class grid for error entry,
So that I can capture all student errors in one view as fast as on paper.

**Acceptance Criteria:**

**Given** I open a dictation from the Dictées tab
**When** the class grid loads
**Then** rows show active leveled non-archived students only and columns show C H A M P I O N S (FR14)
**And** each cell accepts non-negative integer error counts
**And** Tab / Shift+Tab moves between cells in row-major order (C→S, then next student) (FR15)
**And** arrow keys move between cells when a cell is focused (FR15)
**And** digit keys 0–9 enter values directly in the focused cell (FR15)
**And** hover/tap on a column header shows the category name only — no definition text (FR16)
**And** grid cells have min 44×40px with horizontal scroll when viewport is narrow (UX-DR4, UX-DR10, UX-DR14)
**And** grid cells have `aria-label` = « {displayName}, {catégorie}, {valeur} erreurs » (UX-DR25)

### Story 3.3: Grid Validation & Save Blocking

As a primary teacher,
I want invalid error totals blocked before save,
So that I cannot record impossible error counts.

**Acceptance Criteria:**

**Given** I am editing the class grid
**When** any student row has Σ category errors > their word total for this dictation
**Then** the offending row/cell shows a destructive border (FR17)
**And** an inline message displays « Σ erreurs ({N}) > total mots ({M}) pour {displayName} » (UX-DR24)
**And** the Enregistrer button is disabled until all rows are valid
**And** save is also blocked when any single category error count > word total

### Story 3.4: Scoring Engine & Dictation Save

As a primary teacher,
I want to save the class grid and have global percentages calculated automatically,
So that I don't need to compute scores manually.

**Acceptance Criteria:**

**Given** all grid rows pass validation
**When** I click Enregistrer
**Then** one DictationEntry per leveled student is persisted with nine category error counts (FR20)
**And** global % is calculated as `(totalWords − min(Σerrors, totalWords)) / totalWords × 100`, clamped [0, 100], using the pure `lib/domain/scoring` module (FR20, NFR3, NFR4)
**And** per-student snapshots persist `levelAtSave`, `wordDenominator`, `globalPercent`, and nine error counts (FR21, AD-5)
**And** promotion detection runs via `lib/domain/promotion` after save, creating PendingPromotion records when thresholds are met
**And** all mutations go through Server Actions → application services → domain → DB transaction (NFR2)
**And** a success toast displays « Dictée enregistrée. »
**And** on save failure, a destructive toast shows « Enregistrement impossible. Réessayez. » with form data retained (UX-DR24)
**And** during save, the button shows a spinner and grid cells are locked (UX-DR23)

### Story 3.5: Edit Past Dictation

As a primary teacher,
I want to reopen and correct a past dictation,
So that I can fix data entry mistakes without losing history integrity.

**Acceptance Criteria:**

**Given** a dictation has been previously saved
**When** I reopen it from the Dictées tab and modify error counts
**Then** percentages are recalculated using the original `levelAtSave` and `wordDenominator` snapshot, not the student's current level (FR22)
**And** promotion detection re-runs from the edited dictation forward
**And** pending promotion alerts refresh accordingly
**And** dictation delete/purge remains unavailable (FR42)

### Story 3.6: Inline Promotion Indicators on Grid (D3/D3+)

As a primary teacher during dictation entry,
I want to see and act on promotion readiness directly on the grid,
So that I can validate level changes without leaving the capture flow.

**Acceptance Criteria:**

**Given** a student has a pending promotion after a previous save
**When** I view their row on the class grid
**Then** a ⬆️ indicator appears at row start (non-interactive) (FR18)
**And** a **+** button appears at row end when promotion criteria are met (FR19, UX-DR9)
**When** I tap **+**
**Then** a Valider/Refuser dialog opens (same as D1) without leaving the grid (FR19)
**And** confirming records the level change and updates the row's level dot and denominator
**And** at most one pending promotion exists per student across all surfaces (FR30)

## Epic 4: Student Progress, Levels & Parent Meetings

Teacher can view auto-generated student dossiers with progression curves, manage level promotions across all surfaces, and present factual parent-meeting snapshots in ~30 seconds.

### Story 4.1: Auto-Generated Student Dossier

As a primary teacher,
I want a per-student dossier that aggregates all dictations automatically,
So that I never need to manually assemble a student's history from class sheets.

**Acceptance Criteria:**

**Given** a student has one or more saved dictations
**When** I open their dossier from the Élèves tab
**Then** I see their complete dictation history without cross-referencing multiple grids (FR23)
**And** the dossier is scoped to my Class only (NFR1)
**And** if no dictations exist, I see « Aucune dictée enregistrée. » with an empty curve placeholder (UX-DR22)

### Story 4.2: Hero Curve & Collapsed Dictation Table (C1)

As a primary teacher,
I want a visual global progression curve and collapsible dictation detail,
So that I can quickly assess a student's trajectory.

**Acceptance Criteria:**

**Given** I am viewing a student's dossier
**When** the page loads
**Then** a hero global success curve is displayed at the top (FR24, UX-DR15)
**And** a dictation history table appears below, collapsed by default (FR25)
**When** I expand a dictation row
**Then** per-category error counts (C–S) are shown — counts only, no per-category percentages (FR25)
**And** the dossier layout uses max-w-4xl with side-by-side curve and table on wide screens (UX-DR15)
**And** a skeleton loader displays during cold load (UX-DR23)

### Story 4.3: Promotion Banner on Dossier (D1)

As a primary teacher,
I want a promotion banner on the student dossier,
So that I can validate or refuse level changes when reviewing a student.

**Acceptance Criteria:**

**Given** a student has a pending promotion
**When** I view their dossier
**Then** a banner displays « Prêt à monter → [niveau] » with Valider and Refuser buttons (FR26, UX-DR8)
**And** the banner uses promotion-ready blue styling with `role="alert"` (UX-DR8, UX-DR25)
**When** I tap Valider
**Then** the student's level updates, history records action `promoted`, and pending state clears (FR29, FR33)
**When** I tap Refuser
**Then** the level stays unchanged, history records action `refused`, pending clears, and the consecutive-dictation streak resets (FR31, FR33)

### Story 4.4: Manual Level Override & Level History

As a primary teacher,
I want to manually change a student's color level at any time,
So that I retain full pedagogical control independent of auto-detection.

**Acceptance Criteria:**

**Given** I am on a student's dossier or the Élèves roster
**When** I manually set or change the student's color level
**Then** the level updates immediately and a LevelHistoryEntry records action `manual` (FR27, FR33)
**And** any pending promotion alert for that student is cleared (FR30)
**And** future promotion detection recalculates from the override forward
**And** the dossier displays current level badge with text label alongside color dot (UX-DR25)

### Story 4.5: Promotion Detection Rules

As a primary teacher,
I want the system to detect promotion readiness automatically,
So that I am alerted when students meet consecutive-dictation thresholds.

**Acceptance Criteria:**

**Given** a student has saved dictations
**When** promotion detection runs after a dictation save
**Then** yellow→green readiness requires 2 consecutive dictations with global % > 90% (FR28)
**And** green→violet readiness requires 2 consecutive dictations with global % > 90%
**And** violet→gold readiness requires 2 consecutive dictations with global % > 95%
**And** gold (max level) never surfaces readiness
**And** no automatic level change occurs — only a PendingPromotion record is created (FR29)
**And** detection logic lives exclusively in `lib/domain/promotion` (NFR3)

### Story 4.6: Alertes Promotion Queue (D2)

As a primary teacher,
I want a centralized alerts queue for pending promotions,
So that I can batch-review students ready to level up.

**Acceptance Criteria:**

**Given** one or more students have pending promotions
**When** I open the Alertes tab
**Then** I see a list of students with pending promotions, processable one-by-one (FR32)
**And** the tab badge shows « N élèves prêts » (UX-DR17)
**When** I tap a student row
**Then** a Valider/Refuser dialog opens with the same behavior as D1
**And** first validate/refuse action wins across all surfaces (FR30)

### Story 4.7: Presentation Mode « RDV parents » (C3)

As a primary teacher before a parent meeting,
I want a full-screen factual snapshot of a student's progress,
So that I can orient the parent in about 30 seconds.

**Acceptance Criteria:**

**Given** I am on a student's dossier
**When** I tap « RDV parents »
**Then** a full-screen presentation mode opens with no app chrome (FR34, UX-DR16)
**And** the global curve is dominant with three factual highlights: last dictation %, trend delta, and current level badge using `data-lg` monospace typography (FR35, UX-DR11)
**And** trend = most recent % minus previous %; shows « — » when fewer than 2 dictations exist (FR35)
**And** per-category error counts are available on demand via a collapsed table toggle — no pedagogical narrative (FR36)
**And** the CHAMPIONS wordmark appears bottom-right at 44px height, opacity 0.85, 24px margin (UX-DR6)
**And** focus is trapped; Esc or « Fermer » exits; screen reader announces « Mode RDV parents, {displayName} » (UX-DR16, UX-DR25)
**And** no school grade (CE2, CM1, etc.) appears anywhere (NFR8)

## Epic 5: Mobile Dictation Capture

Teacher can capture dictation errors on mobile via the dictation hub and hybrid per-student entry form with quick-tap mode.

### Story 5.1: Mobile Dictation Hub (G2)

As a primary teacher on my phone,
I want a dictation-focused home screen,
So that I can quickly access mobile capture without the full laptop layout.

**Acceptance Criteria:**

**Given** I access the app on a viewport < 768px
**When** the mobile dictation hub loads
**Then** I see the last dictation label and date (FR40)
**And** shortcuts « Saisir » (opens student picker for B4 entry) and « Voir » (read-only summary) are available (FR40, UX-DR13)
**And** the app bar shows the CHAMPIONS wordmark at 40px height (UX-DR5)
**And** the G1 tab bar (Dictées · Élèves · Config · Alertes) is not shown — mobile is dictation-capture-only (UX-DR13)
**And** there is no drawer or navigation to Élèves, Config, or Alertes on mobile; those surfaces require a laptop (≥ 1024px)

### Story 5.2: Mobile Per-Student Entry Form (B4)

As a primary teacher on my phone,
I want to enter error counts one student at a time with large touch targets,
So that I can complete remaining entries without my laptop.

**Acceptance Criteria:**

**Given** I tap « Saisir » on the mobile hub for an open dictation
**When** the student picker loads
**Then** all active leveled non-archived students are listed
**And** students with an existing DictationEntry for this dictation show a « saisi » visual indicator (completion derived from persisted entry — no separate tracking entity)
**And** the picker subtitle shows how many students remain without an entry (e.g. « 3 restants »)
**Given** I select a student from the picker
**When** the per-student form loads
**Then** nine large numeric fields (one per CHAMPIONS category) are displayed full-width with min 48px height (FR37, UX-DR21)
**And** if the student already has an entry, fields are pre-filled with existing counts for correction
**And** each field uses `inputmode="numeric"` with min 44px touch targets (UX-DR21, UX-DR25)
**When** quick-tap mode is active
**Then** each tap increments the field value by +1 with no 0–3 cap (FR38)
**And** long-press or a dedicated field accepts manual numeric entry for any value, including decrease (FR38)
**When** I tap Enregistrer
**Then** the entry is saved via the same server-authoritative scoring and snapshot logic as the laptop grid (NFR2)
**And** I return to the student picker with updated completion counts

### Story 5.3: Unleveled Student Block on Mobile

As a primary teacher on my phone,
I want clear feedback when a student lacks a level,
So that I know I must assign one on my laptop before capturing errors.

**Acceptance Criteria:**

**Given** I select a student without an assigned color level on mobile
**When** I attempt to enter dictation errors
**Then** entry is blocked with « Niveau requis pour {displayName}. Assignez le niveau depuis un ordinateur. » (FR39)
**And** no DictationEntry is created until a level is assigned on laptop (Élèves tab)
**And** there is no mobile navigation to level assignment — laptop is required for E1

## Epic 6: Daily Workflow Polish

Teacher benefits from smoother daily workflows: persistent navigation while scrolling, clearer dictation setup guidance, faster grid entry with lighter tooltips, and the ability to correct dictation metadata after creation.

### Story 6.1: Config-First Hint Before « Nouvelle dictée »

As a primary teacher,
I want clear guidance when creating a dictation that labels must exist in the Config word-count matrix first,
So that I understand why a dictation may be missing from the picker and know where to add it.

**Acceptance Criteria:**

**Given** I am on the Dictées tab with a configured roster and word-count matrix
**When** I click « Nouvelle dictée »
**Then** the create-dictation dialog displays a short hint: dictation labels come from the Config word-count matrix — add new dictations there first (FR50)
**And** the hint includes a link or button « Aller à Config » that navigates to the Config tab (FR50)
**And** all hint microcopy is in French (NFR14)

**Given** the word-count matrix has no rows yet
**When** I click « Nouvelle dictée »
**Then** creation remains blocked per FR13
**And** the empty-state message still directs me to Config (existing Story 2.7 behavior preserved)

**Given** the matrix has rows but I have not yet created a dictation for a given label
**When** I open the create-dictation picker
**Then** only matrix-defined labels appear as selectable options (unchanged from Story 3.1)
**And** the config-first hint is visible so I do not confuse an empty picker with a bug

### Story 6.2: Category Header Hover — Title Only

As a primary teacher during fast grid entry,
I want column headers to show the category name on hover without the long definition text,
So that tooltips stay lightweight while I still disambiguate CHAMPIONS letters.

**Acceptance Criteria:**

**Given** I am viewing the class grid on a dictation (Story 3.2)
**When** I hover or tap a CHAMPIONS column header (C–S)
**Then** a tooltip or popover shows the category name only (e.g. « Conjugaison ») — no definition paragraph (FR16)
**And** the full definition text is not shown anywhere in the header hover/tap interaction

**Given** I need the full category definition
**When** I consult reference material outside the grid
**Then** definitions remain available in `error-categories.md` and project documentation — the grid does not surface them (FR16)

**Given** I use keyboard navigation on the grid
**When** focus moves to a column header
**Then** the same name-only tooltip behavior applies (UX-DR25, NFR13)

### Story 6.3: Sticky App Bar & Navigation Tabs

As a primary teacher on long dashboard pages,
I want the app bar and main tabs to stay visible while I scroll,
So that I can switch sections without scrolling back to the top.

**Acceptance Criteria:**

**Given** I am authenticated on a laptop viewport (≥ 1024px)
**When** I scroll a long dashboard page (Élèves roster, dictation grid, student dossier, Alertes queue)
**Then** the app bar remains fixed at the top of the viewport (FR48, UX-DR32)
**And** the G1 tab navigation (Dictées · Élèves · Config · Alertes) remains visible directly below or within the fixed shell (FR48, UX-DR32)
**And** page content scrolls underneath without layout jump or double scrollbars

**Given** I am on mobile (< 768px)
**When** I use the dictation hub (Story 5.1)
**Then** the mobile app bar remains fixed at the top during scroll (FR48, UX-DR32)
**And** G1 tabs remain hidden — mobile dictation-capture-only behavior is unchanged (UX-DR13)

**Given** I open presentation mode (Story 4.7)
**When** the full-screen RDV parents view is active
**Then** no dashboard app bar or G1 tabs are shown — presentation chrome rules unchanged (UX-DR16)

**Given** the sticky shell is applied
**When** I switch tabs or navigate between pages
**Then** the active tab highlight and CHAMPIONS wordmark sizing follow existing tokens (UX-DR5, UX-DR12)

### Story 6.4: Edit Dictation Label and Date

As a primary teacher,
I want to correct a dictation's label and date after creation,
So that typos and wrong session dates do not persist in history and dossiers.

**Acceptance Criteria:**

**Given** a dictation has been saved (with or without error entries)
**When** I open it from the Dictées tab history list
**Then** I can edit the dictation label and date (FR49)
**And** label is required (non-empty trimmed string)
**And** date accepts a valid calendar date (defaults unchanged if not edited)

**Given** I save updated label and/or date
**When** the mutation succeeds
**Then** the Dictées history list reflects the new label and date immediately (FR49)
**And** student dossier dictation history rows show the updated label and date (FR49)
**And** existing DictationEntry snapshots, global percentages, and promotion state are unchanged — only metadata is updated (FR49, NFR4)

**Given** I change only the date
**When** dossier or presentation mode sorts dictations chronologically
**Then** the dictation appears in the correct chronological position based on the new date (FR49)

**Given** I change the label to match an existing matrix row label
**When** I save
**Then** the update succeeds if the label exists in the word-count matrix (FR10, FR13)
**And** if the new label has no matrix row, save is blocked with a clear French error explaining the label must exist in Config

**Given** error counts were previously saved for this dictation
**When** I edit only metadata
**Then** I can still reopen and edit error counts via Story 3.5 without conflict (FR22, FR42)

## Epic 7: Post-MVP — Auth Recovery & Dossier Analytics

Teacher can recover a forgotten password without support intervention, and explore category error trends alongside the global curve during parent meetings.

### Story 7.1: Forgotten Password Reset Flow

As a primary teacher,
I want to reset my password via email when I forget it,
So that I can regain access without creating a new account or contacting support.

**Technical decisions (validé 2026-09-02) :**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Email provider | **Resend** (`resend` npm package) | Validé — DX Next.js, free tier 3 000/mois, pas de footer tiers dans l'email |
| Env vars | `RESEND_API_KEY`, `EMAIL_FROM` (e.g. `CHAMPIONS <noreply@votredomaine.fr>`) | Documenter dans `README.md` + `.env.example` |
| Sending region | `eu-west-1` (Irlande) sur le domaine Resend | Expédition depuis l'UE ; voir section RGPD pour le stockage |
| SDK / service | `lib/services/send-transactional-email.ts` wrapping `resend.emails.send()` | Point d'extension unique si changement provider futur |
| Token storage | New `password_reset_tokens` table: `id`, `teacher_id`, `token_hash`, `expires_at`, `used_at`, `created_at` | Store SHA-256 hash only — never persist raw token; single-use via `used_at` |
| Token lifetime | 60 minutes | Balance security vs teacher friction |
| Token delivery | Link: `{AUTH_URL}/reset-password?token={rawToken}` | Reuse existing `AUTH_URL` convention |
| Rate limiting | Extend `auth-rate-limit.ts` with kind `password-reset`: 3 requests / 15 min / IP | Stricter than login — prevents email spam abuse |
| Password update | Reuse `hashPassword` + `validatePasswordPolicy` from registration | Same FR-AUTH-3 rules, no divergent policy |
| Email template | Plain French HTML + text fallback; subject « Réinitialisation de votre mot de passe CHAMPIONS » | No marketing content; link button + expiry notice |
| Tracking | **Open/link tracking disabled** on all reset emails | Évite collecte IP/navigateur par Resend (voir RGPD) |
| Dev fallback | When `RESEND_API_KEY` absent: token created + reset URL logged to server console | Local testing without Resend account |

**RGPD — données transmises à Resend (sous-traitant Art. 28)**

Ce flux concerne **uniquement les comptes enseignants** — aucune donnée élève (noms, notes, dictées) ne transite par Resend.

| Donnée envoyée à l'API | Exemple | Donnée personnelle |
|------------------------|---------|-------------------|
| Email destinataire | `marie.dupont@ac-…` | ✅ Oui (enseignant) |
| Expéditeur | `CHAMPIONS <noreply@…>` | Faible |
| Objet + corps | Lien reset `{AUTH_URL}/reset-password?token=…` | ✅ Oui (token sensible 60 min) |
| Mots de passe | — | ❌ Jamais transmis |

**Données stockées par Resend (États-Unis, 30 jours sur free tier) :** contenu message, logs de livraison, métadonnées API, payloads webhooks. La région d'envoi `eu-west-1` (Irlande) ne change **pas** le lieu de stockage — toujours US ([Resend docs — Choosing a Region](https://resend.com/docs/dashboard/domains/regions)).

**Garanties contractuelles Resend :** DPA pré-signé actif à l'inscription ([resend.com/legal/dpa](https://resend.com/legal/dpa)), Clauses Contractuelles Types UE→US, EU-US Data Privacy Framework.

**Obligations projet (hors code story 7.1) :**
- Signer/accepter le DPA Resend (automatique à la création du compte)
- Mentionner Resend comme sous-traitant dans la politique de confidentialité / registre des traitements de l'établissement
- Documenter le transfert hors UE de l'email enseignant (finalité : récupération de compte)
- Configurer SPF/DKIM/DMARC sur le domaine d'envoi dans Resend

**Comparatif providers (référence — décision : Resend)**

Volume estimé : ~1–5 resets/mois. Alternatives évaluées avant validation Resend :

| Provider | Free tier | Retenu ? | Motif écart |
|----------|-----------|----------|-------------|
| **Resend** ✅ | 3 000/mois | **Validé** | DX Next.js, pas de footer, transfert US encadré DPA+CCT |
| Brevo | 300/jour | Écarté | Footer obligatoire free tier ; alternative si revue RGPD stricte EU-only |
| Mailgun | 100/jour | Écarté | Logs 1 jour, moins généreux |
| SendGrid | Trial 60 j | Écarté | Plus de free permanent |
| Amazon SES | 12 mois | Écarté | Config AWS lourde |

**Pre-build gate:** Configurer domaine d'envoi + DNS (SPF/DKIM) dans Resend et définir `EMAIL_FROM` avant `bmad-build` sur 7.1.

**Routes & pages:**

| Path | Purpose |
|------|---------|
| `/forgot-password` | Request form (email field + submit) |
| `/reset-password?token=…` | New password + confirmation (reuse `PasswordField`, `PasswordRequirements`) |
| Login page | Add link « Mot de passe oublié ? » below submit |

**Out of scope for 7.1:** email verification on registration, change-password while logged in, SMS recovery.

**Acceptance Criteria:**

**Given** I am on the login page
**When** I click « Mot de passe oublié ? »
**Then** I reach `/forgot-password` with a form asking for my registered email (FR-AUTH-7)
**And** all microcopy is in French (NFR14)
**And** the page reuses auth layout styling from login/register (UX-DR29/DR30 family)

**Given** I submit any email address on `/forgot-password`
**When** the request is processed
**Then** the UI always shows the same generic success message: « Si un compte existe pour cette adresse, un email de réinitialisation a été envoyé. » (NFR9 — no account enumeration)
**And** if the email matches a registered teacher, Resend delivers a reset email within 60 s (FR-AUTH-7)
**And** open/link tracking is disabled on the Resend send call (no IP or browser collection)
**And** if the email is unknown, no email is sent and no error reveals that fact (NFR9)
**And** the endpoint is rate-limited per IP via `password-reset` kind in `auth-rate-limit.ts`

**Given** a reset email is sent
**When** I open the message
**Then** it contains a single CTA link to `/reset-password?token=…` valid for 60 minutes
**And** the email states the link expires and to ignore the message if not requested
**And** the sender displays as `EMAIL_FROM`

**Given** I open a valid reset link within 60 minutes
**When** I submit a new password meeting FR-AUTH-3 rules with matching confirmation
**Then** my `password_hash` is updated in `teachers`
**And** the token is marked used (`used_at` set) — single-use (FR-AUTH-8)
**And** I am redirected to `/login` with a success flash: « Mot de passe mis à jour. Connectez-vous. »
**And** I can log in with the new credentials

**Given** I open an expired, already-used, or invalid token
**When** I visit `/reset-password`
**Then** I see a French error: « Ce lien n'est plus valide. » with a link to `/forgot-password`
**And** no password form is shown for invalid tokens

**Given** I am authenticated
**When** I visit `/forgot-password` or `/reset-password`
**Then** I am redirected to `/dictations` (consistent with `/register` middleware policy)

**Given** `RESEND_API_KEY` is absent in development
**When** a reset is requested for a valid email
**Then** the token is still created in DB
**And** the reset URL is logged to server console (dev only) so local testing works without Resend
**And** the UI still shows the generic success message

**Given** the password-reset email is sent via Resend
**When** reviewing what data leaves the application
**Then** only the teacher's email address, sender, subject, and reset link body are transmitted — no student data and no passwords (RGPD scope documented in story technical decisions)

**Given** I run the test suite
**When** password-reset flows are tested
**Then** Resend is mocked; token hashing, expiry, single-use, and rate limiting have unit/integration coverage
**And** no test sends real email

### Story 7.2: Global Curve Axis Labels and Y-Axis Scale

As a primary teacher preparing for a parent meeting,
I want the dossier global progression curve to show dictation names on the X-axis and a readable Y-axis scale,
So that I can orient myself on the chart without guessing which point is which dictation.

**Acceptance Criteria:**

**Given** a student dossier with at least two saved dictations
**When** I view the hero global curve (Story 4.2)
**Then** the X-axis shows dictation labels (truncated with tooltip on hover if needed) (FR-DOSSIER-1)
**And** the Y-axis shows ticks at 0, 20, 40, 60, 80, and 100 % with optional horizontal guide lines (FR-DOSSIER-1)
**And** the global % curve behavior is unchanged — only axis presentation improves

**Given** presentation mode (Story 4.7)
**When** the global curve is displayed
**Then** the same axis labels and Y-axis scale apply (FR-DOSSIER-1, NFR16)

**Given** only one dictation exists
**When** the curve renders
**Then** a single point is shown with appropriate axis labels — no layout break

**Given** I use keyboard or screen reader
**When** I focus the chart
**Then** the aria-label describes the curve and dictation count (NFR13)

### Story 7.3: Category Error Curves in Presentation Mode (RDV parents)

As a primary teacher in parent-meeting presentation mode,
I want to see how many errors occurred per CHAMPIONS category across dictations,
So that I can show parents where difficulties concentrate — without mixing percentages and raw counts on the same scale.

**Scope:** **Presentation mode (C3) only** — the regular student dossier (C1) keeps the global % curve unchanged. No category curves on the Élèves tab.

**Depends on:** Story 7.2 (X-axis dictation labels on the global curve; category chart shares the same X-axis alignment).

**UX design (locked for build):**

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Mode RDV parents — {student name}                          [Fermer]    │
├──────────────────────────────┬───────────────────────────────────────────┤
│  Réussite globale (%)        │  Erreurs par catégorie                      │
│  ┌────────────────────────┐│  ┌─────────────────────────────────────┐  │
│  │ GlobalSuccessCurve     ││  │ CategoryErrorCurves                 │  │
│  │ Y: 0–100 %             ││  │ Y: 0 … max(errors) entiers           │  │
│  │ (inherits 7-2 axes)    ││  │ Default: courbe C (Conjugaison) seule│  │
│  └────────────────────────┘│  └─────────────────────────────────────┘  │
│                              │  Même axe X (dictées chronologiques)     │
├──────────────────────────────┴───────────────────────────────────────────┤
│  [C][H][A][M][P][I][O][N][S]  ← toggles (contrôlent le panneau droit)     │
│  ● actif = lettre remplie, couleur catégorie (headerBackground)           │
│  ○ inactif = contour, muted                                               │
│  Pas de limite — les 9 courbes peuvent être actives simultanément         │
└──────────────────────────────────────────────────────────────────────────┘
        PresentationHighlights (last %, trend, level) — inchangé, en dessous
```

| Règle | Décision |
|-------|----------|
| Surfaces | **C3 presentation only** — `presentation-mode.tsx`; dossier C1 inchangé |
| Panneau droit — titre | **« Erreurs par catégorie »** (heading visible + `aria-label` sur la zone graphique) |
| Layout laptop | Deux colonnes côte à côte (≥1024px) |
| Layout tablette | **Empilé** — global % au-dessus, « Erreurs par catégorie » en dessous ; toggles sous les deux graphiques (**validé 2026-09-02**) |
| Panneau gauche | Courbe globale % existante (`GlobalSuccessCurve` + axes 7-2) — toujours visible |
| Panneau droit | Courbes d'**erreurs entières** par catégorie (pas de %) — une série par lettre active |
| Métrique Y (droite) | `categoryErrors` (entier ≥ 0) depuis le snapshot `dictation_entries` — voir `scoring-model.md` |
| Défaut | Seule la courbe **C (Conjugaison)** est active à l'ouverture ; toggle C en état actif |
| Limite | **Aucune** — les 9 catégories peuvent être affichées en même temps |
| Toggles | Rangée **sous** les deux graphiques, centrée ; contrôle uniquement le panneau droit |
| Couleurs | `CHAMPIONS_ERROR_CATEGORIES[].headerBackground` par courbe |
| Tooltip | `{label} — {categoryName}: {count} erreur(s)` |
| A11y | Toggles `aria-pressed` ; panneau droit `aria-label="Erreurs par catégorie"` |

**Interaction rules:**

- Toggles affect only the right panel — the global % curve (left) is independent and always shown.
- Activating a toggle adds a polyline; deactivating removes it immediately.
- Y-axis on the right auto-scales to `max(active category errors across dictations) + 1` with integer ticks only.
- X-axis dictation positions align between left and right panels (same chronological order by `dictationDate`).
- State resets each time presentation mode opens — default back to C only (no localStorage).
- Keyboard: Tab through toggles, Space/Enter to toggle.

**Component plan:**

- New `category-error-curves.tsx` — integer Y-axis chart, multi-series from snapshot error counts.
- New `category-curve-toggles.tsx` — 9 letter buttons, no max limit.
- New `presentation-charts-row.tsx` — two-column wrapper composing global + category charts + toggles below.
- `presentation-mode.tsx` replaces single `GlobalSuccessCurve` section with `PresentationChartsRow`.
- `students/[id]/page.tsx` (dossier C1) — **no changes** for this story.

**Acceptance Criteria:**

**Given** I open presentation mode (Story 4.7) for a student with saved dictations
**When** the full-screen view loads
**Then** I see two charts side by side on laptop (≥1024px): global % (left) and category errors (right) (FR-DOSSIER-2)
**And** only the **C (Conjugaison)** error curve is active on the right panel by default
**And** the C toggle appears in active state (filled, category color)

**Given** the right panel is visible
**When** I view the Y-axis
**Then** values are **integers** (error counts) — never percentages (FR-DOSSIER-2)
**And** the axis label or aria description makes clear these are error counts, not %

**Given** I click a category toggle (e.g. « H »)
**When** the chart updates
**Then** a curve appears showing integer error counts per dictation for that category
**And** the toggle shows active state
**And** existing active curves remain visible — no maximum limit

**Given** all nine toggles are active
**When** the chart renders
**Then** all nine category curves display simultaneously without error or performance degradation for a typical CE2 class year (~15–20 dictations)

**Given** I deactivate the C toggle
**When** the chart updates
**Then** the Conjugaison curve is removed
**And** other active curves remain

**Given** I am on the regular student dossier (Élèves → student, not presentation)
**When** I view the hero curve
**Then** only the global % curve is shown — no category error panel, no toggles (FR24 unchanged)

**Given** presentation mode on a viewport < 1024px (tablette)
**When** charts render
**Then** global curve stacks above the « Erreurs par catégorie » panel; toggles remain below both (**validé 2026-09-02**)

**Given** the right panel is visible
**When** I read the section heading
**Then** it displays **« Erreurs par catégorie »** (FR-DOSSIER-2)

**Given** a dictation has 0 errors in a category
**When** that category curve is active
**Then** the point shows 0 on the Y-axis (valid data point, not omitted)

**Given** I use keyboard navigation on toggles
**When** I press Space on a toggle
**Then** `aria-pressed` updates and screen readers announce the category name + affichée/masquée (NFR13)

**Pre-build gate:** Story 7.2 must be `done` (shared X-axis labels). Per-category error count metric defined in `scoring-model.md` (no % formula).

