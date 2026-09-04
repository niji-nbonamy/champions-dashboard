# Future Ideas

Product ideas and enhancements captured during development — not committed work.

**Triage during:** sprint planning (`bmad-sprint-planning`), course correction (`bmad-correct-course`), epic retrospective (`bmad-retrospective`), or epic/story creation (`bmad-create-epics-and-stories`).

## Related artifacts

| File | Purpose |
|------|---------|
| This file | New product ideas, UX improvements, feature wishes |
| `../implementation-artifacts/deferred-work.md` | Technical debt, review deferrals, scope split from Build |
| `../specs/spec-dashboards-dictees-champions-ce2/mvp-scope.md` | MVP in/out scope decisions (locked at spec time) |
| `epics.md` | Formal backlog — promote ideas here when ready |

## How to capture

1. Add a new `### IDEA-NNN` entry under **Ideas** (increment the number).
2. Set **Status** to `captured`.
3. Fill **Area**, **Summary**, and **Context** (one or two sentences each).
4. On triage, update **Status** and optional **Promoted to** when an epic/story is created.

## Status legend

| Status | Meaning |
|--------|---------|
| `captured` | Logged, not yet reviewed |
| `considering` | Under discussion or needs refinement |
| `scheduled` | Accepted; will become epic/story in a named sprint or epic |
| `rejected` | Out of scope or not worth pursuing (keep for history) |
| `done` | Shipped or superseded by implemented work |

## Areas (pick one)

`auth` · `roster` · `dictation` · `promotion` · `dossier` · `config` · `mobile` · `navigation` · `scoring` · `levels` · `infra` · `ux` · `other`

## Template

```markdown
### IDEA-NNN — Short title (YYYY-MM-DD)

- **Status:** captured
- **Area:** <area>
- **Summary:** One sentence — what the user/teacher would get.
- **Context:** Why it came up; pain or opportunity.
- **Related:** Optional — FR ids, spec paths, deferred-work bullets, screenshots.
- **Promoted to:** Optional — epic/story key when scheduled (e.g. `4-8-…`, `epic-6`).
```

## Triage sessions

### 2026-09-02 — Post-MVP (Epic 6 retro action item #5)

**Context:** MVP backlog complete (Epics 1–6, 36 stories). Two ideas remain in `considering`.

| Idea | Decision | Rationale | Next step |
|------|----------|-----------|-----------|
| IDEA-001 | **scheduled** → Epic 7 / 7-1 | Ops blocker before wide rollout | **Resend validé** — DPA + DNS domaine avant build |
| IDEA-004 | **scheduled** → Epic 7 / 7-2 + 7-3 | Erreurs entières en C3 uniquement — panneau droit RDV parents, défaut C, pas de limite | 7-2 = axes global % ; 7-3 = courbes erreurs entières |
| IDEA-002–006 | **done** | Shipped in Epic 6 | — |

**Recommended Epic 7 order:** 7-1 (auth) → 7-2 (curve polish) → 7-3 (per-category curves). Auth is P1 for production; curve enhancements are P2 UX.

**Out of scope for Epic 7 (stay deferred):** dictation delete/purge, matrix CSV import, full mobile class grid — per `mvp-scope.md`.

---

## Ideas

<!-- Add new entries below. Newest at the bottom of this section. -->

### IDEA-001 — Forgotten password reset (2026-08-28)

- **Status:** scheduled
- **Promoted to:** epic-7 / 7-1
- **Area:** auth
- **Summary:** Teacher can request a password reset flow when they forget their login password.
- **Context:** Auth covers register and login (FR1); no self-service recovery exists today — teachers locked out must rely on manual support or a new account.
- **Related:** Epic 1 auth stories (`spec-1-2-teacher-registration`, `spec-1-3-teacher-login-session-management`); deferred-work rate-limiting / security hardening items.
- **Triage (2026-09-02):** P1 post-MVP. **Provider validé : Resend** (`RESEND_API_KEY`, région envoi `eu-west-1`, DPA+CCT, tracking désactivé). Voir section RGPD story 7-1.

### IDEA-002 — Sticky app bar and navigation tabs (2026-08-28)

- **Status:** done
- **Promoted to:** epic-6 / 6-3
- **Area:** navigation
- **Summary:** Keep the top banner (app bar) and main tab navigation fixed while scrolling dashboard content.
- **Context:** Long pages (roster, dictation grid, student dossier) scroll the shell away — teachers lose quick access to tabs and branding until they scroll back up.
- **Related:** `spec-1-6-app-shell-with-navigation-app-bar`; `app-bar.tsx`, `nav-tabs.tsx`.

### IDEA-003 — Edit dictation label and date (2026-08-31)

- **Status:** done
- **Promoted to:** epic-6 / 6-4
- **Area:** dictation
- **Summary:** Teacher can correct a dictation's label and date after creation (typo, wrong date, session moved).
- **Context:** Story 3.5 only allows editing error counts on reopen; metadata is fixed at create time — manual corrections require workarounds or living with bad labels/dates in history and dossier.
- **Related:** `spec-3-1-create-dictation`, `spec-3-5-edit-past-dictation` (counts only); FR12, FR22, FR42; `dictation-lifecycle.md`.

### IDEA-004 — Interactive dossier progression curves (2026-08-31)

