# Epic 6 Context: Daily Workflow Polish

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

This epic smooths the teacher's daily rhythm on the CHAMPIONS dashboard: navigation stays reachable while scrolling long pages, dictation setup is easier to understand before creating a session, grid entry stays fast with lighter column-header tooltips, and dictation label/date typos can be corrected after save without touching scored data. These are polish improvements on top of existing dictation, grid, and config flows — no new capabilities beyond UX clarity and metadata correction.

## Stories

- Story 6.1: Config-First Hint Before « Nouvelle dictée »
- Story 6.2: Category Header Hover — Title Only
- Story 6.3: Sticky App Bar & Navigation Tabs
- Story 6.4: Edit Dictation Label and Date

## Requirements & Constraints

- **Config-first guidance:** The create-dictation dialog must explain that selectable labels come from the Config word-count matrix, with a French « Aller à Config » action. Empty-matrix blocking and empty-roster blocking from earlier epics remain unchanged.
- **Lightweight grid tooltips:** Column header hover/tap/focus shows the CHAMPIONS category name only (e.g. « Conjugaison ») — no definition paragraph in the grid. Full definitions stay in reference docs, not in the grid UI.
- **Sticky navigation:** On laptop (≥ 1024px), the app bar and G1 tabs (Dictées · Élèves · Config · Alertes) stay fixed while page content scrolls underneath — no layout jump or double scrollbars. On mobile (< 768px), only the mobile app bar stays fixed; G1 tabs stay hidden (dictation-capture-only). Presentation mode keeps full-screen chrome with no dashboard app bar or tabs.
- **Dictation metadata edit:** Teachers can correct a saved dictation's label and date. Label is required (non-empty trimmed). Date must be a valid calendar date. Updated label/date must appear immediately in Dictées history and student dossier rows. Chronological sorting must reflect a changed date.
- **Snapshot integrity:** Editing label or date must not alter existing DictationEntry snapshots, global percentages, or promotion state — metadata only.
- **Label validation:** New label must match an existing word-count matrix row; otherwise save is blocked with a clear French error. Error-count editing on the same dictation must remain available without conflict.
- **Accessibility & locale:** Keyboard focus on grid headers follows the same name-only tooltip behavior. All new microcopy in French. WCAG 2.2 AA target applies.

## Technical Decisions

- **Mutation path:** State changes go through Server Actions → application services → domain validation → database transaction; UI revalidates or navigates after success.
- **Metadata vs snapshots:** Dictation label and date are mutable metadata on the `Dictation` entity. Per-student `DictationEntry` snapshot fields (`levelAtSave`, `wordDenominator`, `globalPercent`, nine category counts) are immutable per save — metadata edits must not trigger recalculation or promotion re-detection.
- **Matrix as label source of truth:** Dictation labels are constrained to rows defined in the word-count matrix (F1). Picker options and metadata edits both enforce this rule.
- **Sticky shell implementation:** Apply fixed positioning to the shared dashboard app shell (app bar + G1 tabs) so individual page content scrolls independently. Preserve existing design tokens for app bar min-height (64px), wordmark sizing, and active tab styling.
- **Category constants:** Nine CHAMPIONS categories (C–S) are compile-time/domain constants; tooltip content pulls name only from the established category reference.

## UX & Interaction Patterns

- **Laptop shell:** CHAMPIONS wordmark left in app bar; G1 tabs visible below or inline within the fixed shell on all long dashboard pages (roster, grid, dossier, Alertes queue).
- **Mobile exception:** Mobile dictation hub keeps a fixed top app bar during scroll; no Élèves/Config/Alertes tab bar on phone.
- **Presentation exception:** Full-screen RDV parents view excludes all dashboard chrome — sticky shell rules do not apply there.
- **Create-dictation dialog:** Show config-first hint alongside the label picker so an empty or partial picker is understood as a setup step, not a bug.
- **Grid headers:** Replace verbose hover content with a short name-only tooltip/popover; teachers who need definitions consult documentation outside the grid.

## Cross-Story Dependencies

- **6.1** extends dictation creation (Epic 3) and empty-matrix blocking (Epic 2); preserves Story 2.7 empty-state behavior when the matrix has no rows.
- **6.2** amends the class grid from Epic 3 — changes header hover only, not scoring or save logic.
- **6.3** affects all laptop G1 surfaces from Epics 2–5; must not regress mobile hub (Epic 5) or presentation mode (Epic 4).
- **6.4** depends on word-count matrix (Epic 2) for label validation and on dictation save/edit flows (Epic 3) for coexistence with error-count reopening.
