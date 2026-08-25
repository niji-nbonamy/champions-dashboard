# CHAMPIONS — Dictation Dashboards

Teacher-facing dictation dashboards for primary classrooms. EU-hosted, class-scoped, grade-level agnostic.

## Prerequisites

- **Node.js 22 LTS**
- Neon Postgres project in **AWS EU (Frankfurt)** region

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

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

   In the Neon dashboard → **Connect**, copy both connection strings (pooled + direct). Using only the pooled URL for `db:push` can hang at « Pulling schema from database... ».

4. Push schema to Neon (when `DATABASE_URL` is set):

   ```bash
   npm run db:push
   ```

   Without a valid `DATABASE_URL`, the app builds and runs but database calls will fail with a clear error referencing `.env.example`.

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

## Database

- **ORM:** Drizzle with `@neondatabase/serverless` HTTP driver
- **Schema:** `lib/db/schema.ts` (empty scaffold — tables added in later stories)
- **Client:** `lib/db/index.ts` — lazy-initialized via `getDb()`
- **Connectivity check:** `checkDatabaseConnection()` runs `SELECT 1`

## Deployment

- **Platform:** Vercel (EU region `fra1` via `vercel.json`)
- **Database:** Neon Frankfurt — no replica outside EU on free tier

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
