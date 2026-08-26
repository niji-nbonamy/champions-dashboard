import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DICTATION_LABEL_REQUIRED_ERROR,
  WORD_COUNT_CELL_INVALID_ERROR,
} from "@/lib/domain/word-count-matrix";
import { wordCountMatrixRows } from "@/lib/db/schema";

const mockDeleteWhere = vi.fn();
const mockDelete = vi.fn(() => ({ where: mockDeleteWhere }));

const mockValues = vi.fn();
const mockInsert = vi.fn(() => ({ values: mockValues }));

const mockTransaction = vi.fn(
  async (callback: (tx: {
    delete: typeof mockDelete;
    insert: typeof mockInsert;
  }) => Promise<unknown>) =>
    callback({
      delete: mockDelete,
      insert: mockInsert,
    })
);

const getDb = vi.fn(() => ({
  transaction: mockTransaction,
}));

vi.mock("@/lib/db/index", () => ({
  getDb,
}));

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

describe("replaceWordCountMatrix", () => {
  const classId = "660e8400-e29b-41d4-a716-446655440001";

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("replaces rows atomically for a valid matrix", async () => {
    mockDeleteWhere.mockResolvedValueOnce(undefined);
    mockValues.mockResolvedValueOnce(undefined);

    const { replaceWordCountMatrix } = await import("./replace-word-count-matrix");
    await replaceWordCountMatrix(classId, [makeRow()]);

    expect(mockTransaction).toHaveBeenCalled();
    expect(mockDelete).toHaveBeenCalledWith(wordCountMatrixRows);
    expect(mockDeleteWhere).toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalledWith(wordCountMatrixRows);
    expect(mockValues).toHaveBeenCalledWith([
      {
        classId,
        dictationLabelKey: "Dictée 1",
        wordsYellow: 10,
        wordsGreen: 12,
        wordsViolet: 14,
        wordsGold: 16,
      },
    ]);
  });

  it("inserts multiple rows in one transaction", async () => {
    mockDeleteWhere.mockResolvedValueOnce(undefined);
    mockValues.mockResolvedValueOnce(undefined);

    const { replaceWordCountMatrix } = await import("./replace-word-count-matrix");
    await replaceWordCountMatrix(classId, [
      makeRow({ label: "Dictée 1" }),
      makeRow({ label: "Dictée 2", wordsYellow: "8" }),
    ]);

    expect(mockValues).toHaveBeenCalledWith([
      {
        classId,
        dictationLabelKey: "Dictée 1",
        wordsYellow: 10,
        wordsGreen: 12,
        wordsViolet: 14,
        wordsGold: 16,
      },
      {
        classId,
        dictationLabelKey: "Dictée 2",
        wordsYellow: 8,
        wordsGreen: 12,
        wordsViolet: 14,
        wordsGold: 16,
      },
    ]);
  });

  it("deletes all rows when saving an empty matrix", async () => {
    mockDeleteWhere.mockResolvedValueOnce(undefined);

    const { replaceWordCountMatrix } = await import("./replace-word-count-matrix");
    await replaceWordCountMatrix(classId, []);

    expect(mockDeleteWhere).toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("rejects invalid rows before writing", async () => {
    const { replaceWordCountMatrix, WordCountMatrixValidationError } = await import(
      "./replace-word-count-matrix"
    );

    await expect(
      replaceWordCountMatrix(classId, [makeRow({ label: "   " })])
    ).rejects.toThrow(WordCountMatrixValidationError);

    await expect(
      replaceWordCountMatrix(classId, [makeRow({ wordsYellow: "0" })])
    ).rejects.toThrow(WORD_COUNT_CELL_INVALID_ERROR);

    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("surfaces validation errors for empty labels", async () => {
    const { replaceWordCountMatrix } = await import("./replace-word-count-matrix");

    await expect(
      replaceWordCountMatrix(classId, [makeRow({ label: "" })])
    ).rejects.toThrow(DICTATION_LABEL_REQUIRED_ERROR);
  });
});
