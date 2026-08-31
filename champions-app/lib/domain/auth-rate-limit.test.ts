import { describe, expect, it } from "vitest";

import { consumeRateLimit } from "./auth-rate-limit";

describe("consumeRateLimit", () => {
  it("allows requests under the limit", () => {
    const store = new Map();

    expect(consumeRateLimit(store, "login:1.2.3.4", 3, 60_000, 0)).toBe(true);
    expect(consumeRateLimit(store, "login:1.2.3.4", 3, 60_000, 1_000)).toBe(
      true
    );
    expect(consumeRateLimit(store, "login:1.2.3.4", 3, 60_000, 2_000)).toBe(
      true
    );
    expect(consumeRateLimit(store, "login:1.2.3.4", 3, 60_000, 3_000)).toBe(
      false
    );
  });

  it("resets the bucket after the window expires", () => {
    const store = new Map();

    expect(consumeRateLimit(store, "register:ip", 1, 60_000, 0)).toBe(true);
    expect(consumeRateLimit(store, "register:ip", 1, 60_000, 1_000)).toBe(
      false
    );
    expect(consumeRateLimit(store, "register:ip", 1, 60_000, 60_001)).toBe(
      true
    );
  });
});
