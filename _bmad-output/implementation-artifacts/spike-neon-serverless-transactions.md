# Spike: neon-serverless driver migration for true DB transactions

**Date:** 2026-08-27  
**Owner:** dev  
**Epic 2 retro item:** `epic-2-retro-item-11-evaluate-neon-serverless-driver-migratio`  
**Original gate:** before Epic 3 story 3-4 (dictation save with concurrent writes)  
**Status:** **Executed** 2026-08-27 — commit `2b6c241` on `master` (accelerated after production bug; see Execution below)

## Context (pre-migration)

`champions-app/lib/db/index.ts` used `drizzle-orm/neon-http` with `@neondatabase/serverless` `neon()`. Several services call `db.transaction()`:

| Service | File | Risk today |
|---------|------|------------|
| Year reset | `lib/services/reset-class-year.ts` | Low — single teacher, batch delete |
| Word matrix replace | `lib/services/replace-word-count-matrix.ts` | Low — single writer |
| Level assignment | `lib/services/assign-student-level.ts` | Low — per-student |
| Dictation save (Epic 3) | not implemented | **High** — multi-row grid save |

With `neon-http`, Drizzle's `db.transaction()` **throws** (`No transactions support in neon-http driver`) — not merely weaker batch semantics. Level assignment, matrix replace, and year reset were broken at runtime until migration.

## Options

### A. Stay on `neon-http` (status quo)

- **Pros:** No migration cost; works on Vercel serverless for single-statement queries.
- **Cons:** `db.transaction()` unsupported; level assignment and other TX paths fail.
- **Verdict:** **Rejected** after runtime verification.

### B. Migrate to `neon-serverless` WebSocket driver

- **Pros:** True interactive transactions; required for `db.transaction()` callers.
- **Cons:** Connection lifecycle on serverless (pooling, idle timeout); verify Vercel limits.
- **Verdict:** **Implemented** — `Pool` from `@neondatabase/serverless` + `drizzle-orm/neon-serverless`.

### C. Hybrid — HTTP for reads, serverless for write paths

- **Pros:** Minimal blast radius.
- **Cons:** Two clients to maintain; easy to call the wrong one.
- **Verdict:** Reject — violates « boring technology » unless profiling proves need.

## Recommendation (original)

1. **Ship 3-1–3-3 on current driver** — single-row or read-heavy paths only.
2. **Schedule migration before 3-4** — swap `getDb()` to `neon-serverless`.
3. **Add one integration test** for transaction rollback on dictation save once 3-4 lands.

**Update:** migration executed early (before 3-2) because level assignment failed in dev/prod with `neon-http`.

## Execution (2026-08-27)

- **Commit:** `2b6c241` — `fix(champions-app): restore level assignment and polish level badges`
- **Change:** `lib/db/index.ts` — `neon-http` / `neon()` → `neon-serverless` / `new Pool({ connectionString })`
- **Trigger:** teachers could not assign CHAMPIONS levels (`Assignation impossible. Réessayez.`); root cause `No transactions support in neon-http driver` in `assign-student-level.ts`
- **Verified:** level assignment on dev Neon; unit tests green (`lib/db/index.test.ts` updated)

## Acceptance criteria for migration

- [x] `lib/db/index.ts` uses `Pool` from `@neondatabase/serverless` with `drizzle-orm/neon-serverless`
- [x] Existing unit tests pass unchanged (416 tests at migration time)
- [x] `npm run db:push` unchanged (still uses `DATABASE_URL_UNPOOLED`)
- [x] Manual verify: level assignment on dev Neon branch
- [ ] Manual verify: year reset + matrix save on dev Neon branch (recommended before relying on Config reset in prod)
- [x] CI green at commit time (`npm test` for affected suites)

## Open questions

- Does Vercel serverless function duration allow persistent WebSocket pools, or do we open per-request? **Monitor in prod** after deploy.
- Should integration tests use a dedicated Neon branch (`DATABASE_URL_E2E`)? Still open for story 3-4 transaction rollback test.

## Follow-ups

- DB integration test for real transaction atomicity on `resetClassYear` — still deferred (`deferred-work.md`)
- Roster CSV import still count-then-insert without transaction wrapper — separate TOCTOU risk (`import-roster-csv.ts`)
