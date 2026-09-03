# Deferred Work

## Deferred from: code review of spec-7-3-category-error-curves-in-presentation-mode-rdv-parents.md (2026-09-03)

- ESLint `set-state-in-effect` sur reset hover `GlobalSuccessCurve` — pattern identique introduit en 7-2 ; hors périmètre correctif 7-3 (`global-success-curve.tsx:141`)

## Deferred from: code review of spec-7-2-global-curve-axis-labels-and-y-axis-scale.md (2026-09-03)

- Chevauchement potentiel des labels X sur viewports étroits — limitation SVG responsive préexistante aggravée par plus de labels (`global-success-curve.tsx:48`)

## Deferred from: code review of spec-7-1-forgotten-password-reset-flow.md (2026-09-03)

- Sessions non invalidées après reset — Auth.js sessions restent valides après changement de mot de passe ; hardening sécurité hors périmètre story (`password-reset.ts:186-226`)
- Pas de rate limit sur submit reset — Non exigé par le spec ; seule la demande initiale est limitée (`reset-password/actions.ts`)
- Pas de purge des tokens expirés — Croissance table sans job de rétention ; concern ops post-MVP (`schema.ts:22-37`)
- FK sans `onDelete: cascade` — Pattern cohérent avec autres FK teachers ; suppression compte hors scope (`schema.ts:26-28`)
- Side-channel timing forgot-password — Chemin email connu plus coûteux que inconnu ; limitation inhérente à l'anti-énumération (`password-reset.ts:65-81`)

## Deferred from: code review of spec-6-4-edit-dictation-label-and-date.md (2026-09-01)

- Chronological sort after date-only change — no automated test covers dossier/history reordering (`list-dictations.ts:13`)

## Deferred from: code review of spec-6-3-sticky-app-bar-navigation-tabs.md (2026-09-01)

- Grid column z-index stacking vs shell untested — z-20 > z-10 correct by construction; visual/E2E defer (`class-grid.tsx:395`)
- AppBar `border-b` may leave ~1px heading overlap under scroll-mt — cosmetic; token uses min-height only (`app-bar.tsx:7`)
- iOS safe-area inset not applied to sticky `top-0` — device polish; out of MVP scope (`dashboard-chrome.tsx:29`)

## Deferred from: code review of spec-6-2-category-header-hover-title-only.md (2026-09-01)

- `ux-decisions.md` still documents name+definition hover — pre-existing doc drift; update when Epic 6 docs are reconciled
- Native `title` + custom popover double-tooltip risk — pre-existing Story 3.2 pattern; acceptable MVP
- No dedicated `category-header.test.tsx` — integration tests in `class-grid.test.tsx` sufficient for MVP
- `spec-3-2` documents historical name+definition tooltip — amend when convenient

## Deferred from: code review of spec-6-1-config-first-hint-before-nouvelle-dictée.md (2026-09-01)

- Dialog interaction tests (open modal, link click) — static markup tests sufficient for MVP; manual check covers click path
- ~~`#matrice-mots` anchor lacks scroll-margin for future sticky shell (story 6.3)~~ — **resolved 2026-09-01** (`config/page.tsx` scroll-mt token)
- Spec Change Log empty — documentation hygiene; no functional impact

## Resolved technical debt batch (2026-09-01)

- Unnecessary DB fetches before unleveled early return on mobile student page — **resolved** (`mobile/[studentId]/page.tsx`)
- Duplicate entries skewing `remainingCount` / completion summary — **resolved** (`lib/domain/dictation-entry-completion.ts`, mobile picker + `get-dictation-completion-summary.ts`)
- `saveDictationAction` sans tests — **resolved** (`dictations/actions.test.ts`)
- Formulaire ne conserve pas l'email après erreur — **resolved** (`register-form.tsx` controlled email)
- Groupe sémantique a11y sur picker de niveau mode assign — **resolved** (`level-dot-picker.tsx` fieldset/legend)
- No `loading.tsx` skeleton for Alertes — **resolved** (`alerts/loading.tsx`)
- Duplicated `next/image` and `next/link` mocks — **partially resolved** (`dashboard-shell.test.tsx`, `dashboard-chrome.test.tsx` → `test-utils/next-mocks.tsx`)
- Utilisateur authentifié peut accéder à `/register` — **already resolved** (`middleware-policy.ts` redirects to `/dictations`; covered by `middleware-policy.test.ts`)
- Fuite timing NFR9 login email inconnu — **already resolved** (`authenticate-teacher.ts` dummy hash)
- Duplicated validate/refuse client logic — **resolved in tier-3 retro** (`use-promotion-action.ts`)

