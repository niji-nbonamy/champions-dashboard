# Epic 4 Context: Student Progress, Levels & Parent Meetings

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Give teachers a complete view of each student's dictation journey and level progression without assembling data manually: auto-generated dossiers with global success curves, centralized promotion management across grid/dossier/Alertes surfaces, manual level override with audit history, and a full-screen « RDV parents » presentation mode that orients a parent in about 30 seconds. Epic 3 delivered capture and inline promotion indicators; this epic turns saved dictation data into the teacher's primary review and parent-meeting workflow.

## Stories

- Story 4.1: Auto-Generated Student Dossier
- Story 4.2: Hero Curve & Collapsed Dictation Table (C1)
- Story 4.3: Promotion Banner on Dossier (D1)
- Story 4.4: Manual Level Override & Level History
- Story 4.5: Promotion Detection Rules
- Story 4.6: Alertes Promotion Queue (D2)
- Story 4.7: Presentation Mode « RDV parents » (C3)

## Requirements & Constraints

- Per-student dossier aggregates all saved dictations for that student, scoped to the teacher's Class only. No cross-referencing multiple grids.
- Empty state when no dictations: « Aucune dictée enregistrée. » with an empty curve placeholder.
- Hero global success curve at dossier top; dictation history table below, collapsed by default. Expanding a row shows per-category error counts (C–S) only — no per-category percentages.
- Dossier layout `max-w-4xl`; on wide screens curve and table side-by-side. Skeleton loader on cold load.
- Pending promotion surfaces as D1 banner « Prêt à monter → [niveau] » with Valider/Refuser on dossier; same Valider/Refuser behavior as grid D3+ dialog from Epic 3.
- Valider updates student level, records `promoted` in level history, clears pending. Refuser keeps level, records `refused`, clears pending, resets consecutive-dictation streak.
- Manual level change from dossier or Élèves roster at any time; records `manual` in level history; clears any pending promotion; future detection recalculates from override forward.
- Promotion detection after each dictation save: yellow→green and green→violet require 2 consecutive dictations with global % > 90%; violet→gold requires 2 consecutive > 95%; gold never surfaces readiness. No automatic level change — only a PendingPromotion record.
- At most one pending promotion per student across all surfaces; first validate/refuse wins (idempotent).
- Alertes tab lists students with pending promotions, badge « N élèves prêts »; row tap opens Valider/Refuser dialog matching D1.
- Presentation mode (C3): full-screen, no app chrome; dominant global curve; three factual highlights (last dictation %, trend delta, current level badge) in monospace `data-lg`; trend = most recent % minus previous %, « — » when fewer than 2 dictations; per-category errors on demand via collapsed toggle; CHAMPIONS wordmark bottom-right (44px height, opacity 0.85, 24px margin); focus trapped; Esc or « Fermer » exits; screen reader « Mode RDV parents, {prénom} ».
- No school grade (CE2, CM1, etc.) anywhere. French factual microcopy. WCAG 2.2 AA target. Laptop-first (≥1024px).

## Technical Decisions

- Mutation path unchanged: Server Actions → application services → domain validation → database transaction. Browser never computes authoritative scores or promotion outcomes.
- Scoring and promotion rules live exclusively in `lib/domain/scoring` and `lib/domain/promotion` — dossier display and presentation mode read persisted snapshots, they do not recompute formulas.
- Key paths: dossier at `app/(dashboard)/students/[id]/`; dossier orchestration in `lib/services/dossier` (or equivalent); presentation at `app/(dashboard)/students/[id]/present/`; Alertes tab at `app/(dashboard)/alerts/`.
- Data reads: `DictationEntry` rows with immutable `level_at_save`, `word_denominator`, `global_percent`, nine error counts. `PendingPromotion` (one per student) and `LevelHistoryEntry` (actions: `assigned`, `promoted`, `refused`, `manual`).
- Reuse Epic 3 promotion services (`validate-student-promotion`, `refuse-student-promotion`, `list-pending-promotions`) and `promotion-dialog` component — D1, D2, and D3+ must share identical validate/refuse semantics.
- Archived students: dossier preserved read-only; excluded from active grids but history remains viewable.
- UUID v4 primary keys; `timestamptz` in DB. Request/refresh — no WebSockets. Never log student names in production info logs.

## UX & Interaction Patterns

- **Dossier (C1):** Student name in `display` typography (28px weight 300). Level badge with color dot and text label. Curve is the visual anchor; table is secondary detail.
- **Promotion banner (D1):** Flat `promotion-ready` blue (`#2563EB`) fill, `role="alert"`, Valider (mint primary) / Refuser (outline).
- **Alertes (D2):** Tab badge count; list rows open same Valider/Refuser dialog as D1/D3+.
- **Manual override:** Level dot picker pattern from Élèves roster (E1); immediate update with history entry.
- **Presentation (C3):** Full viewport, accent-violet outline « RDV parents » entry on dossier. Three highlight cards in `data-lg` monospace. Collapsed per-category table toggle — factual counts only, no narrative. Logo fixed bottom-right per brand spec.
- **Theme:** Mint primary for Valider; promotion-ready blue for D1/D3/D3+; accent violet for RDV parents CTA; no orange anywhere.

## Cross-Story Dependencies

- **Epic 3 (prerequisite):** Saved `DictationEntry` rows, `PendingPromotion` records, inline grid D3/D3+, and save-time promotion detection must exist. Dossier and Alertes consume the same pending state.
- **Within epic:** 4.1 (dossier shell + history list) → 4.2 (curve + collapsed table) → 4.3 (D1 banner) builds on dossier page. 4.4 (manual override) can parallel 4.2–4.3 but needs dossier/roster surfaces. 4.5 (detection rules) validates save-path detection introduced in Epic 3 and ensures cross-surface consistency. 4.6 (Alertes D2) depends on pending promotions and shared validate/refuse. 4.7 (C3 presentation) depends on dossier data and curve from 4.2.
- **Epic 5 (parallel):** Mobile capture reuses the same scoring snapshots; dossier/presentation remain laptop workflows in MVP.
