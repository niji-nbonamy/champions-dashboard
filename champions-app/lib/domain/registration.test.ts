import { describe, expect, it } from "vitest";

import {
  isValidEmail,
  isValidPassword,
  MAX_PASSWORD_BYTES,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  normalizeEmail,
  REGISTRATION_ERROR_MESSAGE,
  validateRegistrationInput,
} from "./registration";

describe("registration domain", () => {
  it("normalizes email to lowercase trimmed", () => {
    expect(normalizeEmail("  Teacher@Example.COM ")).toBe("teacher@example.com");
  });

  it("accepts valid registration input", () => {
    const result = validateRegistrationInput("teacher@example.com", "password12");

    expect(result).toEqual({
      email: "teacher@example.com",
      password: "password12",
    });
  });

  it("rejects invalid email formats", () => {
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("")).toBe(false);
    expect(validateRegistrationInput("bad@", "password12")).toBeNull();
  });

  it("rejects missing fields from the I/O matrix", () => {
    expect(validateRegistrationInput("", "password12")).toBeNull();
    expect(validateRegistrationInput("teacher@example.com", "")).toBeNull();
    expect(validateRegistrationInput("", "")).toBeNull();
  });

  it("rejects passwords shorter than minimum length", () => {
    expect(isValidPassword("short")).toBe(false);
    expect(
      validateRegistrationInput("teacher@example.com", "a".repeat(MIN_PASSWORD_LENGTH - 1))
    ).toBeNull();
  });

  it("rejects passwords longer than the maximum length", () => {
    expect(isValidPassword("a".repeat(MAX_PASSWORD_LENGTH + 1))).toBe(false);
    expect(
      validateRegistrationInput(
        "teacher@example.com",
        "a".repeat(MAX_PASSWORD_LENGTH + 1)
      )
    ).toBeNull();
  });

  it("rejects passwords exceeding bcrypt byte limit", () => {
    const password = "😀".repeat(MAX_PASSWORD_BYTES);

    expect(isValidPassword(password)).toBe(false);
    expect(validateRegistrationInput("teacher@example.com", password)).toBeNull();
  });

  it("uses a single generic registration error message", () => {
    expect(REGISTRATION_ERROR_MESSAGE).toBe(
      "Unable to create account. Please check your details and try again."
    );
    expect(REGISTRATION_ERROR_MESSAGE.toLowerCase()).not.toContain("email");
    expect(REGISTRATION_ERROR_MESSAGE.toLowerCase()).not.toContain("exists");
  });
});
