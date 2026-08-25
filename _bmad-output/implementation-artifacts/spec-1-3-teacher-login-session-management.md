---
title: '1-3 Teacher Login & Session Management'
type: 'feature'
created: '2026-08-25'
status: 'done'
baseline_commit: 'bfa319ec13a9719f50441d0efba956144514a85a'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-testBMAD-2026-08-24/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Teachers can register but cannot sign in — Auth.js handlers return 501, the login page is a stub, and dashboard routes are unprotected.

**Approach:** Wire Auth.js v5 Credentials provider against the existing `teachers` table (bcrypt verify, `Teacher.id` as `user.id`), add login form + server action, export real auth handlers, protect dashboard routes via middleware, and redirect successful logins to a minimal `/dictations` dashboard stub.

## Boundaries & Constraints

**Always:**
- `Teacher.id` equals Auth.js `session.user.id` (AD-2); JWT session strategy — no separate `users` table or Neon Auth adapter.
- Credentials verified server-side: normalize email, lookup `teachers`, `bcryptjs.compare` with rounds 12 (same as registration).
- Generic login error message on any failure — wrong email, wrong password, malformed input, DB error (NFR9); no field-level hints.
- Login mutations server-authoritative via Server Action → `signIn("credentials")` or application service (AD-3).
- Unauthenticated access to dashboard routes redirects to `/login`.
- Public routes remain accessible: `/`, `/login`, `/register`, `/api/auth/*`.
- Validate `AUTH_SECRET` at auth config load (deferred item from story 1.1).
- Preserve registration success banner on `/login?registered=1` from story 1.2.

**Ask First:**
- Switching from JWT to database sessions or introducing `@auth/neon-adapter` tables.
- Changing post-login landing path away from `/dictations`.
- Adding rate limiting or account lockout.

**Never:**
- Reveal whether an email is registered vs password wrong (NFR9).
- Create `Class` records or first-login onboarding (story 1.4).
- Build app shell, tabs, or design tokens (stories 1.5–1.6).
- Replace public scaffold home at `/` with an authenticated page.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Successful login | Registered email + correct password | Auth.js session created; redirect to `/dictations` | N/A |
| Wrong password | Valid email, incorrect password | Remain on login; generic error | Same message as all failures |
| Unknown email | Email not in `teachers` | Remain on login; generic error | No email-existence leak |
| Malformed input | Invalid email or empty fields | Generic error; no session | N/A |
| Unauthenticated dashboard | No session cookie on `/dictations` | Redirect to `/login` | N/A |
| Post-registration visit | `/login?registered=1` after story 1.2 flow | Success banner + working login form | N/A |
| Already authenticated | Session present, visit `/login` | Redirect to `/dictations` (optional UX) | N/A |

</frozen-after-approval>

## Code Map

