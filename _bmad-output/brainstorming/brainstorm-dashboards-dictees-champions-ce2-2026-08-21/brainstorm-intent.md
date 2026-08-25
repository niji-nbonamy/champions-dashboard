# Brainstorm Intent — CHAMPIONS Dictation Dashboards (CE2)

> **Note:** This document is the original brainstorm capture. The canonical contract lives in `_bmad-output/specs/spec-dashboards-dictees-champions-ce2/`. This file has been aligned with spec decisions as of 2026-08-24.

## Problem / Goal

CE2 teachers using the CHAMPIONS dictation method track errors on handwritten class sheets (one row per student, columns per error category, one sheet per dictation). The bottleneck is reconstructing a single student's progression across all sheets before parent meetings. The app should provide per-student progression curves and factual summaries at meeting time — without sacrificing the speed and anywhere flexibility of today's workflow.

## Users & Context

- **Primary user:** CE2 classroom teacher using the CHAMPIONS method.
- **Key moment:** Parent meetings (RDV parents) — need a quick, objective snapshot of each child's progress.
- **Operational context:** Student roster importable and maintainable during the year; dictation program and word counts known upfront; each student works at a color-coded level (**yellow → green → violet → gold**) that can change during the year. Initial level is set after the beginning-of-year evaluation.

## Core Jobs to Be Done

1. **Record errors easily** after each dictation — as fast and natural as the current paper grid.
2. **Review progression** before a parent meeting — global curve + dictation history at a glance.
3. **Brief parents in ~30 seconds** — facts and curve only; no auto-generated pedagogical narrative.

## Key Product Decisions

### CHAMPIONS error categories

Nine fixed columns from the method acronym (not teacher-configurable):

| Letter | Category |
|---|---|
| C | Conjugaison |
| H | Homophones |
| A | Accords |
| M | Majuscules |
| P | Ponctuation |
| I | Illisibilité |
| O | Orthographe |
| N | Néant / Non-présent / Non-sens |
| S | Son |

### Data model

- **Input:** Class grid per dictation (same fill logic as paper: student row × nine CHAMPIONS category columns). Laptop grid uses condensed letter columns C–S with tooltips.
- **Output:** Auto-generated per-student dossier aggregating all dictations — teacher never manually assembles student views.
- **Student sheet:** Dictation table + one global success curve (% per dictation). Category breakdown lives in the table, not as separate curves.
- **Year config:** Student roster (CSV import + manual add) + matrix of word counts per dictation × color level (four levels). Optional CSV import for the word matrix.

### Roster

- **CSV import:** Single column `NOM + prénom`, one student per row.
- **Mid-year changes:** Add arriving students; archive departing students (read-only dossier, hidden from active grids, not deleted).
- **Initial level:** Assigned by teacher after beginning-of-year evaluation — not in CSV.

### UX

- Digital entry mirrors paper **logic** (row/column grid), not pixel-perfect visual layout.
- Handwriting remains the speed benchmark; laptop is the primary screen (config + parent-meeting views).
- **Navigation:** four tabs on laptop (Dictées · Élèves · Config · Alertes); dictation hub on mobile.
- **Parent meetings:** hero curve + collapsed table on student sheet; dedicated « RDV parents » full-screen presentation mode.
- **Mobile:** hybrid per-student entry (numeric fields + quick-tap mode); full mobile class-grid deferred.
- **Level promotion surfaces:** banner on student sheet, alerts queue, grid-row indicator, and **+** button during dictation entry — all require explicit validate/refuse.
- Teacher can manually change any student's level at any time.

### Scoring

- **Global %** = correct words ÷ total words for that dictation.
- **Per-category %** auto-calculated from error counts (impossible to do by hand today — key app value-add).
- Denominator per student follows their current color level; dictation total word count pre-filled from year config (four-level matrix).
- Parent meeting view: global curve front and center; table provides category detail on demand.

### Levels

- **Four levels** (no red): **yellow → green → violet → gold** (jaune · vert · violet · or).
- **Promotion rules:** 2 consecutive dictations > 90% → next level; reaching gold from violet requires 2 consecutive > 95%.
- **Detection:** automatic; **execution:** mandatory teacher validation per case (banner, queue, or inline **+** on grid).
- **Manual override:** teacher can set or change level at any time; all changes recorded in history.

## MVP Scope Hints

| In scope | Deferred |
|---|---|
| Condensed class-grid dictation entry (C–S columns) + inline promotion **+** | Per-category curves on student sheet |
| Auto per-student dossier & global curve | Full mobile class-grid view |
| Year config: CSV roster, word matrix (editable + optional CSV) | Pixel-perfect paper layout replica |
| Roster: mid-year add, departures archived | Auto pedagogical interpretation for parents |
| Auto % (global + per category) | |
| Four color levels with 90%/95% rules + multi-surface validation | |
| Level badge + history; manual level edit | |
| « RDV parents » presentation mode | |
| Hybrid mobile per-student entry | |

## Constraints & Non-Goals

- **No auto interpretation** for parents — present facts and curves only; teacher owns the narrative.
- **Teacher validates all level-ups** — app detects readiness, teacher decides; manual override always available.
- **Do not force identical visual layout** to the paper sheet; preserve fill logic only.
- Laptop-first; mobile is a secondary capture path, not full feature parity.
- Departed students archived, never deleted.

## Resolved Since Brainstorm

- CHAMPIONS error-category taxonomy: 9 categories (C–S acronym).
- CSV roster format: single column `NOM + prénom`.
- Mobile UX: hybrid per-student + quick-tap (B4); full mobile grid deferred.
- Departed students: archived read-only.
- Initial level: post-evaluation assignment, not CSV, not auto-defaulted.
- Levels: four levels only — **no red**; jaune · vert · violet · or.

## Open Questions

_None remaining in spec as of 2026-08-24._