## Deferred from: code review of spec-5-3-unleveled-student-block-on-mobile.md (2026-09-01)

- ~~Unnecessary DB fetches (`listLeveledActiveStudents`, entries, matrix) before unleveled early return~~ — **resolved 2026-09-01**
- ~~Duplicate non-archived entries for same leveled student can skew `remainingCount`~~ — **resolved 2026-09-01**
- Spec 5-2 still documents unleveled picker exclusion — **resolved 2026-09-01** (`spec-5-2-mobile-per-student-entry-form-b4.md` post-5.3 reconciliation)
- Hub vs picker microcopy divergence for zero-leveled state — **resolved 2026-09-01** (`lib/domain/mobile-dictation-messages.ts`)

## Deferred from: code review of spec-5-2-mobile-per-student-entry-form-b4.md (2026-08-31)

- Mises à jour concurrentes last-write-wins sur `saveDictationStudentEntry` — même pattern que `saveDictation` batch ; acceptable MVP (AD-9 stale counts)
- Brouillon perdu sans confirmation sur navigation prev/next — hors spec MVP ; amélioration UX future
- ~~`saveDictationAction` sans tests action dédiés~~ — **resolved 2026-09-01** (`dictations/actions.test.ts`)
- Incohérence statut spec `done` vs sprint `review` — hygiène artefact à corriger au merge

## Deferred from: code review of spec-5-1-mobile-dictation-hub-g2.md (2026-08-31)

- No `page.test.tsx` for `/dictations/[id]/mobile` Saisir stub — summary page has parallel auth/notFound coverage; stub regressions uncaught
- Flash contenu bloqué avant redirect `MobileRouteGuard` — trade-off client-side documenté dans Design Notes ; acceptable MVP (`mobile-route-guard.tsx:53`)
- Liens Saisir/Voir sans `aria-label` contextualisé — **resolved 2026-09-01** (`mobile-dictation-hub.tsx`, `lib/domain/mobile-dictation-messages.ts`)

## Deferred from: code review of spec-4-6-alertes-promotion-queue-d2.md (2026-08-31)

- Duplicate DB queries on /alerts page (layout count + page list) — perf acceptable for class size
- ~~No loading.tsx skeleton for Alertes page~~ — **resolved 2026-09-01** (`alerts/loading.tsx`)
- No E2E test for badge decrement after validate/refuse — unit tests cover plumbing
- Spec Change Log left empty — documentation hygiene
- Duplicated validate/refuse client logic vs roster-promotion-action — pre-existing pattern

## Deferred from: code review of spec-4-4-manual-level-override-level-history.md (2026-08-28)

- Pas de pagination sur l'historique des niveaux — volume attendu faible pour une classe CE2 ; à traiter si perf observée (`get-student-level-history.ts`)
- ~~Groupe sémantique accessibilité (`fieldset`/`role="group"`) sur le picker de niveau~~ — **resolved 2026-09-01** (`level-dot-picker.tsx` assign mode fieldset)
- Mode `assign` sans toast/`router.refresh()` après succès — comportement E1 pré-existant, hors périmètre override (`level-dot-picker.tsx`)

## Deferred from: code review of spec-1-1-project-scaffold-development-environment.md (2026-08-25)

- Singleton race on concurrent `getDb()` cold start — acceptable for scaffold; revisit if connection leaks observed in production (`index.ts:21-27`)
- No timeout on `checkDatabaseConnection` — health check can hang indefinitely on network issues (`index.ts:29-31`)
- No runtime `AUTH_SECRET` validation — owned by story 1.3 auth flows (`index.ts`)
- No `db:migrate` / `db:generate` scripts — spec allows push-only workflow for now (`package.json`)
- `checkDatabaseConnection` not wired to HTTP health route — manual verification sufficient for scaffold story (`index.ts:29`)

