import { describe, expect, it } from "vitest";

import { isLocalPostgresUrl } from "./is-local-postgres-url";

describe("isLocalPostgresUrl", () => {
  it("returns true for localhost URLs", () => {
    expect(
      isLocalPostgresUrl("postgresql://ci:ci@localhost:5432/champions_ci")
    ).toBe(true);
    expect(
      isLocalPostgresUrl("postgresql://ci:ci@127.0.0.1:5432/champions_ci")
    ).toBe(true);
  });

  it("returns false for Neon URLs", () => {
    expect(
      isLocalPostgresUrl(
        "postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require"
      )
    ).toBe(false);
  });

  it("returns false for invalid URLs", () => {
    expect(isLocalPostgresUrl("not-a-url")).toBe(false);
  });
});
