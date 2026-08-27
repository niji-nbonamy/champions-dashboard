# Spike: neon-serverless driver migration for true DB transactions

**Date:** 2026-08-27  
**Owner:** dev  
**Epic 2 retro item:** `epic-2-retro-item-11-evaluate-neon-serverless-driver-migratio`  
**Gate:** before Epic 3 story 3-4 (dictation save with concurrent writes)

## Context

`champions-app/lib/db/index.ts` uses `drizzle-orm/neon-http` with `@neondatabase/serverless` `neon()`. Several services call `db.transaction()`:

| Service | File | Risk today |
|---------|------|------------|
| Year reset | `lib/services/reset-class-year.ts` | Low — single teacher, batch delete |
| Word matrix replace | `lib/services/replace-word-count-matrix.ts` | Low — single writer |
| Level assignment | `lib/services/assign-student-level.ts` | Low — per-student |
| Dictation save (Epic 3) | not implemented | **High** — multi-row grid save |

`neon-http` transactions are implemented as HTTP batch requests. They provide atomicity within a single request but do not offer interactive transaction semantics or the same isolation guarantees as a WebSocket session.

## Options

### A. Stay on `neon-http` (status quo)

- **Pros:** No migration cost; works on Vercel serverless; current tests pass.
- **Cons:** Weaker guarantees under concurrent writers; harder to debug partial failures.
- **Verdict for MVP:** Acceptable through story 3-1 (create dictation only inserts one row).

### B. Migrate to `neon-serverless` WebSocket driver

- **Pros:** True interactive transactions; better fit for dictation grid save (many rows + promotion detection in one TX).
- **Cons:** Connection lifecycle on serverless (pooling, idle timeout); `drizzle-orm/neon-serverless` import change; verify Vercel fluid compute / connection limits.
- **Verdict:** **Recommended before 3-4**, not before 3-1.

### C. Hybrid — HTTP for reads, serverless for write paths

- **Pros:** Minimal blast radius.
- **Cons:** Two clients to maintain; easy to call the wrong one.
- **Verdict:** Reject — violates « boring technology » unless profiling proves need.

## Recommendation

1. **Ship 3-1–3-3 on current driver** — single-row or read-heavy paths only.
2. **Schedule migration spike as story 3-0 or first task of 3-4** — swap `getDb()` to `neon-serverless`, run `reset-class-year` + `replace-word-count-matrix` integration tests against Neon branch.
3. **Add one integration test** for transaction rollback on dictation save once 3-4 lands — mocks are insufficient (see `deferred-work.md` story 2-8 note).

## Acceptance criteria for migration (when executed)

- [ ] `lib/db/index.ts` uses `Pool` or `neon` WebSocket from `@neondatabase/serverless` with `drizzle-orm/neon-serverless`
- [ ] Existing unit tests pass unchanged
- [ ] `npm run db:push` unchanged (still uses `DATABASE_URL_UNPOOLED`)
- [ ] Manual verify: year reset + matrix save on dev Neon branch
- [ ] CI green (`npm test`, `npm run build`, `npm run test:e2e`)

## Open questions

- Does Vercel serverless function duration allow persistent WebSocket pools, or do we open per-request?
- Should integration tests use a dedicated Neon branch (`DATABASE_URL_E2E`)?
