# CHAMPIONS — Dictation Dashboards

Teacher-facing dictation dashboards for primary classrooms. EU-hosted, class-scoped, grade-level agnostic.

## Prerequisites

- **Node.js 22 LTS** (via nvm: `nvm use` reads `.nvmrc`)
- **npm 11.6.2** — bundled with Node 22 via nvm, or enforced by Corepack from `packageManager` in `package.json`
- Neon Postgres project in **AWS EU (Frankfurt)** region

## Setup

All commands below run from the `champions-app/` directory (the app lives in a subdirectory of the BMAD monorepo):

```bash
cd champions-app
```

1. Install dependencies:

   ```bash
   npm install
   ```

   **nvm users:** if `npm --version` already shows `11.6.2`, you are aligned with CI — no extra setup. Corepack is optional on your machine.

   **Otherwise** (optional, once per machine): `corepack enable` then re-check `npm --version` in this directory.

2. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

   `npm run db:push` and `npm run db:studio` load variables from `.env.local` automatically (same as Next.js).

3. Configure `.env.local`:

   | Variable | Required | Description |
   | --- | --- | --- |
   | `DATABASE_URL` | Yes | Neon **pooled** connection string (hostname contains `-pooler`) for the app |
   | `DATABASE_URL_UNPOOLED` | Yes for migrations | Neon **direct** connection string (no `-pooler`) for `npm run db:push` |
   | `AUTH_SECRET` | Yes | Auth.js session secret (`openssl rand -base64 32`) |
   | `AUTH_URL` | Yes on Vercel | Canonical public URL of the app, without trailing slash (e.g. `https://champions.vercel.app`). Auth.js uses it for callback URLs in production. |
   | `AUTH_TRUST_HOST` | Yes on Vercel | Set to `true` so Auth.js trusts the `Host` header behind Vercel's reverse proxy. Omit or leave unset for local `npm run dev`. |
   | `RECAPTCHA_SITE_KEY` | Prod when captcha enabled | Google reCAPTCHA v2 site key (registration widget) |
   | `RECAPTCHA_SECRET_KEY` | Prod when captcha enabled | Google reCAPTCHA v2 secret for server verification. In non-production, verification is bypassed when this variable is absent |

   In the Neon dashboard → **Connect**, copy both connection strings (pooled + direct). Using only the pooled URL for `db:push` can hang at « Pulling schema from database... ».

4. Push schema to Neon (when `DATABASE_URL_UNPOOLED` is set):

   ```bash
   npm run db:push
   ```

   Without valid `DATABASE_URL` and `DATABASE_URL_UNPOOLED`, the app builds and runs but database calls and migrations will fail with clear errors referencing `.env.example`.

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
```

## Tests

```bash
npm test
```

### E2E smoke (Playwright)

Builds the app, starts it on port 3100, and runs browser smoke tests (login, register, auth redirect):

```bash
npm run test:e2e
```

First run: install the Chromium browser with `npx playwright install chromium`.

`npm run test:e2e` sets `AUTH_URL` and `AUTH_TRUST_HOST=true` for the test server so Auth.js accepts `127.0.0.1:3100`.

CI uses the same `AUTH_SECRET` and a placeholder `DATABASE_URL` as unit tests — smoke tests only hit public auth routes, not the database.

## Database

- **ORM:** Drizzle with `@neondatabase/serverless` (`Pool` + `drizzle-orm/neon-serverless` for WebSocket transactions)
- **Schema:** `lib/db/schema.ts` (empty scaffold — tables added in later stories)
- **Client:** `lib/db/index.ts` — lazy-initialized via `getDb()`
- **Connectivity check:** `checkDatabaseConnection()` runs `SELECT 1`

## Deployment

- **Platform:** Vercel (EU region `fra1` via `vercel.json`)
- **Monorepo:** set **Root Directory** to `champions-app` in the Vercel project settings (the Next.js app is not at the repository root)
- **Database:** Neon Frankfurt — no replica outside EU on free tier
- **Auth.js on Vercel:** add `AUTH_URL` (your production URL) and `AUTH_TRUST_HOST=true` in the Vercel project environment variables, alongside `AUTH_SECRET`. Without them, login callbacks can fail in production even when local dev works.

## Architecture

Layered monolith under `champions-app/`:

```
app/(auth)/          — login, register (stories 1.2–1.3)
app/(dashboard)/     — main tabs (stories 1.4–1.6)
app/api/auth/        — Auth.js handlers
components/          — UI components (shadcn/ui)
lib/domain/          — pure domain modules (no I/O)
lib/services/        — application orchestration
lib/db/              — Drizzle schema and client
drizzle/             — migrations
```
