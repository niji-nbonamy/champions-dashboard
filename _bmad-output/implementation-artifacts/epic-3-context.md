# Epic 3 Context: Dictation Capture & Scoring (Laptop)

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Enable teachers to run the core CHAMPIONS dictation workflow on laptop: create dictations, enter per-student error counts on a condensed class grid as fast as paper, save with server-calculated global percentages and immutable per-row snapshots, correct past entries without corrupting history, and surface promotion readiness inline during capture. This epic is the operational heart of the product — everything in Epic 2 (roster, levels, word matrix) exists to make scored dictation capture possible.

## Stories

- Story 3.1: Create Dictation
- Story 3.2: Class Grid UI with Keyboard Navigation (A2)
- Story 3.3: Grid Validation & Save Blocking
- Story 3.4: Scoring Engine & Dictation Save
- Story 3.5: Edit Past Dictation
- Story 3.6: Inline Promotion Indicators on Grid (D3/D3+)

## Requirements & Constraints

- Dictation creation requires a non-empty roster of leveled students and a configured word-count matrix row for that dictation label; creation is blocked otherwise with an explanatory message.
- Class grid shows only active, leveled, non-archived students. Rows = students, columns = nine fixed CHAMPIONS categories (C–S). Each cell accepts non-negative integers.
- Keyboard-first entry: Tab/Shift+Tab row-major navigation (C→S, then next student), arrow keys between cells, digit keys 0–9 direct entry, Enter to save when not editing a cell.
- Column headers reveal full category name and definition on hover/tap.
- Save blocked when any row has Σ category errors > word total for that student's level, or any single category count > word total. Inline destructive border and message « Σ erreurs ({N}) > total mots ({M}) pour {displayName} » on offending rows; Enregistrer disabled until valid.
- On save: one DictationEntry per leveled student with nine error counts; global % = `(totalWords − min(Σerrors, totalWords)) / totalWords × 100`, clamped [0, 100]. No per-category percentages anywhere.
- Per-student snapshots persist `levelAtSave`, `wordDenominator`, `globalPercent`, and nine error counts. Subsequent level changes must not retroactively alter stored snapshots.
- Past dictation edits recalculate using the original snapshot level and denominator, then re-run promotion detection forward from the edited dictation.
- After save, promotion detection may create PendingPromotion records (thresholds: yellow→green and green→violet require 2 consecutive dictations > 90%; violet→gold requires 2 consecutive > 95%). No automatic level change — teacher validates explicitly.
- Grid shows ⬆️ when a pending promotion exists; **+** button when criteria met, opening Valider/Refuser dialog without leaving grid. At most one pending promotion per student; first validate/refuse wins across all surfaces.
- Dictation lifecycle supports create, save, and edit only — no delete/purge in MVP.
- All mutations class-scoped; authorization enforced in application services. Browser never computes authoritative scores or promotion outcomes.
- French factual microcopy throughout. WCAG 2.2 AA target. Laptop-first (≥1024px); this epic does not implement mobile capture (Epic 5).

## Technical Decisions

- Mutation path: Server Actions → application services → domain validation → database transaction.
- Pure domain modules own business logic: `lib/domain/scoring` (global %, clamping) and `lib/domain/promotion` (consecutive-dictation detection). No formula duplication in UI or DB layers.
- Nine CHAMPIONS error categories are compile-time/domain constants in `lib/domain/error-categories.ts` — not teacher-configurable.
- Key paths: grid entry in `app/(dashboard)/dictations/` and `components/grid/`; orchestration in `lib/services/dictation-save`.
- Data model: `Dictation` (label, date, class-scoped) → `DictationEntry` per student with `level_at_save`, `word_denominator`, `global_percent`, `errors_c` through `errors_s`. Word denominators come from `WordCountMatrixRow` keyed by dictation label × student level.
- `PendingPromotion` created on save when thresholds met; inline grid actions (3.6) and Epic 4 surfaces read the same record.
- UUID v4 primary keys; `timestamptz` in DB. Request/refresh data model — no WebSockets.
- Never log student names in production info logs.

## UX & Interaction Patterns

- **Class grid (A2):** Condensed student × C–S matrix. Cells min 44×40px; horizontal scroll when viewport < 9 columns + name column. Centered integers; destructive border on validation failure.
- **Keyboard flow:** Tab row-major through cells; digits enter values directly; Enter saves grid when focus is not in cell edit mode.
- **Promotion indicators:** Non-interactive ⬆️ at row start (D3); circular promotion-ready blue **+** at row end (D3+) opening Valider/Refuser dialog — same behavior as dossier banner (D1).
- **Save states:** Enregistrer shows spinner during save; grid cells locked optimistically. Success toast « Dictée enregistrée. »; failure toast « Enregistrement impossible. Réessayez. » with data retained.
- **Accessibility:** Grid cell `aria-label` = « {displayName}, {catégorie}, {valeur} erreurs »; tab order matches row-major visual order. `{displayName}` is the stored student name as-is (trim only on input — no first/last-name split).
- **Theme:** Mint primary for Enregistrer/Valider; promotion-ready blue `#2563EB` for D3/D3+; no orange anywhere.

## Cross-Story Dependencies

- **Epic 2 (prerequisite):** Roster with assigned color levels, word-count matrix, and year-start wizard completion must exist before dictation creation or grid entry. Unleveled and archived students are excluded from grids.
- **Within epic:** 3.1 (create) → 3.2 (grid UI) → 3.3 (validation) + 3.4 (scoring/save) → 3.5 (edit) and 3.6 (promotion indicators) build on persisted entries.
- **Epic 4 (downstream):** Save triggers promotion detection and PendingPromotion creation; dossier, Alertes queue, and full promotion workflows consume the same pending state that 3.6 surfaces inline.
- **Epic 5 (parallel path):** Mobile per-student entry reuses the same server-authoritative scoring and snapshot logic as the laptop grid.
