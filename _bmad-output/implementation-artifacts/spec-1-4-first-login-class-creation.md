---
title: '1-4 First Login Class Creation'
type: 'feature'
created: '2026-08-25'
status: 'done'
baseline_commit: '8808e7aa031fa7e449a941caaa5154e9961674dd'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-testBMAD-2026-08-24/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Authenticated teachers land on a dashboard stub with no `Class` record — roster and dictation features cannot scope data to a classroom (NFR1, FR2).

**Approach:** Add Drizzle `classes` table (`teacher_id`, `school_year_label`), an onboarding form at `/onboarding/class`, and a dashboard layout guard that redirects teachers without a class to onboarding. Teachers with an existing class skip onboarding and reach `/dictations`.

## Boundaries & Constraints

**Always:**
- `Class` belongs to exactly one `Teacher`; MVP enforces one class per teacher via unique `teacher_id` (AD-1, FR2).
- `school_year_label` is a free-text label (e.g. « 2025-2026 »); no grade-level field or copy (AD-11).
- Class creation mutations server-authoritative via Server Action → application service → DB (AD-3).
- Application services expose `getTeacherClass(teacherId)` for downstream `classId` scoping (NFR1 foundation).
- Authenticated users without a class cannot access dashboard routes; they are redirected to `/onboarding/class`.
- Users with a class visiting `/onboarding/class` are redirected to `/dictations`.
- Unauthenticated access to `/onboarding/class` redirects to `/login`.
- French UI microcopy on the onboarding form (NFR14).

**Ask First:**
- Storing `classId` in the JWT/session (vs resolving from DB on each request).
- Changing post-onboarding landing path away from `/dictations`.
- Allowing multiple classes per teacher or editing `school_year_label` after creation.

**Never:**
- Roster import, students, dictations, or word-count matrix (Epic 2+).
- App shell, tabs, or design tokens (stories 1.5–1.6).
- Year reset or class deletion flows.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| First login, no class | Authenticated teacher, empty `classes` for `teacher_id` | Onboarding form shown; submit valid label → `classes` row created; redirect to `/dictations` | N/A |
| Already has class | Authenticated teacher with existing class visits `/onboarding/class` | Redirect to `/dictations` | N/A |
| Dashboard without class | Authenticated, no class, visit `/dictations` (or any dashboard prefix) | Redirect to `/onboarding/class` | N/A |
| Empty label | Submit blank `school_year_label` | Remain on onboarding; validation error in French | No DB insert |
| Unauthenticated onboarding | No session on `/onboarding/class` | Redirect to `/login` | N/A |
| Duplicate create | Teacher already has class, creation attempted | No second row; generic or validation error | Unique `teacher_id` constraint |

</frozen-after-approval>

## Code Map