- French microcopy / `lang="fr"` on shell — deferred to stories 1.5–1.6 branding (`layout.tsx`, `page.tsx`)
- App Router error/loading/not-found boundaries — deferred, not required for scaffold (`app/`)
- Route group `layout.tsx` placeholders — deferred, `.gitkeep` satisfies spec stubs (`app/(auth)/`, `app/(dashboard)/`)
- Menthe Douce design tokens — deferred to story 1.5 (`globals.css`)
- DB health indicator on landing page — deferred; spec « dev-ready indicator » satisfied by static copy (`page.tsx`)
- Auth.js handler export pattern — deferred to story 1.3 (`route.ts`)

- GitHub Actions CI workflow — deferred to post-scaffold infra (not in story 1.1 AC)
- `npm run build` integration test in CI — deferred; static scaffold tests sufficient for now
- `next.config.ts` turbopack.root — deferred unless monorepo warnings become errors
- `db:migrate` / `db:generate` scripts — deferred (spec allows push-only)

## Deferred from: code review of spec-1-2-teacher-registration.md (2026-08-25)

- ~~Formulaire ne conserve pas l'email après erreur~~ — **resolved 2026-09-01** (`register-form.tsx`)
- ~~Pas de rate limiting sur l'inscription~~ — **resolved 2026-08-31** : fenêtre glissante par IP dans `register/actions.ts` + `lib/services/auth-rate-limit.ts`
- Erreurs DB silencieuses côté serveur (pas de log) — NFR9 impose message générique UI ; observabilité à ajouter plus tard (`register-teacher.ts:678-683`)

## Deferred from: code review of spec-1-3-teacher-login-session-management.md (2026-08-25)

- ~~Pas de `callbackUrl` après redirect login~~ — **resolved 2026-08-31** : `lib/domain/auth-redirect.ts`, middleware + `login/actions.ts`
- Pas de `trustHost` / `AUTH_URL` documentés pour déploiement Vercel Auth.js v5 (`auth.ts`, `.env.example`)
- Fuite timing NFR9 : pas de hash bcrypt quand l'email login est inconnu (`authenticate-teacher.ts`) — **fixed in code review 2026-08-25**
- ~~Pas de rate limiting sur le login~~ — **resolved 2026-08-31** : fenêtre glissante par IP dans `login/actions.ts` + `lib/services/auth-rate-limit.ts`
- Pas de flux `signOut` UI — hors AC explicites mais titre « Session Management » (`auth.ts`)
- ~~Utilisateur authentifié peut encore accéder à `/register`~~ — **already resolved** (`middleware-policy.ts` → redirect `/dictations`)
- Page `/dictations` sans garde `auth()` serveur — protection middleware uniquement (`dictations/page.tsx`)
- Migration Next.js 16 `middleware` → `proxy` — avertissement build (`middleware.ts`)
- Pas de tests E2E register → login → session → dashboard (`spec` manual checks only)

## Deferred from: code review of spec-1-5-design-system-tokens-brand-theme.md (2026-08-25)

- Register/onboarding/dashboard titles still use `text-2xl` — out of story scope; login smoke test only (`register/page.tsx`, dashboard pages)
- `LevelBadge` and `Button` accent variant not integrated on any page — component-delivery story; dossier/grid usage in later epics

## Deferred from: code review of spec-1-6-app-shell-with-navigation-app-bar.md (2026-08-25)

- Tablet viewport (768–1023px) acceptance lacks browser/responsive tests — UX-DR26/AC3; static class-string tests sufficient for MVP (`nav-tabs.tsx:25`)
- Client-side tab navigation without full reload not covered by integration/E2E tests — `next/link` mocked in unit tests; manual verification per spec (`nav-tabs.tsx:31`)
- ~~Duplicated `next/image` and `next/link` mocks across dashboard test files~~ — **partially resolved 2026-09-01** (`test-utils/next-mocks.tsx`; `dashboard-shell` + `dashboard-chrome` migrated)
- `next/image` missing `sizes` attribute for responsive logo optimization — low impact with fixed height classes (`app-bar.tsx:7`)
- Spec Change Log empty for story iteration decisions — documentation hygiene, non-blocking (`spec-1-6-app-shell-with-navigation-app-bar.md:116`)

