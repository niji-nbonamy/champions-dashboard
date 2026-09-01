import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DICTATION_DATE_INVALID_ERROR,
  DICTATION_MATRIX_ROW_MISSING_ERROR,
} from "@/lib/domain/dictation";
import {
  DICTATION_LABEL_REQUIRED_ERROR,
  DICTATION_LABEL_TOO_LONG_ERROR,
} from "@/lib/domain/word-count-matrix";

const mockSet = vi.fn();
const mockWhere = vi.fn();
const mockReturning = vi.fn();
const mockUpdate = vi.fn(() => ({
  set: mockSet,
}));
mockSet.mockReturnValue({ where: mockWhere });
mockWhere.mockReturnValue({ returning: mockReturning });

const mockListWordCountMatrixRows = vi.fn();

vi.mock("@/lib/db/index", () => ({
  getDb: () => ({
    update: mockUpdate,
  }),
}));

vi.mock("./list-word-count-matrix-rows", () => ({
  listWordCountMatrixRows: mockListWordCountMatrixRows,
}));

describe("updateDictation", () => {
  const classId = "660e8400-e29b-41d4-a716-446655440001";
  const dictationId = "880e8400-e29b-41d4-a716-446655440003";

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("updates dictation metadata when the label matches a matrix row", async () => {
    mockListWordCountMatrixRows.mockResolvedValueOnce([
      {
        dictationLabelKey: "Dictée 1",
        wordsYellow: 10,
        wordsGreen: 12,
        wordsViolet: 14,
        wordsGold: 16,
      },
      {
        dictationLabelKey: "Dictée 2",
        wordsYellow: 11,
        wordsGreen: 13,
        wordsViolet: 15,
        wordsGold: 17,
      },
    ]);
    mockReturning.mockResolvedValueOnce([
      {
        id: dictationId,
        label: "Dictée 2",
        dictationDate: "2026-09-01",
      },
    ]);

    const { updateDictation } = await import("./update-dictation");
    const result = await updateDictation(classId, dictationId, {
      label: "Dictée 2",
      dictationDate: "2026-09-01",
    });

    expect(result).toEqual({
      id: dictationId,
      label: "Dictée 2",
      dictationDate: "2026-09-01",
    });
    expect(mockSet).toHaveBeenCalledWith({
      label: "Dictée 2",
      dictationLabelKey: "dictée 2",
      dictationDate: "2026-09-01",
    });
    expect(mockWhere).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("updates only the date when the label is unchanged", async () => {
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
        dictationDate: "2026-09-15",
      },
    ]);

    const { updateDictation } = await import("./update-dictation");

    const result = await updateDictation(classId, dictationId, {
      label: "Dictée 1",
      dictationDate: "2026-09-15",
    });

    expect(result.dictationDate).toBe("2026-09-15");
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        dictationDate: "2026-09-15",
      })
    );
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

    const { updateDictation } = await import("./update-dictation");

    await expect(
      updateDictation(classId, dictationId, {
        label: "Dictée 1",
        dictationDate: "2026-08-27",
      })
    ).rejects.toMatchObject({
      name: "UpdateDictationError",
      message: DICTATION_MATRIX_ROW_MISSING_ERROR,
    });

    expect(mockUpdate).not.toHaveBeenCalled();
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

    const { updateDictation } = await import("./update-dictation");

    await expect(
      updateDictation(classId, dictationId, {
        label: "Dictée 9",
        dictationDate: "2026-08-27",
      })
    ).rejects.toMatchObject({
      name: "UpdateDictationError",
      message: DICTATION_MATRIX_ROW_MISSING_ERROR,
    });

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects empty labels", async () => {
    const { updateDictation } = await import("./update-dictation");

    await expect(
      updateDictation(classId, dictationId, {
        label: "   ",
        dictationDate: "2026-08-27",
      })
    ).rejects.toMatchObject({
      name: "UpdateDictationError",
      message: DICTATION_LABEL_REQUIRED_ERROR,
    });

    expect(mockListWordCountMatrixRows).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects labels longer than the max length", async () => {
    const { updateDictation } = await import("./update-dictation");

    await expect(
      updateDictation(classId, dictationId, {
        label: "a".repeat(81),
        dictationDate: "2026-08-27",
      })
    ).rejects.toMatchObject({
      name: "UpdateDictationError",
      message: DICTATION_LABEL_TOO_LONG_ERROR,
    });

    expect(mockListWordCountMatrixRows).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects invalid dates", async () => {
    const { updateDictation } = await import("./update-dictation");

    await expect(
      updateDictation(classId, dictationId, {
        label: "Dictée 1",
        dictationDate: "not-a-date",
      })
    ).rejects.toMatchObject({
      name: "UpdateDictationError",
      message: DICTATION_DATE_INVALID_ERROR,
    });

    expect(mockListWordCountMatrixRows).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects updates when the dictation is outside class scope", async () => {
    mockListWordCountMatrixRows.mockResolvedValueOnce([
      {
        dictationLabelKey: "Dictée 1",
        wordsYellow: 10,
        wordsGreen: 12,
        wordsViolet: 14,
        wordsGold: 16,
      },
    ]);
    mockReturning.mockResolvedValueOnce([]);

    const { updateDictation, UPDATE_DICTATION_GENERIC_ERROR } = await import(
      "./update-dictation"
    );

    await expect(
      updateDictation(classId, dictationId, {
        label: "Dictée 1",
        dictationDate: "2026-08-27",
      })
    ).rejects.toMatchObject({
      name: "UpdateDictationError",
      message: UPDATE_DICTATION_GENERIC_ERROR,
    });
  });
});
