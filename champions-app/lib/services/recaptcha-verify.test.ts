import { afterEach, describe, expect, it, vi } from "vitest";

import { isRecaptchaRequired, verifyRecaptchaToken } from "./recaptcha-verify";

describe("recaptcha-verify", () => {
  const originalSecret = process.env.RECAPTCHA_SECRET_KEY;
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.RECAPTCHA_SECRET_KEY = originalSecret;
    process.env.NODE_ENV = originalNodeEnv;
    vi.restoreAllMocks();
  });

  it("reports recaptcha as not required when secret is absent", () => {
    delete process.env.RECAPTCHA_SECRET_KEY;
    expect(isRecaptchaRequired()).toBe(false);
  });

  it("reports recaptcha as required when secret is present", () => {
    process.env.RECAPTCHA_SECRET_KEY = "secret";
    expect(isRecaptchaRequired()).toBe(true);
  });

  it("bypasses verification in non-production when secret is absent", async () => {
    delete process.env.RECAPTCHA_SECRET_KEY;
    process.env.NODE_ENV = "test";

    await expect(verifyRecaptchaToken(null)).resolves.toBe(true);
  });

  it("fails verification in production when secret is absent", async () => {
    delete process.env.RECAPTCHA_SECRET_KEY;
    process.env.NODE_ENV = "production";

    await expect(verifyRecaptchaToken("token")).resolves.toBe(false);
  });

  it("verifies token with Google when secret is configured", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "secret-key";
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ success: true }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(verifyRecaptchaToken("token-123")).resolves.toBe(true);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://www.google.com/recaptcha/api/siteverify",
      expect.objectContaining({
        method: "POST",
      })
    );
  });

  it("returns false when Google verification fails", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "secret-key";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ success: false }),
      }))
    );

    await expect(verifyRecaptchaToken("token-123")).resolves.toBe(false);
  });
});
