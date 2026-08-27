import { describe, expect, it } from "vitest";

import {
  getPasswordRequirementStatus,
  isValidEmail,
  isValidPassword,
  isValidRegistrationPassword,
  MAX_PASSWORD_BYTES,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  normalizeEmail,
  passwordsMatch,
  REGISTRATION_ERROR_MESSAGE,
  validateRegistrationInput,
} from "./registration";

const VALID_REGISTRATION_PASSWORD = "Password1!";

describe("registration domain", () => {
  it("normalizes email to lowercase trimmed", () => {
    expect(normalizeEmail("  Teacher@Example.COM ")).toBe("teacher@example.com");
  });

  it("accepts valid registration input with complexity rules", () => {
    const result = validateRegistrationInput(
      "teacher@example.com",
      VALID_REGISTRATION_PASSWORD
    );

    expect(result).toEqual({
      email: "teacher@example.com",
      password: VALID_REGISTRATION_PASSWORD,
    });
  });

  it("rejects invalid email formats", () => {
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("")).toBe(false);
    expect(validateRegistrationInput("bad@", VALID_REGISTRATION_PASSWORD)).toBeNull();
  });

  it("rejects missing fields from the I/O matrix", () => {
    expect(validateRegistrationInput("", VALID_REGISTRATION_PASSWORD)).toBeNull();
    expect(validateRegistrationInput("teacher@example.com", "")).toBeNull();
    expect(validateRegistrationInput("", "")).toBeNull();
  });

  it("rejects passwords shorter than minimum length", () => {
    expect(isValidRegistrationPassword("short")).toBe(false);
    expect(
      validateRegistrationInput(
        "teacher@example.com",
        "a".repeat(MIN_PASSWORD_LENGTH - 1)
      )
    ).toBeNull();
  });

  it("rejects passwords missing complexity requirements", () => {
    expect(isValidRegistrationPassword("password12")).toBe(false);
    expect(validateRegistrationInput("teacher@example.com", "password12")).toBeNull();
    expect(isValidRegistrationPassword("Password12")).toBe(false);
    expect(isValidRegistrationPassword("Password!!")).toBe(false);
  });

  it("tracks password requirement status including confirmation match", () => {
    expect(
      getPasswordRequirementStatus(VALID_REGISTRATION_PASSWORD, VALID_REGISTRATION_PASSWORD)
    ).toEqual({
      length: true,
      digit: true,
      lowercase: true,
      uppercase: true,
      special: true,
      match: true,
    });

    expect(
      getPasswordRequirementStatus(VALID_REGISTRATION_PASSWORD, "Password1?").match
    ).toBe(false);
  });

  it("validates password confirmation match helper", () => {
    expect(passwordsMatch("Password1!", "Password1!")).toBe(true);
    expect(passwordsMatch("Password1!", "Password1?")).toBe(false);
  });

  it("rejects passwords longer than the maximum length", () => {
    expect(isValidRegistrationPassword("a".repeat(MAX_PASSWORD_LENGTH + 1))).toBe(false);
    expect(
      validateRegistrationInput(
        "teacher@example.com",
        `A1!${"a".repeat(MAX_PASSWORD_LENGTH)}`
      )
    ).toBeNull();
  });

  it("rejects passwords exceeding bcrypt byte limit", () => {
    const password = "😀".repeat(MAX_PASSWORD_BYTES);

    expect(isValidRegistrationPassword(password)).toBe(false);
    expect(validateRegistrationInput("teacher@example.com", password)).toBeNull();
  });

  it("keeps login password validation length-only", () => {
    expect(isValidPassword("password12")).toBe(true);
    expect(isValidRegistrationPassword("password12")).toBe(false);
  });

  it("uses a single generic registration error message in French", () => {
    expect(REGISTRATION_ERROR_MESSAGE).toBe(
      "Impossible de créer le compte. Vérifiez vos informations et réessayez."
    );
    expect(REGISTRATION_ERROR_MESSAGE.toLowerCase()).not.toContain("email");
    expect(REGISTRATION_ERROR_MESSAGE.toLowerCase()).not.toContain("existe");
  });
});
