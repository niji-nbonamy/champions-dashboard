import { describe, expect, it } from "vitest";

import {
  buildLoginRedirectPath,
  DEFAULT_POST_AUTH_REDIRECT,
  sanitizeCallbackUrl,
} from "./auth-redirect";

describe("sanitizeCallbackUrl", () => {
  it("returns the default redirect when callback is missing", () => {
    expect(sanitizeCallbackUrl(null)).toBe(DEFAULT_POST_AUTH_REDIRECT);
    expect(sanitizeCallbackUrl("")).toBe(DEFAULT_POST_AUTH_REDIRECT);
  });

  it("accepts safe relative paths", () => {
    expect(sanitizeCallbackUrl("/students/abc")).toBe("/students/abc");
    expect(sanitizeCallbackUrl("/dictations/123?tab=grid")).toBe(
      "/dictations/123?tab=grid"
    );
  });

  it("rejects open redirects", () => {
    expect(sanitizeCallbackUrl("//evil.example")).toBe(DEFAULT_POST_AUTH_REDIRECT);
    expect(sanitizeCallbackUrl("https://evil.example")).toBe(
      DEFAULT_POST_AUTH_REDIRECT
    );
    expect(sanitizeCallbackUrl("/\\evil")).toBe(DEFAULT_POST_AUTH_REDIRECT);
  });
});

describe("buildLoginRedirectPath", () => {
  it("encodes callbackUrl for login redirect", () => {
    expect(buildLoginRedirectPath("/students/abc")).toBe(
      "/login?callbackUrl=%2Fstudents%2Fabc"
    );
  });
});
