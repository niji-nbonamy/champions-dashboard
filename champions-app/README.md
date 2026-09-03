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
   | `RESEND_API_KEY` | For email sending | Resend API key (`re_…`). Replace `re_xxxxxxxxx` in `.env.example` with your real key from the [Resend dashboard](https://resend.com/api-keys) |
   | `EMAIL_FROM` | For email sending | With a verified domain: `CHAMPIONS <noreply@votredomaine.fr>`. **Without a domain** (Vercel `*.vercel.app` does not work for email): use `onboarding@resend.dev` — Resend only delivers to the email on your Resend account (sandbox mode) |

   **Password reset — local testing with Resend sandbox:** when `EMAIL_FROM=onboarding@resend.dev`, Resend rejects delivery to any address other than the email on your Resend account (403). The UI still shows the generic success message. In development, two fallback paths log the reset URL in the terminal:
   - Without `RESEND_API_KEY`: `[email:dev-fallback]` via `send-transactional-email` (includes full email payload).
   - With a key but delivery failure (e.g. sandbox restriction): `[email:dev-fallback]` with `resetUrl` only.
   Copy the logged link to complete the flow. For real delivery to arbitrary teacher addresses (e.g. `@yopmail.com`), verify a domain in Resend and set `EMAIL_FROM` to an address on that domain.

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

- **ORM:** Drizzle with `@neondatabase/serverless` (`Pool` + `drizzle-orm/neon-serverless` for WebSocket transactions on Neon); `pg` + `drizzle-orm/node-postgres` when `DATABASE_URL` points to `localhost` / `127.0.0.1` (CI E2E)
- **Schema:** `lib/db/schema.ts` (empty scaffold — tables added in later stories)
- **Client:** `lib/db/index.ts` — lazy-initialized via `getDb()`
- **Connectivity check:** `checkDatabaseConnection()` runs `SELECT 1`

## Deployment

- **Platform:** Vercel (EU region `fra1` via `vercel.json`)
- **Monorepo:** set **Root Directory** to `champions-app` in the Vercel project settings (the Next.js app is not at the repository root)
- **Database:** Neon Frankfurt — no replica outside EU on free tier
- **Auth.js on Vercel:** add `AUTH_URL` (your production URL) and `AUTH_TRUST_HOST=true` in the Vercel project environment variables, alongside `AUTH_SECRET`. Without them, login callbacks can fail in production even when local dev works.

### Custom domain (OVH registrar + Vercel hosting)

Use one **canonical** public URL (recommended: apex `https://votredomaine.fr`, with `www` redirected in Vercel). Replace `votredomaine.fr` below with your domain.

#### 1. Vercel — attach the domain

1. Vercel project → **Settings → Domains**.
2. Add `votredomaine.fr` and `www.votredomaine.fr`.
3. Note the DNS records Vercel shows (often):
   - `@` → **A** → `76.76.21.21`
   - `www` → **CNAME** → `cname.vercel-dns.com`
4. Set the primary domain and enable redirect so only the canonical host serves the app (e.g. `www` → apex).

Wait until both domains show **Valid Configuration** and SSL is active (padlock in the browser). Propagation can take from a few minutes up to a few hours.

#### 2. OVH — zone DNS

1. OVH → **Web Cloud → Noms de domaine → votredomaine.fr → Zone DNS**.
2. Remove or replace OVH parking records that conflict (old **A** on `@`, **CNAME** on `www` pointing to OVH).
3. Add the records from step 1.3 exactly as Vercel lists them.
4. Keep **nameservers** on OVH (`dnsXX.ovh.net`) unless you deliberately use another DNS provider.

Do not point `@` to OVH parking if the app lives on Vercel.

#### 3. Vercel — environment variables

Update **Production** (and **Preview** if you test previews with the custom domain):

| Variable | Value |
| --- | --- |
| `AUTH_URL` | `https://votredomaine.fr` (canonical URL, no trailing slash) |
| `AUTH_TRUST_HOST` | `true` |

Redeploy after changing env vars (Vercel → **Deployments → Redeploy**).

#### 4. Resend — transactional email (password reset)

Required for delivery to arbitrary teacher addresses (not only your Resend account).

1. [Resend → Domains](https://resend.com/domains) → add `votredomaine.fr`.
2. Copy the DNS records Resend provides (typically **TXT** for SPF/DKIM, sometimes **MX**).
3. Add them in the same OVH zone DNS (subdomains like `resend._domainkey` are normal).
4. Wait for **Verified** in Resend.
5. Vercel env: `EMAIL_FROM=CHAMPIONS <noreply@votredomaine.fr>` (or another address on that domain).
6. In Resend domain settings, disable **open tracking** and **click tracking** for transactional emails (RGPD — no tracking on password-reset emails).

#### 5. reCAPTCHA (if `RECAPTCHA_SECRET_KEY` is set on Vercel)

In the [Google reCAPTCHA admin](https://www.google.com/recaptcha/admin), add `votredomaine.fr` and `www.votredomaine.fr` to the allowed domains for your site key.

#### 6. Smoke test

- `https://votredomaine.fr` — padlock, login works.
- Register (if captcha configured) and password-reset email — link host must match `AUTH_URL`.
- `https://www.votredomaine.fr` — redirects to canonical URL if configured in Vercel.

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
