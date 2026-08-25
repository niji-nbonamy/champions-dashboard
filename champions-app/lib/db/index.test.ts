import { afterEach, describe, expect, it, vi } from "vitest";

describe("database client", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("throws a clear error when DATABASE_URL is missing", async () => {
    vi.stubEnv("DATABASE_URL", "");

    const { getDb } = await import("./index");

    expect(() => getDb()).toThrow(/DATABASE_URL is not set/);
    expect(() => getDb()).toThrow(/\.env\.example/);
  });

  it("connects when DATABASE_URL is set", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://user:pass@localhost/test");

    const execute = vi.fn().mockResolvedValue({ rows: [{ "?column?": 1 }] });
    vi.doMock("@neondatabase/serverless", () => ({
      neon: vi.fn(() => vi.fn()),
    }));
    vi.doMock("drizzle-orm/neon-http", () => ({
      drizzle: vi.fn(() => ({ execute })),
    }));

    const { checkDatabaseConnection } = await import("./index");
    await checkDatabaseConnection();

    expect(execute).toHaveBeenCalled();
  });
});
