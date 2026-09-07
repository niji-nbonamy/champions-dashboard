import { afterEach, describe, expect, it } from "vitest";

import {
  isEmailAllowed,
  isEmailAllowlistEnforced,
} from "./email-allowlist";

describe("email allowlist", () => {
  const originalAllowedEmails = process.env.ALLOWED_EMAILS;
  const originalCi = process.env.CI;
  const originalBypass = process.env.E2E_BYPASS_ALLOWLIST;

  afterEach(() => {
    if (originalAllowedEmails === undefined) {
      delete process.env.ALLOWED_EMAILS;
    } else {
      process.env.ALLOWED_EMAILS = originalAllowedEmails;
    }

    if (originalCi === undefined) {
      delete process.env.CI;
    } else {
      process.env.CI = originalCi;
    }

    if (originalBypass === undefined) {
      delete process.env.E2E_BYPASS_ALLOWLIST;
    } else {
      process.env.E2E_BYPASS_ALLOWLIST = originalBypass;
    }
  });

  it("is disabled when ALLOWED_EMAILS is unset", () => {
    delete process.env.ALLOWED_EMAILS;

    expect(isEmailAllowlistEnforced()).toBe(false);
    expect(isEmailAllowed("anyone@example.com")).toBe(true);
  });

  it("enforces comma-separated emails with normalization", () => {
    delete process.env.CI;
    delete process.env.E2E_BYPASS_ALLOWLIST;
    process.env.ALLOWED_EMAILS = " Teacher@Example.com , beta@test.fr ";

    expect(isEmailAllowlistEnforced()).toBe(true);
    expect(isEmailAllowed("teacher@example.com")).toBe(true);
    expect(isEmailAllowed("beta@test.fr")).toBe(true);
    expect(isEmailAllowed("other@example.com")).toBe(false);
  });

  it("is bypassed in CI", () => {
    process.env.ALLOWED_EMAILS = "teacher@example.com";
    process.env.CI = "true";

    expect(isEmailAllowlistEnforced()).toBe(false);
    expect(isEmailAllowed("e2e-123@example.com")).toBe(true);
  });

  it("is bypassed when E2E_BYPASS_ALLOWLIST is true", () => {
    process.env.ALLOWED_EMAILS = "teacher@example.com";
    process.env.E2E_BYPASS_ALLOWLIST = "true";

    expect(isEmailAllowlistEnforced()).toBe(false);
    expect(isEmailAllowed("e2e-123@example.com")).toBe(true);
  });
});
