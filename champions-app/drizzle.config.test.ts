import { afterEach, describe, expect, it, vi } from "vitest";

describe("drizzle.config", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("throws when no migration URL is configured", async () => {
    vi.stubEnv("DATABASE_URL_UNPOOLED", "");
    vi.stubEnv("DATABASE_URL", "");

    await expect(import("./drizzle.config")).rejects.toThrow(
      /DATABASE_URL_UNPOOLED/
    );
  });

  it("rejects pooled migration URLs", async () => {
    vi.stubEnv("DATABASE_URL_UNPOOLED", "");
    vi.stubEnv(
      "DATABASE_URL",
      "postgresql://user:pass@ep-xxx-pooler.eu-central-1.aws.neon.tech/neondb"
    );

    await expect(import("./drizzle.config")).rejects.toThrow(
      /direct \(unpooled\)/
    );
  });

  it("falls back to DATABASE_URL when DATABASE_URL_UNPOOLED is blank", async () => {
    const directUrl =
      "postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb";

    vi.stubEnv("DATABASE_URL_UNPOOLED", "");
    vi.stubEnv("DATABASE_URL", directUrl);

    const config = await import("./drizzle.config");
    const credentials = config.default as {
      dbCredentials: { url: string };
    };

    expect(credentials.dbCredentials.url).toBe(directUrl);
  });

  it("prefers DATABASE_URL_UNPOOLED when both URLs are set", async () => {
    const pooledUrl =
      "postgresql://user:pass@ep-xxx-pooler.eu-central-1.aws.neon.tech/neondb";
    const directUrl =
      "postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb";

    vi.stubEnv("DATABASE_URL_UNPOOLED", directUrl);
    vi.stubEnv("DATABASE_URL", pooledUrl);

    const config = await import("./drizzle.config");
    const credentials = config.default as {
      dbCredentials: { url: string };
    };

    expect(credentials.dbCredentials.url).toBe(directUrl);
  });
});
