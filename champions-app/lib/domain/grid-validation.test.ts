import { describe, expect, it } from "vitest";

import { CHAMPIONS_ERROR_CATEGORY_LETTERS } from "@/lib/domain/error-categories";

import {
  formatGridRowValidationMessage,
  sumCategoryErrors,
  validateGridRow,
  type CategoryErrorCounts,
} from "./grid-validation";

function emptyCounts(): CategoryErrorCounts {
  return CHAMPIONS_ERROR_CATEGORY_LETTERS.reduce(
    (counts, letter) => {
      counts[letter] = 0;
      return counts;
    },
    {} as CategoryErrorCounts
  );
}

describe("sumCategoryErrors", () => {
  it("sums all nine category counts", () => {
    const counts = emptyCounts();
    counts.C = 1;
    counts.H = 2;
    counts.S = 3;

    expect(sumCategoryErrors(counts)).toBe(6);
  });
});

describe("validateGridRow", () => {
  it("accepts a row when sum equals the word total", () => {
    const counts = emptyCounts();
    counts.C = 3;
    counts.H = 3;
    counts.A = 4;

    expect(validateGridRow(counts, 10)).toEqual({
      valid: true,
      sumErrors: 10,
      wordTotal: 10,
    });
  });

  it("accepts an all-zero row", () => {
    expect(validateGridRow(emptyCounts(), 10)).toEqual({
      valid: true,
      sumErrors: 0,
      wordTotal: 10,
    });
  });

  it("rejects when sum exceeds the word total", () => {
    const counts = emptyCounts();
    counts.C = 4;
    counts.H = 4;
    counts.A = 4;

    expect(validateGridRow(counts, 10)).toEqual({
      valid: false,
      sumErrors: 12,
      wordTotal: 10,
    });
  });

  it("rejects when a single category exceeds the word total", () => {
    const counts = emptyCounts();
    counts.C = 6;

    expect(validateGridRow(counts, 5)).toEqual({
      valid: false,
      sumErrors: 6,
      wordTotal: 5,
    });
  });

  it("rejects non-finite word totals", () => {
    expect(validateGridRow(emptyCounts(), Number.NaN)).toEqual({
      valid: false,
      sumErrors: 0,
      wordTotal: Number.NaN,
    });
  });

  it("treats missing category keys as zero", () => {
    const partial = { C: 2 } as CategoryErrorCounts;

    expect(validateGridRow(partial, 5)).toEqual({
      valid: true,
      sumErrors: 2,
      wordTotal: 5,
    });
  });
});

describe("formatGridRowValidationMessage", () => {
  it("formats the French inline validation message", () => {
    expect(formatGridRowValidationMessage("Marie", 12, 10)).toBe(
      "Σ erreurs (12) > total mots (10) pour Marie"
    );
  });
});
