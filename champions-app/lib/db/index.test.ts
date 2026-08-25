import { afterEach, describe, expect, it, vi } from "vitest";

describe("database client", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("throws a clear error when DATABASE_URL is an empty string", async () => {
    vi.stubEnv("DATABASE_URL", "");

    const { getDb } = await import("./index");

    expect(() => getDb()).toThrow(/DATABASE_URL is not set/);
    expect(() => getDb()).toThrow(/\.env\.example/);
  });

  it("throws a clear error when DATABASE_URL is undefined", async () => {
    vi.unstubAllEnvs();
    delete process.env.DATABASE_URL;

    const { getDb } = await import("./index");

    expect(() => getDb()).toThrow(/DATABASE_URL is not set/);
    expect(() => getDb()).toThrow(/\.env\.example/);
  });

  it("passes DATABASE_URL to neon when checking the connection", async () => {
    const databaseUrl = "postgresql://user:pass@localhost/test";
    vi.stubEnv("DATABASE_URL", databaseUrl);

    const execute = vi.fn().mockResolvedValue({ rows: [{ "?column?": 1 }] });
    const neon = vi.fn(() => vi.fn());
    const drizzle = vi.fn(() => ({ execute }));

    vi.doMock("@neondatabase/serverless", () => ({
      neon,
    }));
    vi.doMock("drizzle-orm/neon-http", () => ({
      drizzle,
    }));

    const { checkDatabaseConnection } = await import("./index");
    await checkDatabaseConnection();

    expect(neon).toHaveBeenCalledWith(databaseUrl);
    expect(drizzle).toHaveBeenCalledWith(expect.any(Function), {
      schema: expect.any(Object),
    });
    expect(execute).toHaveBeenCalled();
  });
});
