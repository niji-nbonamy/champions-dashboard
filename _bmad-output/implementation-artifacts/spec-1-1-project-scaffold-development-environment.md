---
title: '1-1 Project Scaffold & Development Environment'
type: 'chore'
created: '2026-08-25'
status: 'done'
baseline_commit: 'edeb242a40be6b34aa3ca1b5cf299d6b9d8aa665'
review_loop_iteration: 1
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-testBMAD-2026-08-24/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The repository contains BMAD planning artifacts only — no runnable application, no database connectivity, and no deployable structure for subsequent epics.

**Approach:** Bootstrap a greenfield Next.js 16 layered monolith in `champions-app/` with Tailwind, shadcn/ui, Drizzle ORM wired to Neon Postgres (Frankfurt), Vercel EU config, and documented required environment variables.

## Boundaries & Constraints

**Always:**
- Node.js 22 LTS; Next.js 16.3.2; React 19; TypeScript 5.x.
- Folder layout matches architecture seed under `champions-app/`: `app/(auth)/`, `app/(dashboard)/`, `app/api/auth/`, `components/`, `lib/domain/`, `lib/services/`, `lib/db/`, `drizzle/`.
- Drizzle app runtime connects via `DATABASE_URL` (Neon **pooled** connection, hostname contains `-pooler`); `drizzle-kit` migrations use `DATABASE_URL_UNPOOLED` (Neon **direct** connection, no `-pooler`). Connection verified with a minimal health query or schema push.
- Vercel config targets EU region (`fra1`).
- `.env.example` documents `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, and `AUTH_SECRET` as required.
- Do not implement auth flows, UI features, or domain logic beyond scaffold placeholders.

**Ask First:**
- Whether to scaffold at repo root instead of `champions-app/` subdirectory.
- Whether Neon project/branch credentials are available locally before DB connectivity test.

**Never:**
- Store secrets in committed files.
- Add business tables or Auth.js user flows (stories 1.2–1.3).
- Deploy to non-EU regions.
- Reference school grade levels in schema or copy (AD-11).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Dev server start | Valid `.env.local` with `DATABASE_URL` (pooled) | `npm run dev` serves Next.js on localhost | Missing env → clear startup error referencing `.env.example` |
| DB connectivity (app) | Valid Neon Frankfurt pooled `DATABASE_URL` | Drizzle client connects; health query succeeds | Invalid URL → connection error logged; no silent fallback |
| DB migrations | Valid Neon Frankfurt direct `DATABASE_URL_UNPOOLED` (or non-pooler `DATABASE_URL`) | `drizzle-kit push` succeeds | Pooled URL only → `drizzle.config.ts` rejects with clear error referencing unpooled string |
| Build | Production build | `npm run build` completes without errors | Type/lint errors fail build |
| EU deploy config | `vercel.json` present | Region set to `fra1` | N/A |

</frozen-after-approval>

## Code Map

- `champions-app/` -- **CREATE** greenfield app root; all application code lives here, separate from BMAD `_bmad-output/` artifacts at repo root.
- `champions-app/package.json` -- **CREATE** with pinned Next.js 16.3.2, React 19, TypeScript 5.x, Tailwind, Drizzle, `@neondatabase/serverless`, Auth.js deps (install only, no config yet).
- `champions-app/app/layout.tsx` -- **CREATE** root layout with Tailwind globals.
- `champions-app/app/page.tsx` -- **CREATE** minimal health landing (e.g., "CHAMPIONS" + dev-ready indicator).
- `champions-app/app/(auth)/` -- **CREATE** empty route group placeholder for stories 1.2–1.3.
- `champions-app/app/(dashboard)/` -- **CREATE** empty route group placeholder for stories 1.4–1.6.
- `champions-app/app/api/auth/[...nextauth]/` -- **CREATE** empty route handler stub (wired in story 1.3).
- `champions-app/components/` -- **CREATE** directory; shadcn/ui init with `components/ui/` and `lib/utils.ts` (`base-nova` style).
- `champions-app/lib/db/schema.ts` -- **CREATE** empty Drizzle schema export (tables added in later stories).
- `champions-app/lib/db/index.ts` -- **CREATE** Drizzle client using `@neondatabase/serverless` + `DATABASE_URL`.
- `champions-app/lib/domain/` -- **CREATE** empty directory (pure modules in later epics).
- `champions-app/lib/services/` -- **CREATE** empty directory (orchestration in later stories).
- `champions-app/drizzle/` -- **CREATE** migrations directory; `drizzle.config.ts` at app root.
- `champions-app/.env.example` -- **CREATE** documents `DATABASE_URL` (pooled), `DATABASE_URL_UNPOOLED` (direct, migrations), `AUTH_SECRET`.
- `champions-app/vercel.json` -- **CREATE** `{ "regions": ["fra1"] }`.
- `champions-app/README.md` -- **CREATE** setup: Node 22, env vars, `npm install`, `npm run dev`, Neon Frankfurt note.
- `_bmad-output/` -- **READ-ONLY** planning artifacts; do not move or delete.

## Tasks & Acceptance

**Execution:**
- [x] `champions-app/` -- Initialize Next.js 16.3.2 app with App Router, TypeScript, Tailwind, ESLint, `src` disabled -- establishes deployable foundation per architecture.
- [x] `champions-app/components.json` + `components/ui/` -- Init shadcn/ui (`base-nova` style) -- UI component baseline for all epics.
- [x] `champions-app/lib/db/schema.ts` + `champions-app/lib/db/index.ts` + `champions-app/drizzle.config.ts` -- Wire Drizzle to Neon via `DATABASE_URL` -- proves EU DB connectivity.
- [x] `champions-app/app/(auth)/`, `champions-app/app/(dashboard)/`, `champions-app/app/api/auth/[...nextauth]/` -- Create route group/handler stubs -- matches layered monolith seed.
- [x] `champions-app/lib/domain/`, `champions-app/lib/services/` -- Create empty dirs with `.gitkeep` -- preserves architecture boundaries.
- [x] `champions-app/.env.example` + `champions-app/README.md` -- Document `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, and `AUTH_SECRET` -- onboarding for developers and Vercel.
- [x] `champions-app/vercel.json` -- Set EU region `fra1` -- satisfies AD-8 EU residency for deployment.