## Deferred from: code review of spec-2-1-csv-roster-import.md (2026-08-26)

- Atomicité import roster (TOCTOU) — option C acceptée pour MVP ; `import-roster-csv.ts` n'utilise pas `db.transaction()` (count-then-insert) ; driver `neon-serverless` migré (`2b6c241`) mais import non enveloppé — réévaluer si contrainte unique story 2.2
- `students.level` en text libre sans enum — story 2.3 assignera les niveaux (`schema.ts:30`)
- Pas d'index DB sur `students.class_id` — volume roster faible en MVP (`schema.ts:26`)
- Pas de contrainte unique `(class_id, display_name)` — story 2.2 ajout manuel (`schema.ts`)
- Plafond 512 KB uniquement dans l'action serveur — seul point d'entrée pour cette story (`actions.ts:46`)
- Pas de test E2E flux Config → import → succès — action item epic-1 retro

## Deferred from: code review of spec-2-2-manual-student-add-roster-list.md (2026-08-26)

- Redirections auth/classe au niveau `page.tsx` — déjà garanties par `dashboard/layout.tsx` avant rendu des enfants
- Test non-régression lien Config → Élèves pour ajout manuel — page Config inchangée dans story 2-2 ; vérification manuelle suffisante
- Pas de test E2E flux ajout manuel → apparition dans liste — action item epic-1 retro (smoke E2E)
- Normalisation Unicode (NFC/NFKC) pour détection doublons — hors scope spec MVP ; réévaluer si cas réels signalés

## Deferred from: code review of spec-2-3-level-assignment-color-dot-picker-e1.md (2026-08-26)

- Index `student_id` sur `level_history_entries` — performance future lectures historique ; volume faible en MVP (`schema.ts:37`)
- Pas de `teacher_id` dans l'historique — fondation FR33 partielle ; stories 4.x (`schema.ts:37`)
- Type `LeveledActiveStudent.level` reste `string` au lieu de `ChampionsLevel` — amélioration typage Epic 3 (`list-leveled-active-students.ts:10`)
- `aria-describedby` pour erreurs picker multi-lignes — amélioration a11y non bloquante (`level-dot-picker.tsx:63`)
- Test dédié `RequiredLevelBadge` — composant trivial, couvert indirectement par `roster-list.test.tsx`

## Deferred from: code review of spec-2-4-word-count-matrix-configuration-f1.md (2026-08-26)

- No index on `word_count_matrix_rows.class_id` — low volume per class in MVP (`schema.ts:51`)
- Config page has no try/catch around `listWordCountMatrixRows` — same pattern as `countActiveStudents` on same page (`page.tsx:24`)
- `word_count_matrix_rows` lacks `created_at`/`updated_at` — not required by story AC (`schema.ts:49`)
- Schema change relies on `db:push` only — project push-only convention (`schema.ts:49`)

## Deferred from: code review of spec-2-5-year-start-wizard-e3.md (2026-08-26)

- source_spec: `_bmad-output/implementation-artifacts/spec-2-5-year-start-wizard-e3.md`
  summary: Redirect to year-start wizard when first student is added manually and wizard never completed
  evidence: Ask First default « yes » in spec; not listed in execution tasks; addStudentAction only revalidates wizard cache today

- source_spec: `_bmad-output/implementation-artifacts/spec-2-5-year-start-wizard-e3.md`
  summary: Surface imported student count after CSV redirect to wizard step 1
  evidence: Post-import redirect no longer passes `importedCount`; Config `?imported=N` banner orphaned for primary flow

## Deferred from: code review of spec-2-7-empty-roster-pre-setup-states.md (2026-08-27)

