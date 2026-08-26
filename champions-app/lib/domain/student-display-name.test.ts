import { describe, expect, it } from "vitest";

import {
  formatStudentDuplicateError,
  normalizeDisplayName,
  normalizeDuplicateKey,
  STUDENT_DISPLAY_NAME_EMPTY_ERROR,
  STUDENT_DISPLAY_NAME_MAX_LENGTH,
  STUDENT_DISPLAY_NAME_TOO_LONG_ERROR,
  validateDisplayName,
} from "./student-display-name";

describe("normalizeDisplayName", () => {
  it("trims surrounding whitespace", () => {
    expect(normalizeDisplayName("  DUPONT Marie  ")).toBe("DUPONT Marie");
  });
});

describe("normalizeDuplicateKey", () => {
  it("normalizes case and trim for duplicate detection", () => {
    expect(normalizeDuplicateKey("  DUPONT Marie  ")).toBe("dupont marie");
    expect(normalizeDuplicateKey("dupont marie")).toBe("dupont marie");
  });
});

describe("validateDisplayName", () => {
  it("accepts a valid trimmed name", () => {
    expect(validateDisplayName("  DUPONT Marie  ")).toEqual({
      ok: true,
      displayName: "DUPONT Marie",
    });
  });

  it("rejects empty names after trim", () => {
    expect(validateDisplayName("   ")).toEqual({
      ok: false,
      error: STUDENT_DISPLAY_NAME_EMPTY_ERROR,
    });
  });

  it("rejects names longer than the max length", () => {
    const longName = "A".repeat(STUDENT_DISPLAY_NAME_MAX_LENGTH + 1);

    expect(validateDisplayName(longName)).toEqual({
      ok: false,
      error: STUDENT_DISPLAY_NAME_TOO_LONG_ERROR,
    });
  });
});

describe("formatStudentDuplicateError", () => {
  it("includes the existing student name", () => {
    expect(formatStudentDuplicateError("DUPONT Marie")).toBe(
      "Un élève avec ce nom existe déjà : DUPONT Marie."
    );
  });
});