**Acceptance Criteria:**
- Given a fresh repository, when the scaffold is initialized, then the project runs on Node.js 22 LTS with Next.js 16.3.2, React 19, TypeScript 5.x, Tailwind CSS, and shadcn/ui.
- Given the scaffold, when inspecting folder structure, then it matches `app/(auth)/`, `app/(dashboard)/`, `components/`, `lib/domain/`, `lib/services/`, `lib/db/`, `drizzle/` under `champions-app/`.
- Given a valid Neon Frankfurt pooled `DATABASE_URL`, when running Drizzle connectivity check, then the ORM connects successfully.
- Given a valid Neon Frankfurt direct `DATABASE_URL_UNPOOLED`, when running `drizzle-kit push`, then schema push succeeds.
- Given `vercel.json`, when deployed to Vercel, then the function region targets EU (`fra1`).
- Given `.env.example`, when a new developer clones the repo, then `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, and `AUTH_SECRET` are documented as required environment variables.

### Review Findings

*Chunk 1 — Database layer (2026-08-25)*

**Decision needed:**
- [x] [Review][Decision] Dual URL strategy vs spec AC — **Résolu (A)** : spec mise à jour pour formaliser le modèle dual pooled (`DATABASE_URL`) / unpooled (`DATABASE_URL_UNPOOLED`).

**Patch:**
- [x] [Review][Patch] Empty string blocks DATABASE_URL fallback in drizzle.config [`drizzle.config.ts:7-9`]
- [x] [Review][Patch] Add tests for drizzle.config.ts pooler guard and missing URL error [`drizzle.config.ts:11-21`]
- [x] [Review][Patch] Assert DATABASE_URL_UNPOOLED in scaffold env docs test [`scaffold.test.ts:27-32`]
- [x] [Review][Patch] Mark DATABASE_URL as Required in .env.example [`.env.example:1-2`]
- [x] [Review][Patch] Strengthen DB client tests (undefined DATABASE_URL, neon URL wiring) [`index.test.ts:9-33`]

*Chunk 2 — Application shell (2026-08-25)*

**Decision needed:**
- [x] [Review][Decision] shadcn style `base-nova` vs spec « default » — **Résolu (A)** : spec mise à jour ; `base-nova` + `@base-ui/react` acceptés comme baseline shadcn pour Next.js 16.

**Patch:**
- [x] [Review][Patch] Button `className` passed into `buttonVariants()` instead of `cn()` merge [`button.tsx:52`]
- [x] [Review][Patch] Add auth route stub tests (GET/POST return 501 + body) [`route.ts:3-9`]
- [x] [Review][Patch] Add landing page content test (CHAMPIONS + dev-ready copy) [`page.tsx:1-9`]
- [x] [Review][Patch] Add root layout metadata test (title, description) [`layout.tsx:15-18`]
- [x] [Review][Patch] Add trailing newline to globals.css [`globals.css:130`]

*Chunk 3 — Config & deployment (2026-08-25)*

**Patch:**
- [x] [Review][Patch] Exclude `**/*.test.ts(x)` from `tsconfig.json` — build fails on `drizzle.config.test.ts` TS error [`tsconfig.json:33`]
- [x] [Review][Patch] README step 4: require `DATABASE_URL_UNPOOLED` for `db:push`, not only `DATABASE_URL` [`README.md:36-40`]
- [x] [Review][Patch] README: add `cd champions-app` prerequisite for monorepo setup [`README.md:10-16`]
- [x] [Review][Patch] Bump `@types/node` to `^22` to match `engines.node` [`package.json:37`]
- [x] [Review][Patch] Move `shadcn` CLI from `dependencies` to `devDependencies` [`package.json:30`]
- [x] [Review][Patch] Remove unused `pg` devDependency [`package.json:42`]
- [x] [Review][Patch] Add scaffold tests for `engines.node`, and pinned `next`/`react`/`typescript` versions [`scaffold.test.ts`]
- [x] [Review][Patch] Add drizzle.config test: unpooled URL wins when both env vars set [`drizzle.config.test.ts`]
- [x] [Review][Patch] Document Vercel monorepo `rootDirectory: champions-app` in README Deployment [`README.md:71-74`]
- [x] [Review][Patch] Update spec execution checkbox to mention `DATABASE_URL_UNPOOLED` [`spec-1-1:80`]

*Chunk 5 — BMAD artifacts (2026-08-25)*

**Patch:**
- [x] [Review][Patch] Sync `epic-1-context.md` config line with dual URL model [`epic-1-context.md:36`]
- [x] [Review][Patch] Align `sprint-status.yaml` story `1-1` to `done` (spec already `done`) [`sprint-status.yaml:40`]
- [x] [Review][Patch] Bump `review_loop_iteration` to 1 after completed review [`spec-1-1:7`]

**Deferred:**
- [x] [Review][Defer] Singleton race on concurrent getDb() cold start [`index.ts:21-27`] — deferred, pre-existing
- [x] [Review][Defer] No timeout on checkDatabaseConnection [`index.ts:29-31`] — deferred, pre-existing
- [x] [Review][Defer] No runtime AUTH_SECRET validation [`index.ts`] — deferred, pre-existing (story 1.3 scope)
- [x] [Review][Defer] No db:migrate / db:generate scripts [`package.json`] — deferred, pre-existing (spec allows push-only)
- [x] [Review][Defer] checkDatabaseConnection not wired to HTTP health route [`index.ts:29`] — deferred, pre-existing (manual verification sufficient for scaffold)

## Spec Change Log

- **2026-08-25 (code review, chunk 1)** — Formalized Neon dual-connection model: `DATABASE_URL` (pooled) for app runtime, `DATABASE_URL_UNPOOLED` (direct) for `drizzle-kit` migrations. Updated AC, I/O matrix, and env docs accordingly.
- **2026-08-25 (code review, chunk 2)** — Accepted shadcn `base-nova` style as the current UI baseline for Next.js 16.
- **2026-08-25 (code review, chunk 3)** — Build/typecheck fixes, README monorepo + dual-URL docs, package.json hygiene, expanded scaffold tests.
- **2026-08-25 (code review, chunk 5)** — Synced epic context and sprint tracking with post-review spec state.

## Design Notes

Scaffold in `champions-app/` subdirectory keeps BMAD planning artifacts (`_bmad-output/`, `_bmad/`) at repo root without collision. Auth.js and bcryptjs are installed as dependencies but not configured — stories 1.2–1.3 own registration and session flows.

## Verification

**Commands:**
- `cd champions-app && npm run build` -- expected: production build succeeds with zero errors.
- `cd champions-app && npm run dev` -- expected: dev server starts on localhost.
- `cd champions-app && npx drizzle-kit push` -- expected: schema push succeeds when `DATABASE_URL_UNPOOLED` (or a non-pooler `DATABASE_URL`) is set (or skip with documented manual step if no Neon creds locally).

**Manual checks (if no CLI):**
- Confirm `champions-app/vercel.json` contains `"regions": ["fra1"]`.
- Confirm `.env.example` lists `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, and `AUTH_SECRET`.

## Suggested Review Order

**Database layer**

- Lazy Neon client with explicit missing-env error referencing `.env.example`.
  [`index.ts:11`](../../champions-app/lib/db/index.ts#L11)

- Drizzle kit config fails fast when migration URL is absent or pooled.
  [`drizzle.config.ts:3`](../../champions-app/drizzle.config.ts#L3)

**Application shell**

- Minimal landing page proving the dev environment boots.
  [`page.tsx:1`](../../champions-app/app/page.tsx#L1)

- Auth route stub reserved for story 1.3 wiring.
  [`route.ts:1`](../../champions-app/app/api/auth/[...nextauth]/route.ts#L1)

**Deployment & environment**

- EU residency enforced for Vercel functions.
  [`vercel.json:1`](../../champions-app/vercel.json#L1)

- Required secrets documented for onboarding.
  [`.env.example:1`](../../champions-app/.env.example#L1)

**Tests & tooling**

- Matrix coverage for env docs, EU region, and folder seed.
  [`scaffold.test.ts:8`](../../champions-app/lib/config/scaffold.test.ts#L8)

- Database client error and mocked connectivity checks.
  [`index.test.ts:9`](../../champions-app/lib/db/index.test.ts#L9)