- No E2E test for `/config#liste-eleves` and `/config#matrice-mots` hash navigation from Dictées CTAs — epic-1 retro E2E smoke scope; unit tests cover href presence only

## Deferred from: code review of spec-2-8-annual-year-reset.md (2026-08-27)

- No DB integration test for real `neon-serverless` transaction atomicity on `resetClassYear` — spec « Ask First » decision point; mock-based unit tests pass; driver migration done (`2b6c241`)
- No `inArray` batching for very large student rosters in `reset-class-year.ts` — speculative scale edge case; typical class sizes unlikely to hit parameter limits
- `auth()` / `getTeacherClass()` throws outside try/catch in `resetClassYearAction` — pre-existing pattern across all config server actions

## Completed: neon-serverless driver migration (2026-08-27)

- **Done:** `lib/db/index.ts` migrated from `neon-http` to `neon-serverless` (`Pool`) — commit `2b6c241`
- **Why accelerated:** `neon-http` throws on `db.transaction()` — level assignment, matrix replace, and year reset failed at runtime
- **Spike:** `spike-neon-serverless-transactions.md` (acceptance criteria + execution notes)
- **Sprint item:** `epic-2-retro-item-11-evaluate-neon-serverless-driver-migratio` → **done**
- **Still open:** manual verify year reset + matrix save on dev Neon; DB integration test for `resetClassYear` rollback (see spec 2-8 deferrals above)

## Deferred from: code review of spec-3-2-class-grid-ui-with-keyboard-navigation-a2.md (2026-08-27)

- Grid `counts` state not resynced when `students` prop changes after mount — server-rendered page with static roster today; revisit if client-side roster refresh is added (`class-grid.tsx:42`)
- Missing `headers` attribute on grid cell inputs linking to row/column `<th>` — `aria-label` covers MVP a11y; enhance if screen-reader testing flags gaps (`grid-cell.tsx:111`)

## Deferred from: code review of spec-3-1-create-dictation.md (2026-08-27)

- Gate `wizardStatus.completed` avant création dictée — product decision: prérequis métier (nivelés + matrice) suffisent ; epic-3-context wording stricter than implemented intent
- Placeholder détail minimal (« Saisie grille — prochaine étape ») — story 3.2 owns grid UI on `/dictations/[id]`
- Pas de `generateMetadata` sur routes dictées — pattern projet non uniformisé sur les routes dashboard
- `isCompleteMatrixRow` sans tests unitaires dédiés — couverture indirecte via wizard et create-dictation tests suffisante pour 3.1

## Deferred from: code review of spec-3-3-grid-validation-save-blocking.md (2026-08-28)

- No try/catch around `listWordCountMatrixRows` on dictation detail page — same pattern as Config page and other dashboard routes (`page.tsx:52`)
- Accessibility: grid cells not linked to inline Σ alert via `aria-describedby` — `aria-invalid` present; screen-reader association deferred to a11y pass (`class-grid.tsx:669-676`)

## Deferred from: code review of spec-3-4-scoring-engine-dictation-save.md (2026-08-28)

- source_spec: `_bmad-output/implementation-artifacts/spec-3-4-scoring-engine-dictation-save.md`
  summary: Add integration test for full `saveDictation` DB transaction including promotion inserts.
  evidence: Only `prepareDictationEntries` is unit-tested; transaction rollback and already-saved guard lack automated coverage.

## Deferred from: code review of spec-3-4-scoring-engine-dictation-save.md (2026-08-28) — pass 2

- source_spec: `_bmad-output/implementation-artifacts/spec-3-4-scoring-engine-dictation-save.md`
  summary: Add `saveDictationAction` tests mirroring `createDictationAction` pattern.
  evidence: `actions.test.ts` has no `saveDictationAction` describe block; class-grid mocks the action entirely.

- source_spec: `_bmad-output/implementation-artifacts/spec-3-4-scoring-engine-dictation-save.md`
  summary: Test promotion insert and skip-when-pending inside `saveDictation` transaction loop.
  evidence: `promotion.test.ts` covers domain only; no mocked-DB test asserts `tx.insert(pendingPromotions)`.

