# Roster Import & Management

## CSV import format

| Property | Value |
|---|---|
| Columns | **One column only** |
| Header | `NOM + prénom` |
| Rows | One student per row (full name as displayed in class) |
| Encoding | UTF-8 required |

Example:

```csv
NOM + prénom
DUPONT Marie
MARTIN Lucas
BERNARD Emma
```

- No color level in CSV — initial level is assigned by the teacher after the **beginning-of-year evaluation** (see `level-system.md`).
- Manual student entry (add one name at a time) remains available as fallback.

## Import validation

| Condition | Behavior |
|---|---|
| Non-UTF-8 file | Reject with encoding error message |
| Wrong header or extra columns | Reject with format error message |
| Empty rows | Skipped silently |
| Duplicate names (case-insensitive trim) | Reject entire import; list duplicates |
| Zero valid rows after parse | Reject with empty-roster message |

## Initial level assignment

After CSV import or manual roster setup, the teacher sets each student's starting color level based on the year-start CHAMPIONS evaluation.

### Students without an assigned level

- **Hidden from dictation grids** — no row on class grid or mobile per-student entry.
- **Visible on roster / Élèves tab** with a « niveau requis » indicator.
- **Blocked from scored dictations** until level is set (see `ux-decisions.md` E1/E3).
- Dossier exists but shows no scored dictation history until first level assignment.

## Mid-year roster changes

The roster is **not frozen** at year start. The teacher can at any time:

| Action | Expected behavior |
|---|---|
| **Add student** | New row in active roster and new dossier; teacher assigns starting level manually; history starts at add date (no retroactive dictations) |
| **Remove student (departure)** | Student **archived** — dossier preserved read-only, hidden from active grids and new dictation entry, **not deleted** |

### Archiving during open dictation

- If a student is archived while a dictation grid is open, their row is removed on next refresh; unsaved counts for that row are discarded (see `dictation-lifecycle.md`).

Archived students remain consultable for historical reference (e.g. partial-year progression if needed).
