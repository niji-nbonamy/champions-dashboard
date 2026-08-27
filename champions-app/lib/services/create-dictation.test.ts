import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DICTATION_DATE_INVALID_ERROR,
  DICTATION_MATRIX_ROW_MISSING_ERROR,
} from "@/lib/domain/dictation";
import {
  DICTATION_LABEL_REQUIRED_ERROR,
  DICTATION_LABEL_TOO_LONG_ERROR,
} from "@/lib/domain/word-count-matrix";

const mockValues = vi.fn();
const mockReturning = vi.fn();
const mockInsert = vi.fn(() => ({
  values: mockValues,
}));
mockValues.mockReturnValue({ returning: mockReturning });

const mockListWordCountMatrixRows = vi.fn();

vi.mock("@/lib/db/index", () => ({
  getDb: () => ({
    insert: mockInsert,
  }),
}));

vi.mock("./list-word-count-matrix-rows", () => ({
  listWordCountMatrixRows: mockListWordCountMatrixRows,
}));

describe("createDictation", () => {
  const classId = "660e8400-e29b-41d4-a716-446655440001";
  const dictationId = "880e8400-e29b-41d4-a716-446655440003";

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("inserts a dictation when the label matches a matrix row", async () => {
    mockListWordCountMatrixRows.mockResolvedValueOnce([
      {
        dictationLabelKey: "Dictée 1",
        wordsYellow: 10,
        wordsGreen: 12,
        wordsViolet: 14,
        wordsGold: 16,
      },
    ]);
    mockReturning.mockResolvedValueOnce([
      {
        id: dictationId,
        label: "Dictée 1",
        dictationDate: "2026-08-27",
      },
    ]);

    const { createDictation } = await import("./create-dictation");
    const result = await createDictation(classId, {
      label: "  dictée 1 ",
      dictationDate: "2026-08-27",
    });

    expect(result).toEqual({
      id: dictationId,
      label: "Dictée 1",
      dictationDate: "2026-08-27",
    });
    expect(mockValues).toHaveBeenCalledWith({
      classId,
      label: "dictée 1",
      dictationLabelKey: "dictée 1",
      dictationDate: "2026-08-27",
    });
  });

  it("rejects labels that match only an incomplete matrix row", async () => {
    mockListWordCountMatrixRows.mockResolvedValueOnce([
      {
        dictationLabelKey: "Dictée 1",
        wordsYellow: 10,
        wordsGreen: 0,
        wordsViolet: 14,
        wordsGold: 16,
      },
    ]);

    const { createDictation } = await import("./create-dictation");

    await expect(
      createDictation(classId, {
        label: "Dictée 1",
        dictationDate: "2026-08-27",
      })
    ).rejects.toMatchObject({
      name: "CreateDictationError",
      message: DICTATION_MATRIX_ROW_MISSING_ERROR,
    });

    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("rejects labels that do not match any matrix row", async () => {
    mockListWordCountMatrixRows.mockResolvedValueOnce([
      {
        dictationLabelKey: "Dictée 1",
        wordsYellow: 10,
        wordsGreen: 12,
        wordsViolet: 14,
        wordsGold: 16,
      },
    ]);

    const { createDictation, CreateDictationError } = await import(
      "./create-dictation"
    );

    await expect(
      createDictation(classId, {
        label: "Dictée 9",
        dictationDate: "2026-08-27",
      })
    ).rejects.toMatchObject({
      name: "CreateDictationError",
      message: DICTATION_MATRIX_ROW_MISSING_ERROR,
    });

    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("rejects empty labels", async () => {
    const { createDictation, CreateDictationError } = await import(
      "./create-dictation"
    );

    await expect(
      createDictation(classId, { label: "   ", dictationDate: "2026-08-27" })
    ).rejects.toMatchObject({
      name: "CreateDictationError",
      message: DICTATION_LABEL_REQUIRED_ERROR,
    });

    expect(mockListWordCountMatrixRows).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("rejects labels longer than the max length", async () => {
    const { createDictation } = await import("./create-dictation");

    await expect(
      createDictation(classId, {
        label: "a".repeat(81),
        dictationDate: "2026-08-27",
      })
    ).rejects.toMatchObject({
      name: "CreateDictationError",
      message: DICTATION_LABEL_TOO_LONG_ERROR,
    });

    expect(mockListWordCountMatrixRows).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("rejects invalid dates", async () => {
    const { createDictation } = await import("./create-dictation");

    await expect(
      createDictation(classId, {
        label: "Dictée 1",
        dictationDate: "not-a-date",
      })
    ).rejects.toMatchObject({
      name: "CreateDictationError",
      message: DICTATION_DATE_INVALID_ERROR,
    });

    expect(mockListWordCountMatrixRows).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