- source_spec: `_bmad-output/implementation-artifacts/spec-3-4-scoring-engine-dictation-save.md`
  summary: Add Enter-to-save regression tests (cell input focus, invalid grid on container Enter).
  evidence: `class-grid.test.tsx` tests Enter on container only with valid grid; `HTMLInputElement` guard untested.

- source_spec: `_bmad-output/implementation-artifacts/spec-3-4-scoring-engine-dictation-save.md`
  summary: Assert grid counts unchanged after save failure toast.
  evidence: Failure test checks `mockToastError` only, not retained `counts` state (UX-DR24).

## Deferred from: code review of spec-3-5-edit-past-dictation.md (2026-08-28)

- source_spec: `_bmad-output/implementation-artifacts/spec-3-5-edit-past-dictation.md`
  summary: Add dedicated test file for `getDictationEntriesByDictationId` DB query and mapping.
  evidence: Service fully mocked in page/save tests; no `get-dictation-entries.test.ts` unlike `list-dictations.test.ts`.

- source_spec: `_bmad-output/implementation-artifacts/spec-3-5-edit-past-dictation.md`
  summary: Integration test for edit-path transaction rollback on DB failure.
  evidence: I/O matrix row « DB failure mid-tx » has no covering test; mocked transaction always succeeds.

- source_spec: `_bmad-output/implementation-artifacts/spec-3-5-edit-past-dictation.md`
  summary: ARIA or visual affordance for read-only archived grid rows beyond disabled inputs.
  evidence: Archived rows use `disabled` only; no `aria-readonly` or label for screen readers.

## Deferred from: code review of spec-3-5-edit-past-dictation.md (2026-08-28) — pass 2

- source_spec: `_bmad-output/implementation-artifacts/spec-3-5-edit-past-dictation.md`
  summary: Unit test for `.returning()` zero-row guard on edit UPDATE.
  evidence: `mockUpdateReturning` always resolves a row; guard at `dictation-save.ts:334` untested.

- source_spec: `_bmad-output/implementation-artifacts/spec-3-5-edit-past-dictation.md`
  summary: Unit test for negative column clamp in `dbColumnsToCategoryErrors`.
  evidence: `error-categories.test.ts` covers positive round-trip only; `Math.max(0, …)` at line 159 unverified.

- source_spec: `_bmad-output/implementation-artifacts/spec-3-5-edit-past-dictation.md`
  summary: Unit tests for keyboard navigation skipping read-only archived rows.
  evidence: `findEditableStudentIndex` implemented; existing keyboard tests use fully editable grids.

- source_spec: `_bmad-output/implementation-artifacts/spec-3-5-edit-past-dictation.md`
  summary: Assert grid counts retained after save failure with `initialCounts` (UX-DR24 reopen path).
  evidence: Failure test asserts toast only, not input values after error.

- source_spec: `_bmad-output/implementation-artifacts/spec-3-5-edit-past-dictation.md`
  summary: Assert edit UPDATE `.set()` excludes `levelAtSave`/`wordDenominator`.
  evidence: Integration test checks `globalPercent`/`errorsC` only; snapshot overwrite regression undetected.

- source_spec: `_bmad-output/implementation-artifacts/spec-3-5-edit-past-dictation.md`
  summary: Integration test — invalid row (Σ errors > snapshot denominator) blocks transaction on edit path.
  evidence: `prepareDictationEntryUpdates` unit-tested; no test that `mockTransaction` is skipped on invalid edit.

- source_spec: `_bmad-output/implementation-artifacts/spec-3-5-edit-past-dictation.md`
  summary: Test active student added after first save is excluded from reopen grid.
  evidence: Page maps `savedEntries` only; no page test for post-save roster addition.

- source_spec: `_bmad-output/implementation-artifacts/spec-3-5-edit-past-dictation.md`
  summary: Test all-archived reopen grid disables save.
  evidence: `editableStudents.length > 0` guard present; no scenario test.

## Deferred from: code review of spec-3-6-inline-promotion-indicators-on-grid-d3-d3.md (2026-08-28)

