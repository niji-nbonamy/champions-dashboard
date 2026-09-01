# Epic 5 Context: Mobile Dictation Capture

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Let teachers finish dictation error capture on a phone when they cannot use the laptop grid: a dictation-focused mobile hub (G2) surfaces the last dictation with quick shortcuts, and a per-student hybrid entry form (B4) with large touch targets and quick-tap mode completes remaining students one at a time. Epic 3 delivered the full class grid and authoritative save path on laptop and tablet; this epic extends that same scoring and snapshot logic to viewports below 768px only — without feature parity on phone. Roster, config, dossiers, and alerts remain available on tablet (768–1023px) and laptop (≥ 1024px) via the existing G1 shell; this epic does not change those bands.

## Stories

- Story 5.1: Mobile Dictation Hub (G2)
- Story 5.2: Mobile Per-Student Entry Form (B4)
- Story 5.3: Unleveled Student Block on Mobile

## Responsive Breakpoints

Three bands govern layout — do not conflate the mobile threshold (768px) with the laptop-first design target (1024px):

| Band | Viewport | Shell | Dictation capture | Élèves / Config / Alertes |
| --- | --- | --- | --- | --- |
| **Mobile** | `< 768px` | G2 hub replaces G1 tab bar | B4 per-student form only (no class grid) | **Unavailable** — no drawer, no hidden nav |
| **Tablet** | `768–1023px` | G1 four-tab shell (unchanged by Epic 5) | Class grid (A2), horizontally scrollable | **Available** — responsive G1 layout (UX-DR26) |
| **Laptop** | `≥ 1024px` | G1 four-tab shell, optimal spacing | Full class grid (A2) | **Available** — primary design target |

Implementation note: use **768px** (`md` in Tailwind) as the G2 vs G1 routing threshold. Use **1024px** (`lg`) only for layout density (logo 52px, dossier side-by-side, etc.) — not for feature gating.

## Requirements & Constraints

- Mobile experience activates **only** on viewports `< 768px`. The tablet band (`768–1023px`) keeps the existing G1 tabs and all laptop workflows; Epic 5 does not redesign tablet layouts or add G2 routing there.
- G2 hub is the mobile home for dictation: shows last dictation label and date; shortcuts « Saisir » (opens student picker → B4) and « Voir » (read-only summary).
- Mobile is dictation-capture-only: G1 tab bar (Dictées · Élèves · Config · Alertes) is hidden below 768px. No drawer or navigation to Élèves, Config, or Alertes on phone — teachers use a tablet or laptop (≥ 768px) for those surfaces.
- B4 per-student form lists active, leveled, non-archived students in a picker. Students with an existing `DictationEntry` for the dictation show a « saisi » indicator; subtitle shows remaining count (e.g. « 3 restants »). Completion is derived from persisted entries — no separate tracking entity.
- Nine full-width numeric fields (one per CHAMPIONS category), min 48px height, `inputmode="numeric"`, min 44px touch targets. Pre-fill when an entry already exists.
- Quick-tap mode: tap cycles 0→1→2→3 per field; long-press or a dedicated input accepts values ≥ 4.
- Save uses the same server-authoritative scoring, validation, and immutable snapshot rules as the laptop grid (global %, `levelAtSave`, `wordDenominator`, nine error counts). Browser never computes authoritative scores or promotion outcomes.
- Unleveled students on mobile: entry blocked with « Niveau requis pour {displayName}. Assignez le niveau depuis un ordinateur. » (`displayName` = stored name, trim only). No `DictationEntry` created; no mobile path to level assignment — E1 remains on G1 Élèves tab (tablet or laptop, ≥ 768px).
- No full mobile class grid, no promotion validate/refuse on mobile, no dossier or presentation mode below 768px in MVP. Tablet and laptop retain full G1 feature set.
- French factual microcopy. WCAG 2.2 AA target. No school grade (CE2, CM1, etc.) anywhere.

## Technical Decisions

- Mutation path unchanged: Server Actions → application services → domain validation → database transaction. Reuse `lib/domain/scoring`, `lib/domain/promotion`, and dictation-save orchestration from Epic 3 — do not duplicate formulas in UI.
- Key paths: mobile hub and B4 entry under `app/(dashboard)/dictations/[id]/mobile/` (per capability map). G2 routing applies **only below 768px** — redirect or render G2 instead of G1 shell. At 768px and above, existing G1 routes and layouts are unchanged.
- Data model unchanged: `Dictation` → `DictationEntry` per student with `level_at_save`, `word_denominator`, `global_percent`, `errors_c` through `errors_s`. Word denominators from `WordCountMatrixRow` keyed by dictation label × student level.
- Save validation mirrors laptop grid: block when Σ category errors > word total or any single category > word total for that student's level.
- After save, promotion detection may run as on laptop, but mobile does not surface D3/D3+ or validate/refuse UI — teacher handles promotions on G1 (tablet or laptop, ≥ 768px).
- Request/refresh data model — no WebSockets. Concurrent laptop + mobile sessions may show stale completion counts until navigation refresh; acceptable per architecture AD-9.
- UUID v4 primary keys; `timestamptz` in DB. Never log student names in production info logs.

## UX & Interaction Patterns

- **Mobile hub (G2):** CHAMPIONS wordmark in app bar at 40px height; app bar min-height 64px. Last dictation prominent; « Saisir » and « Voir » as primary actions. When all students are entered, hub may show completion state (e.g. « Dictée complète »).
- **Student picker:** Large list rows; « saisi » badge on completed students; remaining count in subtitle.
- **Per-student form (B4):** Full-width stacked fields; quick-tap cycling for common low counts. « Enregistrer » saves and returns to picker with updated counts. Prev/next navigation between students via arrows (not swipe) for MVP simplicity.
- **Unleveled block:** Destructive or warning message on mobile; no alternate action below 768px — teacher must switch to tablet or laptop for E1 level assignment.
- **Sheets over dialogs** on mobile where interaction patterns from laptop use modals.
- **Theme:** Mint primary for Enregistrer; reuse existing spacing tokens (`grid-cell-min` 44px, logo heights 40px mobile / 52px laptop); no orange anywhere.

## Cross-Story Dependencies

- **Epic 3 (prerequisite):** Dictation creation, `DictationEntry` persistence, scoring engine, and save validation must exist. Mobile save must call the same service path as the laptop grid.
- **Epic 2 (prerequisite):** Roster with assigned color levels and word-count matrix. Unleveled students are excluded from capture; Epic 5 only surfaces the block message.
- **Within epic:** 5.1 (G2 hub + mobile shell routing) → 5.2 (student picker + B4 form + quick-tap + save) → 5.3 (unleveled block) can ship with 5.2 but is a distinct acceptance surface.
- **Epic 4 (parallel):** Dossier, Alertes, and presentation mode remain G1 workflows on tablet and laptop; below 768px, mobile does not surface dossier, Alertes, or promotion validate/refuse UI.
- **Inherited debt (non-blocking):** `saveDictation` integration test, shared `usePromotionAction` hook, and accessibility pass on D3+/presentation remain open from Epic 4 retro — not gates for Epic 5 delivery.
