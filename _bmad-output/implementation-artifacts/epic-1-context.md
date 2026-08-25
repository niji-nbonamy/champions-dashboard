# Epic 1 Context: Foundation & Teacher Access

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Establish the deployable application foundation and teacher access layer so every subsequent epic builds on a consistent Next.js layered monolith with EU-hosted data, authentication plumbing, and branded navigation shell. Teachers must be able to self-register, log in securely, and move through a four-tab laptop shell before roster or dictation features ship.

## Stories

- Story 1.1: Project Scaffold & Development Environment
- Story 1.2: Teacher Registration
- Story 1.3: Teacher Login & Session Management
- Story 1.4: First Login & Class Creation
- Story 1.5: Design System Tokens & Brand Theme
- Story 1.6: App Shell with Navigation & App Bar

## Requirements & Constraints

- Self-registration with email and password (Auth.js); no admin-provisioned accounts.
- Teacher owns exactly one class per school year on first login (MVP).
- Four-tab laptop navigation: Dictées · Élèves · Config · Alertes.
- Generic auth error messages; no email-existence leak on registration.
- EU data residency: Neon Postgres in Frankfurt; Vercel deployment in EU.
- Layered monolith: presentation (`app/`, `components/`), application (`lib/services/`), domain (`lib/domain/`, pure, no I/O), data (`lib/db/`).
- All mutations server-authoritative via Server Actions or route handlers.
- Grade-level agnostic: no school grade (CE2, etc.) in schema or UI copy.
- CHAMPIONS visual identity (Menthe Douce theme) applied via design tokens in later story 1.5.

## Technical Decisions

- **Stack:** Node.js 22 LTS, Next.js 16.3.2, React 19, TypeScript 5.x, Tailwind CSS, shadcn/ui, Auth.js v5, Drizzle ORM, Neon serverless driver, bcryptjs.
- **IDs:** UUID v4 primary keys; DB tables `snake_case` plural; FK `*_id`.
- **Auth:** `Teacher.id` equals Auth.js `users.id` (1:1).
- **Tenancy:** Class-scoped; every entity belongs to one `Class`; authorization in application services.
- **Config:** `DATABASE_URL` (pooled, app runtime), `DATABASE_URL_UNPOOLED` (direct, migrations), and `AUTH_SECRET` required via environment variables.
- **CI/CD:** GitHub → Vercel auto-deploy; migrations via drizzle-kit push or migrate in deploy step.
- **Structural seed:** `app/(auth)/`, `app/(dashboard)/`, `app/api/auth/`, `components/`, `lib/domain/`, `lib/services/`, `lib/db/`, `drizzle/`.

## UX & Interaction Patterns

- Laptop-first; mobile secondary (full mobile flows in Epic 5).
- App bar: Saint Hermeland wordmark left, muted « champions » subtitle, tabs below/inline on wide screens (story 1.6).
- Design tokens: Theme C Menthe Douce — primary `#059669`, accent `#7C3AED`, four CHAMPIONS level badge colors (story 1.5).

## Cross-Story Dependencies

- Story 1.1 blocks all others (scaffold, DB connectivity, env docs).
- Story 1.2–1.3 must complete before 1.4 (registration → login → first class).
- Story 1.5 (tokens) should precede or parallel 1.6 (shell) for correct branding.
- Epic 2+ depend on Epic 1 auth shell and class creation.