- **Status:** scheduled
- **Promoted to:** epic-7 / 7-2, 7-3
- **Area:** dossier
- **Summary:** In presentation mode (RDV parents), a second chart beside the global % curve shows per-category **error counts** (integers) as togglable curves — default C (Conjugaison) active; toggles C–S below the charts; no max limit.
- **Context:** Global-only curve (story 4.2) insufficient for spotting category-specific trends before parent meetings; errors are counts not percentages. MVP deferred per-category metrics (`mvp-scope.md`). **Refined 2026-09-02:** C3 only (not dossier C1); dual-panel layout; integer Y-axis on right.
- **Related:** `spec-4-2-hero-curve-collapsed-dictation-table-c1`; `global-success-curve.tsx`; `mvp-scope.md` deferred « Per-category % and per-category curves »; FR24–FR25.
- **Triage (2026-09-02):** Story 7-3 — **C3 presentation only**, panneau droit erreurs entières, défaut C actif, toggles sous les courbes, pas de limite max. Story 7-2 garde les axes du panneau global %.

### IDEA-005 — Category header hover: title only, no definition (2026-08-31)

- **Status:** done
- **Promoted to:** epic-6 / 6-2
- **Area:** dictation
- **Summary:** On the class grid (Dictées → dictation), category column headers show the category name on hover/tap but not the long definition text.
- **Context:** Full name + definition tooltip (FR16, story 3.2) feels noisy during fast entry; teachers know the CHAMPIONS categories — keep the title (e.g. « Conjugaison ») for disambiguation, drop definition from hover/popover.
- **Related:** `spec-3-2-class-grid-ui-with-keyboard-navigation-a2`; `category-header.tsx`; FR16; `error-categories.md`.

### IDEA-006 — Config-first hint before « Nouvelle dictée » (2026-08-31)

- **Status:** done
- **Promoted to:** epic-6 / 6-1
- **Area:** ux
- **Summary:** When creating a dictation from the Dictées tab, show clear guidance that dictation labels must exist in the Config word-count matrix first (with link to Config).
- **Context:** « Nouvelle dictée » opens a picker fed only by matrix rows — not obvious when working in Dictées; teachers may not realize they must add the dictation on Config before it appears here (story 2.7 covers empty roster / missing matrix blocking, not this mental-model gap once setup is complete).
- **Related:** `spec-2-4-word-count-matrix-configuration-f1`, `spec-2-7-empty-roster-pre-setup-states`, `spec-3-1-create-dictation`; `create-dictation-dialog.tsx`, `dictations/page.tsx`; FR10, FR13.

### IDEA-007 — Suivi orthophoniste sur la fiche élève (2026-09-04)

- **Status:** done
- **Area:** roster
- **Summary:** L'enseignant peut indiquer si un élève est en suivi orthophoniste ; un pictogramme « profil + ondes sonores » apparaît juste après le nom (listes, grille dictée, fiche élève) lorsque le suivi est actif.
- **Context:** Information utile au quotidien (adaptations, repères visuels en classe) mais absente du modèle actuel (`students` : nom, niveau, archivé). Le suivi peut démarrer ou s'arrêter en cours d'année.
- **Décisions produit :**
  - **Pas dans le CSV d'import** — fichier roster inchangé (colonne « NOM + prénom » seule).
  - **Wizard étape 2 « Niveaux »** — case à cocher + pictogramme par élève, en même temps que l'assignation des niveaux (`step-levels.tsx` / `RosterList`).
  - **Édition en cours d'année** — même contrôle (case + pictogramme) sur la ligne liste Élèves **et** sur la fiche élève (bloc à côté du niveau, sur le modèle `LevelDotPicker`).
  - **Nouvel élève** — case à cocher libellée « Suivi orthophoniste » dans `add-student-form.tsx` (décochée par défaut).
  - **Contrôle d'édition** — case à cocher + pictogramme adjacent (compromis lisibilité / compacité) ; sauvegarde immédiate (server action, comme les niveaux).
  - **Affichage informatif** — pictogramme **après le nom** lorsque actif : `roster-list.tsx`, en-tête de ligne grille (`class-grid.tsx`), titre fiche élève (`students/[id]/page.tsx`). Grille dictée : **affichage seul** (pas d'édition pendant la saisie des erreurs).
  - **Mode présentation (RDV parents)** — **masqué** : information interne enseignant, non exposée aux parents (`presentation-mode.tsx` inchangé).
  - **Schéma DB** — colonne booléenne sur `students` (ex. `has_speech_therapy`), `NOT NULL DEFAULT false` : élèves déjà en base = sans suivi jusqu'à action explicite ; `npm run db:push` après `schema.ts`.
  - **Élèves archivés** — pictogramme conservé après le nom si suivi actif ; case à cocher **désactivée** (lecture seule, pas d'édition depuis liste ni fiche).
- **Related:** `lib/db/schema.ts`, `app/onboarding/year-start/step-levels.tsx`, `app/(dashboard)/students/roster-list.tsx`, `level-dot-picker.tsx`, `add-student-form.tsx`, `components/grid/class-grid.tsx`, `app/(dashboard)/students/[id]/page.tsx` ; pictogramme profil + ondes (SVG).
- **Promoted to:** —
