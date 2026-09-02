# Scoring Model

## Global percentage

**Global %** = correct words ÷ total words for that dictation, expressed as a percentage.

- **Numerator:** `correct words = total words − min(Σ category errors, total words)`
- **Denominator:** total words for that student at their **color level at save time**, looked up from the year-config matrix (dictation × level — four level columns).
- **Range:** clamp result to [0, 100]. Block save when Σ category errors > total words (see `dictation-lifecycle.md`).

## Per-category data

### Per-category error counts (presentation mode — Story 7.3)

Les erreurs par catégorie sont des **entiers** (0, 1, 2, …) — pas des pourcentages. Une catégorie CHAMPIONS ne représente pas une part du total de mots ; un % par catégorie serait trompeur.

**Valeur affichée** (une catégorie, une dictée sauvegardée) :

```
categoryErrorCount = snapshot error count for that CHAMPIONS letter (C–S)
```

- Source : colonnes d'erreurs snapshottées sur `dictation_entries` au moment de la sauvegarde.
- Plage : entier ≥ 0.
- Aucun calcul de dénominateur — lecture directe du snapshot.

**Règles d'affichage :**

- Courbes d'erreurs **uniquement** en mode présentation RDV parents (C3) — panneau droit, axe Y entier.
- Le dossier élève (C1) et la grille de saisie restent inchangés.
- La table dictée dépliée continue d'afficher les comptes bruts — pas de % par catégorie (FR25 inchangé).
- Par défaut en C3 : seule la courbe **C (Conjugaison)** est active.

### Raw error counts (unchanged elsewhere)

No per-category percentage anywhere — **global % only** outside the presentation error-curve panel.

- Nine error-count columns (C–S) are captured on the class grid per `error-categories.md`.
- The student dossier dictation table may show raw error counts per category on expand — counts only, never percentages in the table.

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

- Global curve is front and center (left panel); optional category **error-count** curves on the right (Story 7.3).
- Dictation table provides per-category **error counts** on demand (no per-category %).
- No auto-generated interpretation — facts and percentages (global only) plus integer error trends.
