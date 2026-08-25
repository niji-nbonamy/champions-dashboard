# Dictation Lifecycle

## Create

- Teacher creates a dictation from the **Dictées** tab: label (free text) and date (defaults to today).
- New dictation appears in year history and opens the class grid for active students with an assigned color level.
- Dictation cannot be created when the active roster is empty or no word-count matrix row exists for that dictation.

## Save

- Class-grid save persists one row per active, leveled student: nine category error counts (integers ≥ 0).
- Save is blocked when:
  - Any leveled student row has Σ category errors > that student's word total for the dictation.
  - Any single category error count > that student's word total for the dictation.
  - Any matrix cell required for a present student's level is empty or zero.
- On successful save, the system snapshots per student: color level, word denominator, and global % (see `scoring-model.md`). Promotion detection runs after save.

## Edit

- Teacher may reopen a past dictation grid and correct error counts.
- Correcting a past dictation recalculates that dictation's stored percentages using the **level and denominator snapshot from the original save** — not the student's current level.
- Promotion detection re-runs from the edited dictation forward; pending alerts refresh accordingly.

## Archive interaction

- If a student is archived while a dictation grid is open, their row is removed on next refresh; unsaved counts for that row are discarded.
- Archived students remain on historical dictation records they participated in before archival (read-only in dossier).

## Out of scope (MVP)

- Deleting a dictation or purging history.
- Reordering dictations beyond chronological date order.
