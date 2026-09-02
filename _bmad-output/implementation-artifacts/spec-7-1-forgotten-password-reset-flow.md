---
title: '7-1 Forgotten Password Reset Flow'
type: 'feature'
created: '09-02-2026'
status: 'done'
baseline_commit: 'd9b530e8a7980a41336f598536f2f426799627d8'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-7-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Teachers who forget their password cannot regain access without creating a new account or contacting support, blocking production rollout.

**Approach:** Add self-service password reset via email — `/forgot-password` request form, single-use 60-minute token stored as SHA-256 hash, `/reset-password` form reusing registration password policy, Resend transactional email with generic anti-enumeration responses.

## Boundaries & Constraints

**Always:**
- Generic success on forgot-password regardless of email existence (NFR9).
- Token: 64-byte random raw value in URL; persist only SHA-256 hash; single-use via `used_at`; 60-minute expiry.
- Password policy identical to registration (`validateRegistrationInput` / `isValidRegistrationPassword` in `registration.ts`); bcrypt cost 12.
- Rate limit kind `password-reset`: 3 requests / 15 min / IP via `auth-rate-limit.ts`.
- Authenticated users on `/forgot-password` or `/reset-password` redirect to `/dictations` (same as `/register`).
- French microcopy throughout (NFR14); auth page shell matches login/register styling.
- Email via existing `sendTransactionalEmail`; subject « Réinitialisation de votre mot de passe CHAMPIONS »; no open/link tracking.
- Dev fallback when `RESEND_API_KEY` absent: create token + log reset URL via `[email:dev-fallback]`; UI still shows generic success.
- No student data in email payload (RGPD).

**Ask First:**
- Exact French wording if product wants different tone from epic microcopy.

**Never:**
- Email verification on registration, change-password while logged in, SMS recovery.
- Persist raw reset tokens in DB or logs in production.
- Reveal whether an email is registered (no distinct error for unknown email).
- Fork password policy into a separate reset ruleset.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Forgot — known email | Valid teacher email, under rate limit | Generic success message; token row created; email sent (or dev log) | N/A |
| Forgot — unknown email | Unregistered email | Same generic success; no email sent; no DB token | N/A |
| Forgot — rate limited | 4th request in 15 min from same IP | Generic success shown; no new token/email if limited | Silent throttle (no enumeration leak) |
| Reset — valid token | Valid token, matching passwords meeting policy | `teachers.password_hash` updated; `used_at` set; redirect `/login?passwordUpdated=1` | N/A |
| Reset — invalid token | Expired, used, or malformed token | French error « Ce lien n'est plus valide. » + link to `/forgot-password`; no password form | N/A |
| Reset — policy fail | Weak or mismatched passwords | Inline French validation errors; token remains unused | Reuse registration validation messages |
| Auth user visits | Logged-in teacher on forgot/reset routes | Redirect to `/dictations` | N/A |
| Prod without Resend | `RESEND_API_KEY` missing in production | Email send throws; action should fail gracefully without leaking account state | Log server-side; still show generic success only if token created — prefer not creating token if email cannot send in prod |

</frozen-after-approval>

## Code Map

