import { describe, expect, it } from "vitest";

import {
  DASHBOARD_ROUTE_PREFIXES,
  getAuthMiddlewareMatcher,
  getAuthRedirectPath,
  isDashboardRoute,
  isOnboardingRoute,
} from "./middleware-policy";

describe("middleware policy", () => {
  it("identifies dashboard routes and nested paths", () => {
    expect(isDashboardRoute("/dictations")).toBe(true);
    expect(isDashboardRoute("/dictations/123")).toBe(true);
    expect(isDashboardRoute("/students/abc")).toBe(true);
    expect(isDashboardRoute("/login")).toBe(false);
    expect(isDashboardRoute("/")).toBe(false);
  });

  it("redirects unauthenticated dashboard access to login with callbackUrl", () => {
    expect(getAuthRedirectPath("/dictations", false)).toBe(
      "/login?callbackUrl=%2Fdictations"
    );
    expect(getAuthRedirectPath("/config/settings", false)).toBe(
      "/login?callbackUrl=%2Fconfig%2Fsettings"
    );
  });

  it("redirects unauthenticated onboarding access to login with callbackUrl", () => {
    expect(isOnboardingRoute("/onboarding/class")).toBe(true);
    expect(getAuthRedirectPath("/onboarding/class", false)).toBe(
      "/login?callbackUrl=%2Fonboarding%2Fclass"
    );
  });

  it("redirects authenticated users away from login, register, and home", () => {
    expect(getAuthRedirectPath("/login", true)).toBe("/dictations");
    expect(getAuthRedirectPath("/register", true)).toBe("/dictations");
    expect(getAuthRedirectPath("/", true)).toBe("/dictations");
  });

  it("honors callbackUrl when authenticated users visit login", () => {
    expect(
      getAuthRedirectPath(
        "/login",
        true,
        "?callbackUrl=%2Fstudents%2Fabc"
      )
    ).toBe("/students/abc");
    expect(
      getAuthRedirectPath("/login", true, "?callbackUrl=https://evil.example")
    ).toBe("/dictations");
  });

  it("allows public routes without redirect", () => {
    expect(getAuthRedirectPath("/", false)).toBeNull();
    expect(getAuthRedirectPath("/register", false)).toBeNull();
    expect(getAuthRedirectPath("/dictations", true)).toBeNull();
  });

  it("builds middleware matcher paths from dashboard prefixes", () => {
    const matcher = getAuthMiddlewareMatcher();

    expect(matcher).toContain("/");
    expect(matcher).toContain("/login");
    expect(matcher).toContain("/register");
    expect(matcher).toContain("/onboarding/:path*");
    for (const prefix of DASHBOARD_ROUTE_PREFIXES) {
      expect(matcher).toContain(`${prefix}/:path*`);
    }
  });
});
