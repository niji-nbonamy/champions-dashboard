# Deferred Work

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

- Formulaire ne conserve pas l'email après erreur — UX mineure, hors AC story 1.2 (`register-form.tsx`)
- Pas de rate limiting sur l'inscription — endpoint public ; à traiter en story sécurité/infra ultérieure (`register-teacher.ts`)
- Erreurs DB silencieuses côté serveur (pas de log) — NFR9 impose message générique UI ; observabilité à ajouter plus tard (`register-teacher.ts:678-683`)

## Deferred from: code review of spec-1-3-teacher-login-session-management.md (2026-08-25)

- Pas de `callbackUrl` après redirect login — l'utilisateur atterrit toujours sur `/dictations` (`middleware.ts`, `login/actions.ts`)
- Pas de `trustHost` / `AUTH_URL` documentés pour déploiement Vercel Auth.js v5 (`auth.ts`, `.env.example`)
- Fuite timing NFR9 : pas de hash bcrypt quand l'email login est inconnu (`authenticate-teacher.ts`) — **fixed in code review 2026-08-25**
- Pas de rate limiting sur le login (`login/actions.ts`)
- Pas de flux `signOut` UI — hors AC explicites mais titre « Session Management » (`auth.ts`)
- Utilisateur authentifié peut encore accéder à `/register` (`middleware.ts`)
- Page `/dictations` sans garde `auth()` serveur — protection middleware uniquement (`dictations/page.tsx`)
- Migration Next.js 16 `middleware` → `proxy` — avertissement build (`middleware.ts`)
- Pas de tests E2E register → login → session → dashboard (`spec` manual checks only)

## Deferred from: code review of spec-1-5-design-system-tokens-brand-theme.md (2026-08-25)

- Register/onboarding/dashboard titles still use `text-2xl` — out of story scope; login smoke test only (`register/page.tsx`, dashboard pages)
- `LevelBadge` and `Button` accent variant not integrated on any page — component-delivery story; dossier/grid usage in later epics

## Deferred from: code review of spec-1-6-app-shell-with-navigation-app-bar.md (2026-08-25)

- Tablet viewport (768–1023px) acceptance lacks browser/responsive tests — UX-DR26/AC3; static class-string tests sufficient for MVP (`nav-tabs.tsx:25`)
- Client-side tab navigation without full reload not covered by integration/E2E tests — `next/link` mocked in unit tests; manual verification per spec (`nav-tabs.tsx:31`)
- Duplicated `next/image` and `next/link` mocks across dashboard test files — refactor when shared test utils exist (`app-bar.test.tsx:6`)
- `next/image` missing `sizes` attribute for responsive logo optimization — low impact with fixed height classes (`app-bar.tsx:7`)
- Spec Change Log empty for story iteration decisions — documentation hygiene, non-blocking (`spec-1-6-app-shell-with-navigation-app-bar.md:116`)

## Deferred from: code review of spec-2-1-csv-roster-import.md (2026-08-26)

- Atomicité import roster (TOCTOU) — option C acceptée pour MVP ; driver `neon-http` sans transaction ; réévaluer à migration `neon-serverless` ou story 2.2 (`import-roster-csv.ts`)
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
