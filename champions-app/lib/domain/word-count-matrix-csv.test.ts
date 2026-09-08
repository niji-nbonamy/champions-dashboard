import { describe, expect, it } from "vitest";

import {
  formatWordCountMatrixCsvOverwriteMessage,
  parseWordCountMatrixCsv,
  serializeWordCountMatrixCsv,
  WORD_COUNT_MATRIX_CSV_EMPTY_ERROR,
  WORD_COUNT_MATRIX_CSV_ENCODING_ERROR,
  WORD_COUNT_MATRIX_CSV_FORMAT_ERROR,
} from "./word-count-matrix-csv";

function toBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

describe("word-count-matrix-csv", () => {
  it("serializes rows without headers using semicolon separators", () => {
    const csv = serializeWordCountMatrixCsv([
      {
        label: "1 - ponctuation",
        wordsYellow: "12",
        wordsGreen: "15",
        wordsViolet: "18",
        wordsGold: "20",
      },
      {
        label: "1 bis - complément",
        wordsYellow: "10",
        wordsGreen: "12",
        wordsViolet: "14",
        wordsGold: "16",
      },
    ]);

    expect(csv).toBe(
      "1 - ponctuation;12;15;18;20\n1 bis - complément;10;12;14;16\n"
    );
  });

  it("escapes labels containing semicolons", () => {
    const csv = serializeWordCountMatrixCsv([
      {
        label: "2 - test; extra",
        wordsYellow: "8",
        wordsGreen: "9",
        wordsViolet: "10",
        wordsGold: "11",
      },
    ]);

    expect(csv).toBe('"2 - test; extra";8;9;10;11\n');
  });

  it("parses valid semicolon CSV without headers", () => {
    const result = parseWordCountMatrixCsv(
      toBytes("1 - ponctuation;12;15;18;20\n1 bis - complément;10;12;14;16\n")
    );

    expect(result).toEqual({
      ok: true,
      rows: [
        {
          label: "1 - ponctuation",
          wordsYellow: "12",
          wordsGreen: "15",
          wordsViolet: "18",
          wordsGold: "20",
        },
        {
          label: "1 bis - complément",
          wordsYellow: "10",
          wordsGreen: "12",
          wordsViolet: "14",
          wordsGold: "16",
        },
      ],
    });
  });

  it("accepts UTF-8 files with a byte-order mark", () => {
    const result = parseWordCountMatrixCsv(
      toBytes("\uFEFF1 - ponctuation;12;15;18;20\n")
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows).toHaveLength(1);
    }
  });

  it("rejects invalid UTF-8 byte sequences", () => {
    const result = parseWordCountMatrixCsv(new Uint8Array([0xff, 0xfe, 0x61]));

    expect(result).toEqual({
      ok: false,
      error: WORD_COUNT_MATRIX_CSV_ENCODING_ERROR,
    });
  });

  it("rejects rows with the wrong column count", () => {
    const result = parseWordCountMatrixCsv(toBytes("1 - ponctuation;12;15;18\n"));

    expect(result).toEqual({
      ok: false,
      error: WORD_COUNT_MATRIX_CSV_FORMAT_ERROR,
    });
  });

  it("rejects empty files", () => {
    const result = parseWordCountMatrixCsv(toBytes("\n\n"));

    expect(result).toEqual({
      ok: false,
      error: WORD_COUNT_MATRIX_CSV_EMPTY_ERROR,
    });
  });

  it("returns domain validation errors for invalid counts", () => {
    const result = parseWordCountMatrixCsv(
      toBytes("1 - ponctuation;12;0;18;20\n")
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Chaque cellule doit être un entier supérieur à 0.");
    }
  });

  it("formats overwrite modal copy for singular and plural rows", () => {
    expect(formatWordCountMatrixCsvOverwriteMessage(1)).toContain("1 ligne");
    expect(formatWordCountMatrixCsvOverwriteMessage(3)).toContain("3 lignes");
  });
});