- Archived read-only row shows ⬆️ but hides **+** with no D1/D2 surface yet — pending on archived student is visible but unactionable until Epic 4 (`class-grid.tsx:534`)
- Add + button to keyboard Tab order — D3+ **+** is click-only; deferred out of MVP scope for story 3-6 (`class-grid.tsx:515`)

## Deferred from: code review of spec-4-1-auto-generated-student-dossier.md (2026-08-28)

- Parcours e2e Élèves → dossier — action item epic-1/2 retro ; hors scope story 4.1
- Auth/classe dupliqués layout + page — pattern préexistant sur toutes les pages dashboard (`page.tsx:23`)
- Promise.all pour requêtes parallèles — micro-optimisation latence ; impact négligeable pour 2 requêtes (`page.tsx:41`)
- Tests unitaires dédiés `curve-placeholder` / `dictation-history-list` — couverts indirectement par `page.test.tsx`
- Type `ClassStudentRecord` dupliqué vs `ClassStudent` — cosmétique ; consolidation possible plus tard (`get-class-student.ts:6`)

## Deferred from: code review of spec-4-2-hero-curve-collapsed-dictation-table-c1.md (2026-08-28)

- Test navigation clavier `<details>` — comportement natif du navigateur ; focus ring CSS déjà présent sur `summary` (`dictation-history-table.tsx:28`)

## Deferred from: code review of spec-4-7-presentation-mode-rdv-parents-c3.md (2026-08-31)

- source_spec: `_bmad-output/implementation-artifacts/spec-4-7-presentation-mode-rdv-parents-c3.md`
  summary: Explicit focus restoration on dossier link after exiting presentation mode.
  evidence: AC asks sensible focus restore; Next.js navigation relies on browser default without `focus()` on RDV parents link.

- source_spec: `_bmad-output/implementation-artifacts/spec-4-7-presentation-mode-rdv-parents-c3.md`
  summary: Tighten chrome-hide path match beyond `endsWith("/present")`.
  evidence: Review noted false-positive risk on unrelated future routes; current app has only student presentation path.

- source_spec: `_bmad-output/implementation-artifacts/spec-4-7-presentation-mode-rdv-parents-c3.md`
  summary: Flatten double `<details>` accordion for category errors in presentation mode.
  evidence: Outer toggle wraps `DictationHistoryTable` which has per-dictation details; UX polish, spec required reuse.

- source_spec: `_bmad-output/implementation-artifacts/spec-4-7-presentation-mode-rdv-parents-c3.md`
  summary: Defensive newest-first sort inside `dossier-presentation` domain helpers.
  evidence: Service contract is newest-first; duplicate sort adds cost for marginal safety.

- source_spec: `_bmad-output/implementation-artifacts/spec-4-7-presentation-mode-rdv-parents-c3.md`
  summary: Presentation page metadata / document title for browser tab.
  evidence: Not in story AC; enhancement for bookmarking/history clarity.

## Deferred from: code review of spec-4-7-presentation-mode-rdv-parents-c3.md (2026-08-31)

- Flash potentiel du chrome dashboard avant masquage client sur `/present` — hydratation `usePathname`, impact visuel bref (`dashboard-chrome.tsx:20`)
- Test E2E flux dossier → présentation → retour — hors périmètre AC unitaires
- Spec Change Log vide après patches de review — hygiène documentation

## Deferred from: code review of spec-4-3-promotion-banner-on-dossier-d1.md (2026-08-28)

- Actions grille (`validatePromotionAction` / `refusePromotionAction`) ne revalident pas `/students/[id]` — dossier ouvert peut afficher une bannière obsolète après mutation depuis la grille jusqu'à rechargement manuel ; pré-existant, hors scope story 4-3 (`dictations/actions.ts:152`)
- `targetLevel` invalide en base masque silencieusement la bannière — `listPendingPromotionsForStudents` ignore les lignes non parsables ; comportement service existant, intégrité données hors scope (`list-pending-promotions.ts:38`)
- Fetches séquentiels `getStudentDictationHistory` puis `listPendingPromotionsForStudents` — micro-optimisation latence hors scope story 4-3 (`page.tsx:55`)
