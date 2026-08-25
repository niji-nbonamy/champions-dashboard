---
title: '1-2 Teacher Registration'
type: 'feature'
created: '2026-08-25'
status: 'done'
baseline_commit: '47d4810103595067683ebe3404fe8e7de42b12ed'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-testBMAD-2026-08-24/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Teachers cannot self-register — there is no `teachers` table, no registration UI, and no path to create credentials before story 1.3 login.

**Approach:** Add Drizzle `teachers` schema (uuid id, email, password_hash), a registration server action via `lib/services/register-teacher.ts`, and `app/(auth)/register` + stub `app/(auth)/login` with post-registration redirect and success message. `Teacher.id` is the uuid inserted at registration — the same id Auth.js will use as `user.id` in story 1.3.

## Boundaries & Constraints

**Always:**
- `Teacher.id` is uuid v4 (DB default); equals future Auth.js `user.id` (AD-2).
- Password hashed with `bcryptjs` before storage; never store plaintext passwords.
- Registration mutations server-authoritative via Server Action → application service → DB (AD-3).
- Generic user-facing error on any registration failure (duplicate email, invalid input, DB error) — NFR9; no email-existence leak.
- Email normalized to lowercase trimmed before uniqueness check and storage.
- Minimum password length 8 characters (domain validation).
- No Auth.js session creation, login flow, or `api/auth` handler wiring (story 1.3).
- No `Class` creation (story 1.4).
- No grade-level references in schema or copy (AD-11).

**Ask First:**
- Changing minimum password rules or adding email verification.
- Using Auth.js adapter `user` table instead of `teachers` as the sole identity table.

**Never:**
- Reveal whether an email is already registered (distinct error messages or field hints).
- Implement login/session (story 1.3).
- Commit secrets or real credentials.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Successful registration | Valid email + password (≥8 chars), email not in DB | `teachers` row created; redirect to `/login?registered=1`; login page shows success message | N/A |
| Duplicate email | Email already registered (any case variant) | Same generic error message as other failures; remain on register page | No hint that email exists |
| Invalid email | Malformed or empty email | Generic error; no DB insert | N/A |
| Weak password | Password &lt; 8 characters | Generic error; no DB insert | N/A |
| Missing fields | Empty email or password | Generic error; no DB insert | N/A |

</frozen-after-approval>

## Code Map

- `champions-app/lib/db/schema.ts` -- **MODIFY** empty export; add `teachers` table (`id`, `email` unique, `password_hash`, `created_at`). Snake_case columns per architecture.
- `champions-app/lib/db/index.ts` -- **READ** `getDb()` singleton; reuse for inserts. [`index.ts:21`](../../champions-app/lib/db/index.ts#L21)
- `champions-app/lib/domain/registration.ts` -- **CREATE** pure validation: email format, password min length, `REGISTRATION_ERROR_MESSAGE` constant.
- `champions-app/lib/services/register-teacher.ts` -- **CREATE** orchestration: validate → hash → insert; map all failures to generic error.
- `champions-app/app/(auth)/register/page.tsx` -- **CREATE** registration form (email, password) + error display.
- `champions-app/app/(auth)/register/actions.ts` -- **CREATE** Server Action calling register service; redirect on success.
- `champions-app/app/(auth)/login/page.tsx` -- **CREATE** stub login page; success banner when `registered=1` query param.
- `champions-app/components/ui/button.tsx` -- **REUSE** submit button. [`button.tsx:43`](../../champions-app/components/ui/button.tsx#L43)
- `champions-app/app/api/auth/[...nextauth]/route.ts` -- **READ-ONLY** 501 stub; story 1.3 wires handlers. [`route.ts:3`](../../champions-app/app/api/auth/[...nextauth]/route.ts#L3)
- `champions-app/package.json` -- **READ** `bcryptjs`, `next-auth` already installed; no new deps expected.

## Tasks & Acceptance

**Execution:**
- [x] `champions-app/lib/db/schema.ts` -- Define `teachers` table with uuid PK, unique email, password_hash -- identity store for AD-2.
- [x] `champions-app/lib/domain/registration.ts` -- Add email/password validation and shared generic error message -- pure domain rules + NFR9 messaging.
- [x] `champions-app/lib/services/register-teacher.ts` -- Implement register flow with bcrypt hash and duplicate-safe generic errors -- application layer per AD-3.
- [x] `champions-app/app/(auth)/register/actions.ts` + `page.tsx` -- Server Action + form UI -- teacher self-registration entry point.
- [x] `champions-app/app/(auth)/login/page.tsx` -- Stub with registration success message -- satisfies redirect target AC.
- [x] `champions-app/lib/domain/registration.test.ts` -- Unit tests for validation rules and matrix invalid-input rows.
- [x] `champions-app/lib/services/register-teacher.test.ts` -- Unit tests with mocked DB for success, duplicate, and generic error paths.

**Acceptance Criteria:**
- Given I am on the registration page and no account exists for my email, when I submit a valid email and password, then a Teacher record is created with a uuid `id`, and I am redirected to the login page with a success message.
- Given my email is already registered, when I submit the registration form, then I see a generic error without revealing whether the email exists (NFR9).

## Design Notes

Single `teachers` table holds credentials; Auth.js Credentials provider in story 1.3 will authorize against this table and return `{ id: teacher.id, email }` so `user.id` matches `Teacher.id` without a separate `users` table.

## Verification

**Commands:**
- `cd champions-app && npm test` -- expected: all tests pass including new registration tests.
- `cd champions-app && npm run build` -- expected: production build succeeds.

**Manual checks (if no CLI):**
- Visit `/register`, submit valid credentials → redirect to `/login?registered=1` with success copy.
- Submit duplicate email → generic error, no "email already exists" text.

## Suggested Review Order

**Registration orchestration**

- Server-authoritative insert with bcrypt and generic failure mapping.
  [`register-teacher.ts:24`](../../champions-app/lib/services/register-teacher.ts#L24)

**Domain validation & NFR9 messaging**

- Shared generic error string; email normalize + password min length.
  [`registration.ts:1`](../../champions-app/lib/domain/registration.ts#L1)

**Schema**

- `teachers` table: uuid id aligns with future Auth.js `user.id`.
  [`schema.ts:3`](../../champions-app/lib/db/schema.ts#L3)

**UI & server action**

- Form posts to Server Action; redirect on success.
  [`actions.ts:14`](../../champions-app/app/(auth)/register/actions.ts#L14)

- Registration form with generic error display.
  [`register-form.tsx:14`](../../champions-app/app/(auth)/register/register-form.tsx#L14)

- Login stub shows success after `?registered=1`.
  [`page.tsx:9`](../../champions-app/app/(auth)/login/page.tsx#L9)

**Tests**

- Service mocks cover success, duplicate, invalid input, DB failure.
  [`register-teacher.test.ts:27`](../../champions-app/lib/services/register-teacher.test.ts#L27)

- Domain rules and generic message wording.
  [`registration.test.ts:12`](../../champions-app/lib/domain/registration.test.ts#L12)

