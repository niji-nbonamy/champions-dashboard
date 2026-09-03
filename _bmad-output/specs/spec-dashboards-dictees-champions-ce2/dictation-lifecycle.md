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
- Correcting a past dictation recalculates that dictation's stored percentages using the **level and denominator snapshot from the original save** — not the student's current level — for students who already have an entry.
- **Partial capture (desktop):** when some leveled students already have entries and others do not (e.g. after mobile per-student entry, or a student added to the roster after an earlier save), the reopen grid shows all current leveled students. A single **Enregistrer** on the class grid may **UPDATE** existing entries and **INSERT** missing ones in one transaction:
  - **Existing entry:** only error counts and `globalPercent` change; `levelAtSave` and `wordDenominator` stay frozen.
  - **Missing entry:** new row inserted with the student's **current** level and matrix-derived denominator at save time (same rules as first save).
- **Historical roster (frozen):** when the dictation roster is frozen (archived participant on the dictation, or a departed student still in entries), the grid shows only entry holders. Save cannot add new students on desktop; an explicit French error is shown if the payload includes unauthorized students (`DICTATION_SAVE_ROSTER_MISMATCH_ERROR` in `dictation-save-messages.ts`). Use mobile per-student entry only when the roster is not frozen.
- Promotion detection re-runs for every student updated or newly inserted on save; pending alerts refresh accordingly.

## Archive interaction

- If a student is archived while a dictation grid is open, their row is removed on next refresh; unsaved counts for that row are discarded.
- Archived students remain on historical dictation records they participated in before archival (read-only in dossier).

## Out of scope (MVP)

- Deleting a dictation or purging history.
- Reordering dictations beyond chronological date order.