- `champions-app/lib/db/schema.ts` -- **MODIFY** add `classes` table (`id` uuid PK, `teacher_id` uuid FK → `teachers.id` unique, `school_year_label` text not null, `created_at`). [`schema.ts:3`](../../champions-app/lib/db/schema.ts#L3)
- `champions-app/lib/db/index.ts` -- **READ** `getDb()` singleton for inserts/selects. [`index.ts:21`](../../champions-app/lib/db/index.ts#L21)
- `champions-app/lib/domain/class.ts` -- **CREATE** `validateSchoolYearLabel`, `CLASS_ONBOARDING_ERROR_MESSAGE`, label bounds (non-empty, max length).
- `champions-app/lib/services/create-class.ts` -- **CREATE** validate → insert class for `teacherId`; guard if class already exists.
- `champions-app/lib/services/get-teacher-class.ts` -- **CREATE** lookup class by `teacher_id`; returns `null` when absent — NFR1 resolver for future stories.
- `champions-app/app/onboarding/class/page.tsx` -- **CREATE** French onboarding heading + form; server-side redirect if class exists.
- `champions-app/app/onboarding/class/class-form.tsx` -- **CREATE** mirror `login-form` / `register-form` pattern (`useActionState`, `noValidate`, `role="alert"`).
- `champions-app/app/onboarding/class/actions.ts` -- **CREATE** Server Action: auth check → `createClass` → redirect `/dictations`.
- `champions-app/app/(dashboard)/layout.tsx` -- **CREATE** server layout: `auth()` → if no class, `redirect("/onboarding/class")`.
- `champions-app/lib/auth/middleware-policy.ts` -- **MODIFY** add `/onboarding` to matcher; extend `getAuthRedirectPath` so unauthenticated `/onboarding/*` → `/login`. [`middleware-policy.ts:1`](../../champions-app/lib/auth/middleware-policy.ts#L1)
- `champions-app/middleware.ts` -- **MODIFY** static matcher includes `/onboarding/:path*` (keep literals in sync with policy). [`middleware.ts:9`](../../champions-app/middleware.ts#L9)
- `champions-app/auth.ts` -- **READ** session provides `user.id` as `teacherId`. [`auth.ts:34`](../../champions-app/auth.ts#L34)
- `champions-app/app/(auth)/login/actions.ts` -- **READ** post-login `redirectTo: "/dictations"`; layout guard handles onboarding redirect. [`actions.ts:24`](../../champions-app/app/(auth)/login/actions.ts#L24)
- `champions-app/app/(auth)/register/register-form.tsx` -- **READ** form/action-state pattern to mirror. [`register-form.tsx:14`](../../champions-app/app/(auth)/register/register-form.tsx#L14)
- `champions-app/app/(dashboard)/dictations/page.tsx` -- **READ** minimal landing after onboarding. [`page.tsx:3`](../../champions-app/app/(dashboard)/dictations/page.tsx#L3)

## Tasks & Acceptance

**Execution:**
- [x] `champions-app/lib/db/schema.ts` -- Define `classes` table with unique `teacher_id` FK -- data model per ER diagram.
- [x] `champions-app/lib/domain/class.ts` -- School year label validation and shared error constant -- pure domain rules.
- [x] `champions-app/lib/services/get-teacher-class.ts` -- Lookup class by teacher id -- NFR1 resolver foundation.
- [x] `champions-app/lib/services/create-class.ts` -- Create class with duplicate guard -- application layer per AD-3.
- [x] `champions-app/app/onboarding/class/` -- Page, form, and Server Action with French copy -- first-login onboarding UX.
- [x] `champions-app/app/(dashboard)/layout.tsx` -- Auth + no-class redirect guard -- blocks dashboard until class exists.
- [x] `champions-app/lib/auth/middleware-policy.ts` -- Protect `/onboarding/*` routes for authenticated-only access.
- [x] `champions-app/lib/domain/class.test.ts` -- Unit tests for label validation matrix.
- [x] `champions-app/lib/services/create-class.test.ts` -- Mocked DB tests for success, duplicate, validation failure.
- [x] `champions-app/lib/services/get-teacher-class.test.ts` -- Mocked lookup tests.
- [x] `champions-app/lib/auth/middleware-policy.test.ts` -- Update for onboarding redirect rules.

**Acceptance Criteria:**
- Given I am authenticated and have no Class yet, when I complete the class creation form with a school year label (e.g. « 2025-2026 »), then a Class record is created linked to my Teacher account and I am redirected to the dashboard.
- Given I already have a Class, when I visit onboarding or log in, then I skip class creation and land on `/dictations`.
- Given I am authenticated without a Class, when I attempt to access any dashboard route, then I am redirected to `/onboarding/class`.

## Verification

**Commands:**
- `cd champions-app && npm test` -- expected: all tests pass including new class/onboarding tests.
- `cd champions-app && npm run build` -- expected: production build succeeds.

**Manual checks (if no CLI):**
- Register → login → onboarding form → submit label → `/dictations` dashboard.
- Revisit `/onboarding/class` with existing class → immediate redirect to `/dictations`.
- Log out, log in again → `/dictations` directly (no onboarding).

## Spec Change Log

- **2026-08-25 — code review loop 0:** Added dashboard stub routes (`students`, `config`, `alerts`) so layout guard covers all dashboard prefixes; extended `createClassAction` for race/duplicate redirect and non-string FormData; added layout/page/action tests; `maxLength` on school year input. KEEP: French onboarding copy, `getTeacherClass` resolver, static middleware matcher sync.

## Suggested Review Order

**Onboarding & class creation**

- Server action validates label, creates class, handles duplicate race gracefully
  [`actions.ts:20`](../../champions-app/app/onboarding/class/actions.ts#L20)

- Application service enforces one class per teacher with duplicate guard
  [`create-class.ts:19`](../../champions-app/lib/services/create-class.ts#L19)

- French onboarding form bound to server action
  [`class-form.tsx:11`](../../champions-app/app/onboarding/class/class-form.tsx#L11)

**Access control & routing**

- Dashboard layout blocks all dashboard routes until class exists
  [`layout.tsx:6`](../../champions-app/app/(dashboard)/layout.tsx#L6)

- Middleware redirects unauthenticated onboarding to login
  [`middleware-policy.ts:37`](../../champions-app/lib/auth/middleware-policy.ts#L37)

- Static matcher must stay in sync with policy (Next.js compile-time requirement)
  [`middleware.ts:9`](../../champions-app/middleware.ts#L9)

**Data model**

- `classes` table with unique `teacher_id` FK
  [`schema.ts:11`](../../champions-app/lib/db/schema.ts#L11)

- Downstream `classId` resolver for future stories
  [`get-teacher-class.ts:12`](../../champions-app/lib/services/get-teacher-class.ts#L12)

**Tests**

- Layout and page redirect contracts
  [`layout.test.tsx:34`](../../champions-app/app/(dashboard)/layout.test.tsx#L34)

- Action failure and race paths
  [`actions.test.ts:96`](../../champions-app/app/onboarding/class/actions.test.ts#L96)
