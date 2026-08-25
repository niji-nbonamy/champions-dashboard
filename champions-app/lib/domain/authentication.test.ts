import { describe, expect, it } from "vitest";

import {
  LOGIN_ERROR_MESSAGE,
  validateLoginInput,
} from "./authentication";

describe("authentication domain", () => {
  it("accepts valid login input", () => {
    const result = validateLoginInput("teacher@example.com", "password12");

    expect(result).toEqual({
      email: "teacher@example.com",
      password: "password12",
    });
  });

  it("normalizes email before validation", () => {
    const result = validateLoginInput("  Teacher@Example.com  ", "password12");

    expect(result).toEqual({
      email: "teacher@example.com",
      password: "password12",
    });
  });

  it("rejects invalid email formats", () => {
    expect(validateLoginInput("not-an-email", "password12")).toBeNull();
    expect(validateLoginInput("", "password12")).toBeNull();
  });

  it("rejects empty or invalid passwords", () => {
    expect(validateLoginInput("teacher@example.com", "")).toBeNull();
    expect(validateLoginInput("teacher@example.com", "short")).toBeNull();
  });

  it("uses a single generic login error message", () => {
    expect(LOGIN_ERROR_MESSAGE).toBe(
      "Unable to sign in. Please check your credentials and try again."
    );
    expect(LOGIN_ERROR_MESSAGE.toLowerCase()).not.toContain("password");
    expect(LOGIN_ERROR_MESSAGE.toLowerCase()).not.toContain("email");
  });
});