- `champions-app/lib/db/schema.ts` L12–19 — `teachers` table (`email` unique, `passwordHash`); **add** `password_reset_tokens` table (`id`, `teacher_id` FK, `token_hash`, `expires_at`, `used_at`, `created_at`).
- `champions-app/lib/domain/registration.ts` L35–111 — `isValidRegistrationPassword`, `validateRegistrationInput`, `getPasswordRequirementStatus`; **reuse** for reset (not `password-policy.ts` — does not exist).
- `champions-app/lib/services/register-teacher.ts` L32 — `hash(pwd, 12)` pattern; extract shared `hashPassword` or duplicate cost-12 bcrypt in reset service.
- `champions-app/lib/services/auth-rate-limit.ts` L8–34 — extend `AuthRateLimitKind` with `"password-reset"`; defaults 3/15min; env `AUTH_RATE_LIMIT_PASSWORD_RESET_*`.
- `champions-app/lib/domain/auth-rate-limit.ts` L8–32 — `consumeRateLimit`; read-only.
- `champions-app/lib/services/send-transactional-email.ts` L30–62 — `sendTransactionalEmail`; dev fallback logs full URL (acceptable locally).
- `champions-app/lib/auth/middleware-policy.ts` L45–67 — extend L50–52 for `/forgot-password`, `/reset-password`; sync `AUTH_MIDDLEWARE_MATCHER` L17–26.
- `champions-app/middleware.ts` L18–28 — **must** add same routes to matcher (Next.js literal requirement).
- `champions-app/app/(auth)/login/page.tsx` L23–43 — query-param flash pattern (`registered=1`); add `passwordUpdated=1` banner.
- `champions-app/app/(auth)/login/login-form-fields.tsx` — add « Mot de passe oublié ? » link below submit → `/forgot-password`.
- `champions-app/app/(auth)/register/page.tsx` L12 — auth page shell (`main` centered, `max-w-sm`); copy for new pages.
- `champions-app/components/auth/password-field.tsx`, `password-requirements.tsx` — reuse on reset page (register pattern).
- `champions-app/.env.example` L10–11, L27–34 — `AUTH_URL`, `RESEND_API_KEY`, `EMAIL_FROM`; document new rate-limit env vars.
- **New:** `lib/services/password-reset.ts` — token generation, SHA-256 hash, lookup, consume; `lib/services/send-password-reset-email.ts` — HTML/text template.
- **New:** `app/(auth)/forgot-password/` — page + form + server action; `app/(auth)/reset-password/` — page + form + server action (token from searchParams).

## Tasks & Acceptance

**Execution:**
- [x] `champions-app/lib/db/schema.ts` — add `password_reset_tokens` table with FK to `teachers.id` — token persistence
- [x] `champions-app/lib/services/password-reset.ts` — create/validate/consume tokens (SHA-256, 60min, single-use) — domain logic
- [x] `champions-app/lib/services/send-password-reset-email.ts` — build French HTML/text; call `sendTransactionalEmail` with reset link `{AUTH_URL}/reset-password?token={raw}` — email delivery
- [x] `champions-app/lib/services/auth-rate-limit.ts` — add `password-reset` kind (3/15min) — abuse prevention
- [x] `champions-app/app/(auth)/forgot-password/` — page, form, server action (lookup teacher by email, rate limit, generic response) — request flow
- [x] `champions-app/app/(auth)/reset-password/` — page, form, server action (validate token, update hash, mark used, redirect) — completion flow
- [x] `champions-app/app/(auth)/login/login-form-fields.tsx` — add forgot-password link — discoverability (FR-AUTH-7)
- [x] `champions-app/app/(auth)/login/page.tsx` — add `passwordUpdated=1` success banner — post-reset feedback
- [x] `champions-app/lib/auth/middleware-policy.ts` + `champions-app/middleware.ts` — auth redirect policy for new routes — consistency with register
- [x] `champions-app/.env.example` — document `AUTH_RATE_LIMIT_PASSWORD_RESET_*` if added — ops clarity
- [x] Tests: `password-reset.test.ts`, `forgot-password/actions.test.ts`, `reset-password/actions.test.ts`, extend `auth-pages.test.tsx` — mock Resend; cover hashing, expiry, single-use, rate limit, generic responses

