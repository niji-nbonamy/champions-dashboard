import { describe, expect, it } from "vitest";

import { runAuthMiddleware } from "./middleware-handler";

describe("runAuthMiddleware", () => {
  const baseUrl = new URL("http://localhost:3000");

  it("redirects unauthenticated dashboard access to login", () => {
    const response = runAuthMiddleware("/dictations", false, baseUrl);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login");
  });

  it("redirects authenticated users away from login and register", () => {
    const loginResponse = runAuthMiddleware("/login", true, baseUrl);
    const registerResponse = runAuthMiddleware("/register", true, baseUrl);

    expect(loginResponse.status).toBe(307);
    expect(loginResponse.headers.get("location")).toBe(
      "http://localhost:3000/dictations"
    );
    expect(registerResponse.status).toBe(307);
    expect(registerResponse.headers.get("location")).toBe(
      "http://localhost:3000/dictations"
    );
  });

  it("allows auth API routes without redirect", () => {
    const response = runAuthMiddleware("/api/auth/session", false, baseUrl);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("allows public routes without redirect", () => {
    const response = runAuthMiddleware("/register", false, baseUrl);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
});
