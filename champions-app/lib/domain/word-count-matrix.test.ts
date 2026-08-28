import { describe, expect, it } from "vitest";

import {
  DICTATION_LABEL_REQUIRED_ERROR,
  DICTATION_LABEL_TOO_LONG_ERROR,
  formatDuplicateDictationLabelsError,
  formatWordCountMatrixRowError,
  parseWordCountCell,
  parseWordCountMatrixRowsFromFormData,
  validateWordCountMatrix,
  validateWordCountMatrixRow,
  getWordCountForLevel,
  buildWordTotalsByStudentId,
  WORD_COUNT_CELL_INVALID_ERROR,
  WORD_COUNT_MATRIX_MAX_ROWS,
  WORD_COUNT_MATRIX_MAX_WORD_COUNT,
  WORD_COUNT_MATRIX_TOO_MANY_ROWS_ERROR,
} from "./word-count-matrix";

function makeRow(
  overrides: Partial<{
    label: string;
    wordsYellow: string;
    wordsGreen: string;
    wordsViolet: string;
    wordsGold: string;
  }> = {}
) {
  return {
    label: "Dictée 1",
    wordsYellow: "10",
    wordsGreen: "12",
    wordsViolet: "14",
    wordsGold: "16",
    ...overrides,
  };
}

describe("parseWordCountCell", () => {
  it("accepts positive integers", () => {
    expect(parseWordCountCell("12")).toBe(12);
    expect(parseWordCountCell("007")).toBe(7);
  });

  it("rejects zero, negative, non-integer, and empty values", () => {
    expect(parseWordCountCell("0")).toBeNull();
    expect(parseWordCountCell("-1")).toBeNull();
    expect(parseWordCountCell("12.5")).toBeNull();
    expect(parseWordCountCell("abc")).toBeNull();
    expect(parseWordCountCell("")).toBeNull();
  });

  it("rejects values above the PostgreSQL integer maximum", () => {
    expect(parseWordCountCell(String(WORD_COUNT_MATRIX_MAX_WORD_COUNT + 1))).toBeNull();
    expect(parseWordCountCell(String(WORD_COUNT_MATRIX_MAX_WORD_COUNT))).toBe(
      WORD_COUNT_MATRIX_MAX_WORD_COUNT
    );
  });
});

describe("validateWordCountMatrixRow", () => {
  it("accepts a complete row", () => {
    const result = validateWordCountMatrixRow(makeRow({ label: "  Dictée A  " }));

    expect(result).toEqual({
      ok: true,
      rows: [
        {
          dictationLabelKey: "Dictée A",
          wordsYellow: 10,
          wordsGreen: 12,
          wordsViolet: 14,
          wordsGold: 16,
        },
      ],
    });
  });

  it("rejects whitespace-only labels with a row-level error", () => {
    const result = validateWordCountMatrixRow(makeRow({ label: "   " }));

    expect(result).toEqual({
      ok: false,
      error: formatWordCountMatrixRowError(1, "   ", DICTATION_LABEL_REQUIRED_ERROR),
      rowIndex: 0,
      field: "label",
    });
  });

  it("rejects labels longer than 80 characters with a row-level error", () => {
    const label = "a".repeat(81);
    const result = validateWordCountMatrixRow(makeRow({ label }));

    expect(result).toEqual({
      ok: false,
      error: formatWordCountMatrixRowError(1, label, DICTATION_LABEL_TOO_LONG_ERROR),
      rowIndex: 0,
      field: "label",
    });
  });

  it("rejects invalid word-count cells with a row-level error", () => {
    const result = validateWordCountMatrixRow(makeRow({ wordsYellow: "0" }));

    expect(result).toEqual({
      ok: false,
      error: formatWordCountMatrixRowError(
        1,
        "Dictée 1",
        WORD_COUNT_CELL_INVALID_ERROR
      ),
      rowIndex: 0,
      field: "wordsYellow",
    });
  });
});

