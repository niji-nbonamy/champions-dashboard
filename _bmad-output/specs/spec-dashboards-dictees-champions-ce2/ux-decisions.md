# UX Decisions

Chosen interaction patterns for MVP. Implementation details live here; capabilities cite this companion.

## Navigation

| Context | Pattern |
|---|---|
| **Laptop** | **G1** — four tabs: Dictées · Élèves · Config · Alertes |
| **Mobile** | **G2** — dictation hub home (last dictation + shortcuts to enter or review) |

## Class-grid entry (laptop)

**A2 — Condensed grid**

- Rows = active students with an assigned color level only; unassigned students appear on Élèves tab, not on the grid.
- Columns = **C H A M P I O N S** (one letter per category).
- Category name only on hover/tap (e.g. « Conjugaison »); full definitions stay in `error-categories.md` but are not shown in grid header tooltips (amended Story 6.2).
- Tab key moves across cells for keyboard speed.
- Each cell holds a non-negative integer error count (same semantics as paper sheet tally marks).
- Global % auto-calculated per row after save.
- Save blocked with inline message when Σ errors > word total for any row.

## Class-grid entry (mobile)

**B4 — Hybrid per-student**

- Default: per-student form with nine large numeric fields (CAP-7) — accepts any non-negative integer.
- **Quick-tap mode**: one tap per category increments the error count by +1 (no 0–3 cap); long-press or a dedicated numeric field accepts manual entry for any value, including decrease.
- Entry blocked for students without an assigned level; redirect to level assignment (E1).
- Full mobile class-grid remains deferred (`mvp-scope.md`).

## Student sheet & parent meetings

**C1 — Hero curve + collapsed detail**

- Large global success curve at top.
- Dictation history table below, collapsed/expandable for per-category error counts (no percentages).

**C3 — Presentation mode**

- **« RDV parents »** button on student sheet opens full-screen view:
  - Global curve dominant.
  - Three factual highlights: last dictation %, trend (per `scoring-model.md`), current level badge.
  - No auto-generated pedagogical narrative.

## Level promotion — three surfaces + inline during entry

Teacher validates every promotion; no automatic level change.

| Surface | Pattern | When |
|---|---|---|
| **D1** | Banner on student sheet: « Prêt à monter → [niveau] » + Valider / Refuser | Anytime on dossier |
| **D2** | **Alertes** tab / queue: « N élèves prêts » — process one by one | Batch review, nothing missed |
| **D3** | ⬆️ indicator on student row in class grid when criteria met | During dictation entry |
| **D3+** | **+** button on grid row | During dictation entry — opens inline Valider / Refuser without leaving the grid |

The **+** control is available on the student row during entry when promotion criteria are met. Tapping **+** opens the same validate/refuse dialog as D1; confirming records the level change in history.

Teacher may also change level manually at any time from the student sheet or roster (see `level-system.md`).

## Initial level assignment

| Context | Pattern |
|---|---|
| **Year start** | **E3** — wizard after CSV import: (1) roster confirm → (2) assign levels post-evaluation → (3) word-count matrix |
| **Mid-year arrival** | **E1** — student list with color-dot picker per row |

Students without an assigned level are blocked from scored dictations until level is set.

## Year config — word-count matrix

| Pattern | Description |
|---|---|
| **F1** | Editable table: rows = dictations, columns = four color levels (yellow, green, violet, gold), cells = word count (integer > 0) |
| **F3** | CSV import for matrix — **deferred** post-MVP (see `mvp-scope.md`) |

## Deferred UX

- Full mobile class-grid (horizontal scroll of 9 categories).
- Per-category percentages and per-category progression curves on student sheet.
- Word-count matrix CSV import (F3).
