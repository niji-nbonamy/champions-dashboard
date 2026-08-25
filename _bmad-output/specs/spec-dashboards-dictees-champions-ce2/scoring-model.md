# Scoring Model

## Global percentage

**Global %** = correct words ÷ total words for that dictation, expressed as a percentage.

- **Numerator:** `correct words = total words − min(Σ category errors, total words)`
- **Denominator:** total words for that student at their **color level at save time**, looked up from the year-config matrix (dictation × level — four level columns).
- **Range:** clamp result to [0, 100]. Block save when Σ category errors > total words (see `dictation-lifecycle.md`).

## Per-category data

No per-category percentage is calculated or displayed — **global % only**.

- Nine error-count columns (C–S) are captured on the class grid per `error-categories.md`.
- The student dossier dictation table may show raw error counts per category on expand — counts only, never percentages.

## Denominator rules

| Input | Source |
|---|---|
| Dictation total word count | Pre-filled from year config (dictation × level matrix) |
| Per-student denominator | Student's color level **at save time** — snapshotted on each dictation row |
| Class-grid entry | Dictation total pre-filled; per-row denominator adjusts to each leveled student's current level |
| Level change after save | Does **not** retroactively change stored dictation rows or historical % |

## Trend (presentation mode)

**Trend** = signed delta between the last two saved dictations for that student:

`trend = global % (most recent) − global % (previous)`

- Display: arrow up / down / flat with the numeric delta (e.g. `+4 pts`, `−2 pts`, `=`).
- If fewer than two dictations exist, show `—` (no trend).

## Parent-meeting presentation

- Global curve is front and center.
- Dictation table provides per-category **error counts** on demand (no per-category %).
- No auto-generated interpretation — facts and percentages only.
