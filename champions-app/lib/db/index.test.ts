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

  it("uses the Neon driver for remote database URLs", async () => {
    const databaseUrl =
      "postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb";
    vi.stubEnv("DATABASE_URL", databaseUrl);

    const execute = vi.fn().mockResolvedValue({ rows: [{ "?column?": 1 }] });
    const Pool = vi.fn(() => ({}));
    const drizzle = vi.fn(() => ({ execute }));

    vi.doMock("@neondatabase/serverless", () => ({
      Pool,
    }));
    vi.doMock("drizzle-orm/neon-serverless", () => ({
      drizzle,
    }));

    const { checkDatabaseConnection } = await import("./index");
    await checkDatabaseConnection();

    expect(Pool).toHaveBeenCalledWith({ connectionString: databaseUrl });
    expect(drizzle).toHaveBeenCalledWith(expect.any(Object), {
      schema: expect.any(Object),
    });
    expect(execute).toHaveBeenCalled();
  });
});
