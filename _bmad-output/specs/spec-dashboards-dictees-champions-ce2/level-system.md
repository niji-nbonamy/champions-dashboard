# Level System

## Color levels

Four levels in ascending order: **yellow → green → violet → gold** (jaune · vert · violet · or).

- There is **no red level**.
- Each student works at one color level that can change during the school year.
- Student dossier displays current level badge and full level-change history (date, color, action).

## Initial level (year start)

Each student's starting color level is set by the teacher after the **beginning-of-year evaluation** — not imported from CSV and not auto-assigned.

- Teacher assigns level per student once the evaluation is complete.
- First history entry records the initial level (date + color, action = `assigned`).
- Mid-year arrivals: teacher assigns starting level manually when adding the student.

## Promotion rules

| From level | Condition for promotion readiness |
|---|---|
| Yellow → green | 2 consecutive saved dictations with global % > 90% |
| Green → violet | 2 consecutive saved dictations with global % > 90% |
| Violet → gold | 2 consecutive saved dictations with global % > 95% |
| Gold (max) | No further promotion — system never surfaces readiness |

Global % uses the scoring model in `scoring-model.md`. "Consecutive" means the two most recent saved dictations in chronological order with no gap.

## Detection vs execution

| Step | Behavior |
|---|---|
| Detection | Automatic — system evaluates consecutive-dictation thresholds after each save |
| Execution | Mandatory teacher validation per case — no automatic level change |

## Pending promotion state

Each student has at most one **pending promotion** at a time (target next level).

- All surfaces (D1 banner, D2 queue, D3 indicator, D3+ **+** button) read the same pending state.
- First **validate** or **refuse** action wins; other surfaces sync immediately (idempotent).
- Pending state clears on validate, refuse, or manual level override.

## Teacher validation workflow

Promotion can be actioned from **three surfaces** plus inline during dictation entry (see `ux-decisions.md`):

| Surface | Action |
|---|---|
| Student sheet (D1) | Banner « Prêt à monter → [niveau] » + Valider / Refuser |
| Alerts queue (D2) | Tab Alertes — process ready students one by one |
| Class grid (D3) | ⬆️ indicator on row when criteria met |
| Class grid **+** (D3+) | **+** button on row during entry — inline Valider / Refuser without leaving the grid |

When promotion criteria are met:

1. System surfaces readiness via banner, queue entry, row indicator, and/or **+** button.
2. Teacher chooses **validate** or **refuse** explicitly.
3. On **validate:** level updates; history entry recorded (date, new color, action = `promoted`).
4. On **refuse:** level unchanged; history entry recorded (date, proposed color, action = `refused`); pending alert dismissed. The consecutive-dictation streak **resets** — teacher must achieve 2 consecutive qualifying dictations again before the next alert.

Teacher retains final pedagogical judgment on every promotion.

## Manual level override

The teacher can **manually set or change** any student's color level at any time — independent of promotion rules or alerts.

- Available from the student sheet or roster management.
- Every manual change is recorded in level-change history (date, new color, action = `manual`).
- Manual override clears any pending promotion alert and does not disable future auto-detected promotion alerts.
- Promotion detection recalculates from the override forward using the new level.