**Acceptance Criteria:**
- Given I am on the login page, when I click « Mot de passe oublié ? », then I reach `/forgot-password` with an email form in French auth styling.
- Given I submit any email on `/forgot-password`, when processed, then the UI always shows « Si un compte existe pour cette adresse, un email de réinitialisation a été envoyé. » regardless of whether the email exists.
- Given a registered teacher email and rate limit not exceeded, when forgot-password succeeds, then a reset email is sent via Resend (or logged in dev) with a 60-minute link and no tracking.
- Given a valid unused token within 60 minutes, when I submit matching passwords meeting registration policy, then my password is updated, the token is marked used, and I am redirected to login with « Mot de passe mis à jour. Connectez-vous. »
- Given an expired, used, or invalid token, when I visit `/reset-password`, then I see « Ce lien n'est plus valide. » with a link to `/forgot-password` and no password form.
- Given I am authenticated, when I visit `/forgot-password` or `/reset-password`, then I am redirected to `/dictations`.
- Given the test suite runs, when password-reset tests execute, then Resend is mocked and no real email is sent.

## Design Notes

Token flow:

```typescript
// Generate: crypto.randomBytes(32).toString("hex") → rawToken
// Store: sha256(rawToken) in password_reset_tokens.token_hash
// URL: `${AUTH_URL}/reset-password?token=${rawToken}`
// On success: UPDATE teachers SET password_hash; SET used_at = now()
```

Flash pattern mirrors register → login (`registered=1`); use `passwordUpdated=1` query param on login page.

## Verification

**Commands:**
- `cd champions-app && npm run db:push` — expected: `password_reset_tokens` table exists in Neon
- `cd champions-app && npm test` — expected: all new and existing tests pass
- `cd champions-app && npm run lint` — expected: no errors

**Manual checks:**
- Request reset for known email in dev (no `RESEND_API_KEY`): token in DB, URL in console, generic success in UI.
- Complete reset with valid token; log in with new password.
- Visit `/reset-password?token=bad` — error state, no form.

## Spec Change Log

- **2026-09-02 (review loop 1):** Hardened token lifecycle — invalidate prior tokens on new request and on successful reset; rollback token row on email send failure; index on `token_hash`; `AUTH_URL` required in production; expired-token message on submit when token no longer valid; expanded tests for expiry, weak password, rate-limit defaults, email integration, and forgot-password success UI.

## Suggested Review Order

**Token lifecycle & security**

- Core reset orchestration: SHA-256 storage, invalidation, single-use, bcrypt update
  [`password-reset.ts:1`](../../champions-app/lib/services/password-reset.ts#L1)

- Persistence model for single-use hashed tokens
  [`schema.ts:21`](../../champions-app/lib/db/schema.ts#L21)

**Request flow (anti-enumeration)**

- Generic success regardless of email existence; rate-limit before service call
  [`actions.ts:1`](../../champions-app/app/(auth)/forgot-password/actions.ts#L1)

- French request UI with post-submit success state
  [`forgot-password-form.tsx:1`](../../champions-app/app/(auth)/forgot-password/forgot-password-form.tsx#L1)

**Completion flow**

- Server-side token gate before showing password form
  [`page.tsx:1`](../../champions-app/app/(auth)/reset-password/page.tsx#L1)

- Password policy reuse and login redirect with flash param
  [`actions.ts:1`](../../champions-app/app/(auth)/reset-password/actions.ts#L1)

**Email delivery**

- French template and AUTH_URL-based reset link
  [`send-password-reset-email.ts:1`](../../champions-app/lib/services/send-password-reset-email.ts#L1)

**Auth integration**

- New routes in middleware matcher and authenticated-user redirects
  [`middleware-policy.ts:17`](../../champions-app/lib/auth/middleware-policy.ts#L17)

- Login discoverability link and password-updated banner
  [`login-form-fields.tsx:54`](../../champions-app/app/(auth)/login/login-form-fields.tsx#L54)

**Tests & config**

- Service unit tests for hashing, expiry, rollback, and completion
  [`password-reset.test.ts:1`](../../champions-app/lib/services/password-reset.test.ts#L1)

- Rate-limit kind defaults and env documentation
  [`auth-rate-limit.ts:24`](../../champions-app/lib/services/auth-rate-limit.ts#L24)
