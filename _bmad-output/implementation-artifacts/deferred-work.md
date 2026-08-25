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
