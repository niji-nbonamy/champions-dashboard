import { describe, expect, it } from "vitest";

import { getAuthRedirectPath, isDashboardRoute } from "./middleware-policy";

describe("middleware policy", () => {
  it("identifies dashboard routes and nested paths", () => {
    expect(isDashboardRoute("/dictations")).toBe(true);
    expect(isDashboardRoute("/dictations/123")).toBe(true);
    expect(isDashboardRoute("/students/abc")).toBe(true);
    expect(isDashboardRoute("/login")).toBe(false);
    expect(isDashboardRoute("/")).toBe(false);
  });

  it("redirects unauthenticated dashboard access to login", () => {
    expect(getAuthRedirectPath("/dictations", false)).toBe("/login");
    expect(getAuthRedirectPath("/config/settings", false)).toBe("/login");
  });

  it("redirects authenticated users away from login", () => {
    expect(getAuthRedirectPath("/login", true)).toBe("/dictations");
  });

  it("allows public routes without redirect", () => {
    expect(getAuthRedirectPath("/", false)).toBeNull();
    expect(getAuthRedirectPath("/register", false)).toBeNull();
    expect(getAuthRedirectPath("/dictations", true)).toBeNull();
  });
});