- `champions-app/auth.ts` -- **CREATE** NextAuth config: Credentials provider, JWT callbacks, `AUTH_SECRET` validation, export `{ handlers, auth, signIn, signOut }`.
- `champions-app/app/api/auth/[...nextauth]/route.ts` -- **MODIFY** replace 501 stub with `export const { GET, POST } = handlers`. [`route.ts:3`](../../champions-app/app/api/auth/[...nextauth]/route.ts#L3)
- `champions-app/middleware.ts` -- **CREATE** protect dashboard paths; delegate to Auth.js middleware or `auth()` wrapper.
- `champions-app/lib/domain/authentication.ts` -- **CREATE** `LOGIN_ERROR_MESSAGE`, `validateLoginInput` (reuse `normalizeEmail`, `isValidEmail` from registration).
- `champions-app/lib/services/authenticate-teacher.ts` -- **CREATE** lookup teacher by email, `compare` password; map all failures to generic error.
- `champions-app/app/(auth)/login/login-form.tsx` -- **CREATE** mirror `register-form.tsx` pattern (`noValidate`, `useActionState`, `role="alert"`).
- `champions-app/app/(auth)/login/actions.ts` -- **CREATE** Server Action calling `signIn("credentials")`; propagate redirect; generic error on failure.
- `champions-app/app/(auth)/login/page.tsx` -- **MODIFY** replace stub with `LoginForm`; keep `registered=1` banner. [`page.tsx:14`](../../champions-app/app/(auth)/login/page.tsx#L14)
- `champions-app/app/(dashboard)/dictations/page.tsx` -- **CREATE** minimal authenticated landing ("Dashboard" / dictations placeholder).
- `champions-app/lib/db/schema.ts` -- **READ** `teachers` table unchanged. [`schema.ts:3`](../../champions-app/lib/db/schema.ts#L3)
- `champions-app/lib/domain/registration.ts` -- **REUSE** `normalizeEmail`, `isValidEmail`, password bounds for login input sanity.
- `champions-app/lib/services/register-teacher.ts` -- **READ** bcrypt rounds 12 pattern. [`register-teacher.ts:32`](../../champions-app/lib/services/register-teacher.ts#L32)
- `champions-app/app/(auth)/register/register-form.tsx` -- **READ** form/action-state pattern to mirror. [`register-form.tsx:14`](../../champions-app/app/(auth)/register/register-form.tsx#L14)
- `champions-app/app/shell.test.tsx` -- **UPDATE** auth route tests (no longer 501). [`shell.test.tsx:28`](../../champions-app/app/shell.test.tsx#L28)
- `champions-app/app/(auth)/auth-pages.test.tsx` -- **UPDATE** login form and error display tests.

## Tasks & Acceptance

**Execution:**
- [x] `champions-app/auth.ts` -- Configure Auth.js v5 Credentials + JWT; wire `authorize` to authenticate-teacher service; validate `AUTH_SECRET` -- core session plumbing.
- [x] `champions-app/lib/domain/authentication.ts` -- Add login validation and shared generic error constant -- NFR9 messaging.
- [x] `champions-app/lib/services/authenticate-teacher.ts` -- Implement credential verification against `teachers` -- application layer per AD-3.
- [x] `champions-app/app/api/auth/[...nextauth]/route.ts` -- Export real handlers -- replaces 501 stub.
- [x] `champions-app/middleware.ts` -- Protect `/dictations` (and dashboard prefix pattern for future routes) -- unauthenticated redirect AC.
- [x] `champions-app/app/(auth)/login/actions.ts` + `login-form.tsx` + `page.tsx` -- Login Server Action, form UI, preserve registration banner -- teacher sign-in entry point.
- [x] `champions-app/app/(dashboard)/dictations/page.tsx` -- Minimal post-login landing -- satisfies dashboard redirect AC.
- [x] `champions-app/lib/domain/authentication.test.ts` -- Unit tests for login validation and generic message.
- [x] `champions-app/lib/services/authenticate-teacher.test.ts` -- Mocked DB tests: success, wrong password, unknown email, DB failure.
- [x] `champions-app/app/(auth)/auth-pages.test.tsx` + `shell.test.tsx` -- Update/add tests for login form and auth handlers.

**Acceptance Criteria:**
- Given I have a registered account, when I submit valid credentials on the login page, then an authenticated session is created via Auth.js v5 and I am redirected to the dashboard (`/dictations`).
- Given I submit invalid credentials, when the login form is processed, then I see a generic error message without indicating which field failed (NFR9).
- Given I am not authenticated, when I access a dashboard route, then I am redirected to login.

## Design Notes

Credentials `authorize` returns `{ id: teacher.id, email: teacher.email }` so JWT `sub` / `session.user.id` matches `Teacher.id` without an Auth.js adapter. `@auth/neon-adapter` stays unused — JWT sessions only.

Login action pattern:
```typescript
await signIn("credentials", { email, password, redirectTo: "/dictations" });
// Catch AuthError → return { error: LOGIN_ERROR_MESSAGE }
```

## Verification

**Commands:**
- `cd champions-app && npm test` -- expected: all tests pass including new auth tests.
- `cd champions-app && npm run build` -- expected: production build succeeds with middleware.

**Manual checks (if no CLI):**
- Register (or use existing teacher), visit `/login`, submit valid credentials → lands on `/dictations` with session cookie.
- Submit wrong password → generic error, no "invalid email" vs "invalid password" distinction.
- Visit `/dictations` logged out → redirect to `/login`.

## Suggested Review Order

**Auth core**

- Credentials provider wires `Teacher.id` into JWT session without adapter tables.
  [`auth.ts:7`](../../champions-app/auth.ts#L7)

- Runtime `AUTH_SECRET` guard extracted for testable boot validation.
  [`auth-secret.ts:1`](../../champions-app/lib/config/auth-secret.ts#L1)

- Auth.js handlers replace the 501 stub on the API route.
  [`route.ts:1`](../../champions-app/app/api/auth/[...nextauth]/route.ts#L1)

**Credential verification**

- Server-side lookup and bcrypt compare with generic null on all failures.
  [`authenticate-teacher.ts:13`](../../champions-app/lib/services/authenticate-teacher.ts#L13)

- Shared login validation and NFR9 error message.
  [`authentication.ts:7`](../../champions-app/lib/domain/authentication.ts#L7)

**Login UI & action**

- Server Action delegates to `signIn` and maps all failures to generic error.
  [`actions.ts:13`](../../champions-app/app/(auth)/login/actions.ts#L13)

- Client form mirrors registration pattern with `noValidate` and alert role.
  [`login-form.tsx:11`](../../champions-app/app/(auth)/login/login-form.tsx#L11)

- Login page preserves registration banner and redirects authenticated users.
  [`page.tsx:8`](../../champions-app/app/(auth)/login/page.tsx#L8)

**Route protection**

- Pure redirect policy tested independently from Auth.js wrapper.
  [`middleware-policy.ts:14`](../../champions-app/lib/auth/middleware-policy.ts#L14)

- Middleware applies policy to login and dashboard matchers.
  [`middleware.ts:7`](../../champions-app/middleware.ts#L7)

**Dashboard stub**

- Minimal post-login landing at `/dictations`.
  [`page.tsx:1`](../../champions-app/app/(dashboard)/dictations/page.tsx#L1)

**Tests & types**

- Service, action, form, policy, and auth-secret unit coverage.
  [`authenticate-teacher.test.ts:27`](../../champions-app/lib/services/authenticate-teacher.test.ts#L27)

- Session `user.id` typing for downstream consumers.
  [`next-auth.d.ts:3`](../../champions-app/types/next-auth.d.ts#L3)

### Review Findings

- [x] [Review][Patch] Fuite temporelle NFR9 sur email inconnu — Quand l'email n'existe pas, `authenticateTeacher` retourne `null` sans appeler `bcrypt.compare`, alors que le chemin « mauvais mot de passe » exécute `compare` ; un attaquant peut mesurer le délai pour deviner si un email est enregistré. [`authenticate-teacher.ts:35-37`]

- [x] [Review][Patch] Handlers Auth.js vérifiés par lecture de source uniquement — `shell.test.tsx` lit le fichier `route.ts` et asserte des chaînes, sans invoquer `GET`/`POST` ; des handlers cassés ou des stubs 501 pourraient passer en CI. [`shell.test.tsx:27-36`]

- [x] [Review][Patch] Middleware jamais exécuté en test — Seule la politique pure `getAuthRedirectPath` est testée ; une régression dans `middleware.ts` (matcher, inversion de logique) ne serait pas détectée. [`middleware.ts:7-31`]

- [x] [Review][Patch] Matcher middleware dupliqué manuellement — `config.matcher` doit rester synchronisé avec `DASHBOARD_ROUTE_PREFIXES` via commentaire ; risque de divergence à l'ajout de routes dashboard. [`middleware.ts:23-31`]

- [x] [Review][Patch] LoginForm : test mock `useActionState` — `login-form.test.tsx` injecte toujours une erreur via mock ; ne vérifie pas le câblage réel formulaire ↔ `loginAction`. [`login-form.test.tsx:10-16`]

- [x] [Review][Patch] Page login : test mock `LoginForm` — `auth-pages.test.tsx` remplace le composant client par un formulaire factice ; pas de couverture d'intégration page ↔ formulaire réel. [`auth-pages.test.tsx:18-26`]

- [x] [Review][Patch] Aucun test sur les callbacks JWT/session (AD-2) — `auth.ts` mappe `Teacher.id` → `token.sub` → `session.user.id` mais aucun test ne valide ce mapping. [`auth.ts:38-53`]

- [x] [Review][Defer] Pas de `callbackUrl` après redirect login — l'utilisateur atterrit toujours sur `/dictations` — deferred, pre-existing [`middleware.ts`, `login/actions.ts`]

- [x] [Review][Defer] Pas de `trustHost` / `AUTH_URL` documentés pour déploiement Vercel — deferred, pre-existing [`auth.ts`, `.env.example`]

- [x] [Review][Defer] Pas de rate limiting sur le login — deferred, pre-existing (Ask First spec) [`login/actions.ts`]

- [x] [Review][Defer] Pas de flux `signOut` UI — deferred, pre-existing (hors AC explicites) [`auth.ts`]

- [x] [Review][Defer] Utilisateur authentifié peut accéder à `/register` — deferred, pre-existing [`middleware.ts`]

- [x] [Review][Defer] Page `/dictations` sans garde serveur `auth()` — deferred, pre-existing (middleware suffit pour AC) [`dictations/page.tsx`]

- [x] [Review][Defer] Migration Next.js 16 `middleware` → `proxy` — deferred, pre-existing [`middleware.ts`]

- [x] [Review][Defer] Pas de tests E2E register → login → session → dashboard — deferred, pre-existing (vérifs manuelles spec) [`spec`]