describe("validateWordCountMatrix", () => {
  it("accepts multiple valid rows", () => {
    const result = validateWordCountMatrix([
      makeRow({ label: "Dictée 1" }),
      makeRow({ label: "Dictée 2", wordsYellow: "8" }),
    ]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows).toHaveLength(2);
    }
  });

  it("rejects duplicate labels case-insensitively", () => {
    const result = validateWordCountMatrix([
      makeRow({ label: "Dictée 1" }),
      makeRow({ label: "dictée 1" }),
    ]);

    expect(result).toEqual({
      ok: false,
      error: formatDuplicateDictationLabelsError(["Dictée 1", "dictée 1"]),
      field: "duplicate",
    });
  });

  it("allows an empty matrix", () => {
    const result = validateWordCountMatrix([]);

    expect(result).toEqual({ ok: true, rows: [] });
  });

  it("rejects more than the maximum number of rows", () => {
    const rows = Array.from({ length: WORD_COUNT_MATRIX_MAX_ROWS + 1 }, (_, i) =>
      makeRow({ label: `Dictée ${i + 1}` })
    );
    const result = validateWordCountMatrix(rows);

    expect(result).toEqual({
      ok: false,
      error: WORD_COUNT_MATRIX_TOO_MANY_ROWS_ERROR,
    });
  });
});

describe("parseWordCountMatrixRowsFromFormData", () => {
  it("parses indexed row fields from FormData", () => {
    const formData = new FormData();
    formData.set("rows[0].label", "Dictée 1");
    formData.set("rows[0].words_yellow", "10");
    formData.set("rows[0].words_green", "11");
    formData.set("rows[0].words_violet", "12");
    formData.set("rows[0].words_gold", "13");
    formData.set("rows[1].label", "Dictée 2");
    formData.set("rows[1].words_yellow", "8");
    formData.set("rows[1].words_green", "9");
    formData.set("rows[1].words_violet", "10");
    formData.set("rows[1].words_gold", "11");

    expect(parseWordCountMatrixRowsFromFormData(formData)).toEqual([
      {
        label: "Dictée 1",
        wordsYellow: "10",
        wordsGreen: "11",
        wordsViolet: "12",
        wordsGold: "13",
      },
      {
        label: "Dictée 2",
        wordsYellow: "8",
        wordsGreen: "9",
        wordsViolet: "10",
        wordsGold: "11",
      },
    ]);
  });

  it("parses non-contiguous row indices without truncating later rows", () => {
    const formData = new FormData();
    formData.set("rows[0].label", "Dictée 1");
    formData.set("rows[0].words_yellow", "10");
    formData.set("rows[0].words_green", "11");
    formData.set("rows[0].words_violet", "12");
    formData.set("rows[0].words_gold", "13");
    formData.set("rows[2].label", "Dictée 3");
    formData.set("rows[2].words_yellow", "8");
    formData.set("rows[2].words_green", "9");
    formData.set("rows[2].words_violet", "10");
    formData.set("rows[2].words_gold", "11");

    expect(parseWordCountMatrixRowsFromFormData(formData)).toEqual([
      {
        label: "Dictée 1",
        wordsYellow: "10",
        wordsGreen: "11",
        wordsViolet: "12",
        wordsGold: "13",
      },
      {
        label: "Dictée 3",
        wordsYellow: "8",
        wordsGreen: "9",
        wordsViolet: "10",
        wordsGold: "11",
      },
    ]);
  });
});

describe("getWordCountForLevel", () => {
  const row = {
    wordsYellow: 10,
    wordsGreen: 12,
    wordsViolet: 14,
    wordsGold: 16,
  };

  it("maps each CHAMPIONS level to the matrix column", () => {
    expect(getWordCountForLevel(row, "yellow")).toBe(10);
    expect(getWordCountForLevel(row, "green")).toBe(12);
    expect(getWordCountForLevel(row, "violet")).toBe(14);
    expect(getWordCountForLevel(row, "gold")).toBe(16);
  });
});

describe("buildWordTotalsByStudentId", () => {
  const matrixRow = {
    wordsYellow: 10,
    wordsGreen: 12,
    wordsViolet: 14,
    wordsGold: 16,
  };

  it("maps each student id to the word count for their level", () => {
    expect(
      buildWordTotalsByStudentId(
        [
          { id: "student-yellow", level: "yellow" },
          { id: "student-green", level: "green" },
        ],
        matrixRow
      )
    ).toEqual({
      "student-yellow": 10,
      "student-green": 12,
    });
  });
});
