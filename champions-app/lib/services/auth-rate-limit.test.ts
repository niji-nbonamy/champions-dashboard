import { afterEach, describe, expect, it, vi } from "vitest";

const { mockHeaders } = vi.hoisted(() => ({
  mockHeaders: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: mockHeaders,
}));

describe("isAuthRateLimitAllowed", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("scopes limits per client IP and auth kind", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({ "x-forwarded-for": "203.0.113.10, 70.41.3.18" })
    );

    const { isAuthRateLimitAllowed } = await import("./auth-rate-limit");
    const store = new Map();

    expect(await isAuthRateLimitAllowed("login", store)).toBe(true);
    expect(await isAuthRateLimitAllowed("register", store)).toBe(true);
    expect(await isAuthRateLimitAllowed("password-reset", store)).toBe(true);
    expect(store.size).toBe(3);
    expect(store.has("login:203.0.113.10")).toBe(true);
    expect(store.has("register:203.0.113.10")).toBe(true);
    expect(store.has("password-reset:203.0.113.10")).toBe(true);
  });

  it("enforces the password-reset rate limit default of 3 requests", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({ "x-forwarded-for": "203.0.113.99" })
    );

    const { isAuthRateLimitAllowed } = await import("./auth-rate-limit");
    const store = new Map();

    expect(await isAuthRateLimitAllowed("password-reset", store)).toBe(true);
    expect(await isAuthRateLimitAllowed("password-reset", store)).toBe(true);
    expect(await isAuthRateLimitAllowed("password-reset", store)).toBe(true);
    expect(await isAuthRateLimitAllowed("password-reset", store)).toBe(false);
  });
});
