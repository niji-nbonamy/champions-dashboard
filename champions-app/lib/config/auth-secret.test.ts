import { afterEach, describe, expect, it } from "vitest";

import { getAuthSecret } from "./auth-secret";

describe("auth secret config", () => {
  const originalAuthSecret = process.env.AUTH_SECRET;

  afterEach(() => {
    process.env.AUTH_SECRET = originalAuthSecret;
  });

  it("throws when AUTH_SECRET is missing", () => {
    delete process.env.AUTH_SECRET;

    expect(() => getAuthSecret()).toThrow(/AUTH_SECRET is not set/);
  });

  it("throws when AUTH_SECRET is blank", () => {
    process.env.AUTH_SECRET = "   ";

    expect(() => getAuthSecret()).toThrow(/AUTH_SECRET is not set/);
  });

  it("returns a trimmed secret", () => {
    process.env.AUTH_SECRET = "  test-secret  ";

    expect(getAuthSecret()).toBe("test-secret");
  });
});
