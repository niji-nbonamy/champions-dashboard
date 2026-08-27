import { describe, expect, it } from "vitest";

import {
  DICTATION_DATE_INVALID_ERROR,
  DICTATION_MATRIX_ROW_MISSING_ERROR,
  findMatchingMatrixRow,
  formatDictationDateForDisplay,
  getClassLocalDateString,
  isValidUuidV4,
  parseDictationDate,
  validateDictationLabel,
} from "./dictation";
import {
  DICTATION_LABEL_REQUIRED_ERROR,
  DICTATION_LABEL_TOO_LONG_ERROR,
} from "./word-count-matrix";

describe("validateDictationLabel", () => {
  it("accepts a trimmed label and normalizes the key", () => {
    const result = validateDictationLabel("  Dictée 1  ");

    expect(result).toEqual({
      ok: true,
      value: {
        label: "Dictée 1",
        dictationLabelKey: "dictée 1",
      },
    });
  });

  it("rejects an empty label", () => {
    expect(validateDictationLabel("   ")).toEqual({
      ok: false,
      error: DICTATION_LABEL_REQUIRED_ERROR,
    });
  });

  it("rejects labels longer than 80 characters", () => {
    expect(validateDictationLabel("a".repeat(81))).toEqual({
      ok: false,
      error: DICTATION_LABEL_TOO_LONG_ERROR,
    });
  });
});

describe("parseDictationDate", () => {
  const referenceDate = new Date("2026-08-27T15:30:00.000Z");

  it("defaults to today's class-local date when omitted", () => {
    expect(parseDictationDate(undefined, referenceDate)).toEqual({
      ok: true,
      date: "2026-08-27",
    });
    expect(parseDictationDate("   ", referenceDate)).toEqual({
      ok: true,
      date: "2026-08-27",
    });
  });

  it("accepts a valid YYYY-MM-DD date", () => {
    expect(parseDictationDate("2026-01-15", referenceDate)).toEqual({
      ok: true,
      date: "2026-01-15",
    });
  });

  it("rejects unparseable date strings", () => {
    expect(parseDictationDate("not-a-date", referenceDate)).toEqual({
      ok: false,
      error: DICTATION_DATE_INVALID_ERROR,
    });
    expect(parseDictationDate("2026-13-01", referenceDate)).toEqual({
      ok: false,
      error: DICTATION_DATE_INVALID_ERROR,
    });
    expect(parseDictationDate("2026-02-30", referenceDate)).toEqual({
      ok: false,
      error: DICTATION_DATE_INVALID_ERROR,
    });
  });
});

describe("findMatchingMatrixRow", () => {
  const matrixRows = [
    { dictationLabelKey: "Dictée 1" },
    { dictationLabelKey: "Dictée 2" },
  ];

  it("matches matrix rows case-insensitively after trimming", () => {
    expect(findMatchingMatrixRow(matrixRows, "  dictée 1 ")).toEqual({
      dictationLabelKey: "Dictée 1",
    });
  });

  it("returns null when no matrix row matches", () => {
    expect(findMatchingMatrixRow(matrixRows, "Dictée 9")).toBeNull();
  });
});

describe("formatDictationDateForDisplay", () => {
  it("formats a date-only value using fr-FR locale", () => {
    expect(formatDictationDateForDisplay("2026-01-15")).toBe("15 janvier 2026");
  });
});

describe("getClassLocalDateString", () => {
  it("returns the Europe/Paris calendar day", () => {
    expect(getClassLocalDateString(new Date("2026-08-27T23:30:00.000Z"))).toBe(
      "2026-08-28"
    );
    expect(getClassLocalDateString(new Date("2026-08-27T10:00:00.000Z"))).toBe(
      "2026-08-27"
    );
  });
});

describe("isValidUuidV4", () => {
  it("accepts valid UUID v4 values", () => {
    expect(isValidUuidV4("880e8400-e29b-41d4-a716-446655440003")).toBe(true);
  });

  it("rejects malformed ids", () => {
    expect(isValidUuidV4("not-a-uuid")).toBe(false);
  });
});

describe("dictation error constants", () => {
  it("exposes the matrix requirement message", () => {
    expect(DICTATION_MATRIX_ROW_MISSING_ERROR).toContain("matrice");
  });
});
