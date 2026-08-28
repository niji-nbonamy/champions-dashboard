import { afterEach, describe, expect, it, vi } from "vitest";

import {
  assertCountsMatchRoster,
  prepareDictationEntries,
  prepareDictationEntryUpdates,
} from "./dictation-save";

const matrixRow = {
  wordsYellow: 50,
  wordsGreen: 60,
  wordsViolet: 70,
  wordsGold: 80,
};

const students = [
  {
    id: "770e8400-e29b-41d4-a716-446655440002",
    level: "yellow",
  },
  {
    id: "770e8400-e29b-41d4-a716-446655440004",
    level: "green",
  },
];

const emptyCounts = {
  C: 0,
  H: 0,
  A: 0,
  M: 0,
  P: 0,
  I: 0,
  O: 0,
  N: 0,
  S: 0,
};

const mockTransaction = vi.fn();
const mockUpdate = vi.fn();
const mockUpdateSet = vi.fn();
const mockUpdateWhere = vi.fn();
const mockUpdateReturning = vi.fn();
const mockDelete = vi.fn();
const mockDeleteWhere = vi.fn();
const mockInsert = vi.fn();
const mockInsertValues = vi.fn();
const mockInsertOnConflict = vi.fn();
const mockSelect = vi.fn();
const mockSelectFrom = vi.fn();
const mockSelectInnerJoin = vi.fn();
const mockSelectWhere = vi.fn();
const mockSelectOrderBy = vi.fn();
const mockSelectLimit = vi.fn();

mockUpdate.mockReturnValue({ set: mockUpdateSet });
mockUpdateSet.mockReturnValue({ where: mockUpdateWhere });
mockUpdateWhere.mockReturnValue({ returning: mockUpdateReturning });
mockUpdateReturning.mockResolvedValue([{ id: "entry-1" }]);
mockDelete.mockReturnValue({ where: mockDeleteWhere });
mockDeleteWhere.mockResolvedValue(undefined);
mockInsert.mockReturnValue({ values: mockInsertValues });
mockInsertValues.mockReturnValue({
  onConflictDoNothing: mockInsertOnConflict,
});
mockInsertOnConflict.mockResolvedValue(undefined);
mockSelect.mockReturnValue({ from: mockSelectFrom });
mockSelectFrom.mockReturnValue({ innerJoin: mockSelectInnerJoin });
mockSelectInnerJoin.mockReturnValue({
  innerJoin: mockSelectInnerJoin,
  where: mockSelectWhere,
});
mockSelectWhere.mockReturnValue({
  orderBy: mockSelectOrderBy,
  limit: mockSelectLimit,
});
mockSelectOrderBy.mockReturnValue({ limit: mockSelectLimit });
mockSelectLimit.mockResolvedValue([]);

const mockGetDb = vi.fn(() => ({
  transaction: mockTransaction,
  select: mockSelect,
}));

const mockGetDictationById = vi.fn();
const mockGetDictationEntriesByDictationId = vi.fn();
const mockListLeveledActiveStudents = vi.fn();
const mockListWordCountMatrixRows = vi.fn();

vi.mock("@/lib/db/index", () => ({
  getDb: () => mockGetDb(),
}));

vi.mock("./get-dictation-entries", () => ({
  getDictationEntriesByDictationId: (...args: unknown[]) =>
    mockGetDictationEntriesByDictationId(...args),
}));

vi.mock("./list-dictations", () => ({
  getDictationById: (...args: unknown[]) => mockGetDictationById(...args),
}));

vi.mock("./list-leveled-active-students", () => ({
  listLeveledActiveStudents: (...args: unknown[]) =>
    mockListLeveledActiveStudents(...args),
}));

vi.mock("./list-word-count-matrix-rows", () => ({
  listWordCountMatrixRows: (...args: unknown[]) =>
    mockListWordCountMatrixRows(...args),
}));

describe("assertCountsMatchRoster", () => {
  it("rejects when a roster student is missing from the counts payload", () => {
    expect(() =>
      assertCountsMatchRoster(students, {
        [students[0].id]: { ...emptyCounts },
      })
    ).toThrow();
  });

  it("rejects when the counts payload includes an unknown student id", () => {
    expect(() =>
      assertCountsMatchRoster(students, {
        [students[0].id]: { ...emptyCounts },
        [students[1].id]: { ...emptyCounts },
        "00000000-0000-4000-8000-000000000099": { ...emptyCounts },
      })
    ).toThrow();
  });
});

describe("prepareDictationEntries", () => {
  it("builds snapshots with matrix-derived denominators per level", () => {
    const entries = prepareDictationEntries(
      students,
      {
        [students[0].id]: { ...emptyCounts, C: 5 },
        [students[1].id]: { ...emptyCounts, H: 6 },
      },
      matrixRow
    );

    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      studentId: students[0].id,
      levelAtSave: "yellow",
      wordDenominator: 50,
      globalPercent: 90,
      errorColumns: expect.objectContaining({ errorsC: 5 }),
    });
    expect(entries[1]).toMatchObject({
      studentId: students[1].id,
      levelAtSave: "green",
      wordDenominator: 60,
      globalPercent: 90,
      errorColumns: expect.objectContaining({ errorsH: 6 }),
    });
  });

  it("rejects rows whose error sum exceeds the word total", () => {
    expect(() =>
      prepareDictationEntries(
        students.slice(0, 1),
        {
          [students[0].id]: { ...emptyCounts, C: 51 },
        },
        matrixRow
      )
    ).toThrow();
  });

  it("rejects rows with a single category above the word total", () => {
    expect(() =>
      prepareDictationEntries(
        students.slice(0, 1),
        {
          [students[0].id]: { ...emptyCounts, C: 50, H: 1 },
        },
        matrixRow
      )
    ).toThrow();
  });
});

describe("prepareDictationEntryUpdates", () => {
  it("preserves snapshot level and denominator while recalculating percent", () => {
    const updates = prepareDictationEntryUpdates(
      [
        {
          studentId: students[0].id,
          levelAtSave: "yellow",
          wordDenominator: 55,
        },
      ],
      {
        [students[0].id]: { ...emptyCounts, C: 5 },
      }
    );

    expect(updates).toEqual([
      expect.objectContaining({
        studentId: students[0].id,
        levelAtSave: "yellow",
        wordDenominator: 55,
        globalPercent: 91,
        errorColumns: expect.objectContaining({ errorsC: 5 }),
      }),
    ]);
  });

  it("rejects counts above the snapshot denominator", () => {
    expect(() =>
      prepareDictationEntryUpdates(
        [
          {
            studentId: students[0].id,
            levelAtSave: "yellow",
            wordDenominator: 10,
          },
        ],
        {
          [students[0].id]: { ...emptyCounts, C: 11 },
        }
      )
    ).toThrow();
  });
});

describe("saveDictation edit path", () => {
  const classId = "660e8400-e29b-41d4-a716-446655440001";
  const dictationId = "880e8400-e29b-41d4-a716-446655440003";

  afterEach(() => {
    vi.clearAllMocks();
    mockSelectLimit.mockReset();
    mockSelectLimit.mockResolvedValue([]);
  });

  it("updates entries using snapshots and re-evaluates pending promotions", async () => {
    mockGetDictationById.mockResolvedValueOnce({
      id: dictationId,
      dictationLabelKey: "dictée 1",
    });
    mockGetDictationEntriesByDictationId.mockResolvedValueOnce([
      {
        studentId: students[0].id,
        displayName: "DUPONT Marie",
        archived: false,
        levelAtSave: "yellow",
        wordDenominator: 50,
        globalPercent: 80,
        errorsC: 10,
        errorsH: 0,
        errorsA: 0,
        errorsM: 0,
        errorsP: 0,
        errorsI: 0,
        errorsO: 0,
        errorsN: 0,
        errorsS: 0,
      },
    ]);

    mockTransaction.mockImplementationOnce(async (callback) => {
      const tx = {
        update: mockUpdate,
        delete: mockDelete,
        insert: mockInsert,
        select: mockSelect,
      };
      mockSelectLimit
        .mockResolvedValueOnce([
          { levelAtSave: "yellow", globalPercent: 96 },
          { levelAtSave: "yellow", globalPercent: 92 },
        ])
        .mockResolvedValueOnce([]);
      await callback(tx);
    });

    const { saveDictation } = await import("./dictation-save");
    const result = await saveDictation(classId, dictationId, {
      [students[0].id]: { ...emptyCounts, C: 2 },
    });

    expect(result).toEqual({ dictationId, entryCount: 1 });
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        globalPercent: 96,
        errorsC: 2,
      })
    );
    expect(mockDeleteWhere).toHaveBeenCalled();
    expect(mockInsertValues).toHaveBeenCalledWith({
      studentId: students[0].id,
      targetLevel: "green",
    });
  });

  it("removes pending promotion when edit breaks eligibility", async () => {
    mockGetDictationById.mockResolvedValueOnce({
      id: dictationId,
      dictationLabelKey: "dictée 1",
    });
    mockGetDictationEntriesByDictationId.mockResolvedValueOnce([
      {
        studentId: students[0].id,
        displayName: "DUPONT Marie",
        archived: false,
        levelAtSave: "yellow",
        wordDenominator: 50,
        globalPercent: 96,
        errorsC: 2,
        errorsH: 0,
        errorsA: 0,
        errorsM: 0,
        errorsP: 0,
        errorsI: 0,
        errorsO: 0,
        errorsN: 0,
        errorsS: 0,
      },
    ]);

    mockTransaction.mockImplementationOnce(async (callback) => {
      const tx = {
        update: mockUpdate,
        delete: mockDelete,
        insert: mockInsert,
        select: mockSelect,
      };
      mockSelectLimit.mockResolvedValueOnce([
        { levelAtSave: "yellow", globalPercent: 70 },
        { levelAtSave: "yellow", globalPercent: 96 },
      ]);
      await callback(tx);
    });

    const { saveDictation } = await import("./dictation-save");
    await saveDictation(classId, dictationId, {
      [students[0].id]: { ...emptyCounts, C: 15 },
    });

    expect(mockDeleteWhere).toHaveBeenCalled();
    expect(mockInsertValues).not.toHaveBeenCalled();
  });

  it("ignores archived students in the editable payload", async () => {
    mockGetDictationById.mockResolvedValueOnce({
      id: dictationId,
      dictationLabelKey: "dictée 1",
    });
    mockGetDictationEntriesByDictationId.mockResolvedValueOnce([
      {
        studentId: students[0].id,
        displayName: "DUPONT Marie",
        archived: true,
        levelAtSave: "yellow",
        wordDenominator: 50,
        globalPercent: 90,
        errorsC: 5,
        errorsH: 0,
        errorsA: 0,
        errorsM: 0,
        errorsP: 0,
        errorsI: 0,
        errorsO: 0,
        errorsN: 0,
        errorsS: 0,
      },
    ]);

    const { saveDictation } = await import("./dictation-save");

    await expect(saveDictation(classId, dictationId, {})).rejects.toThrow();
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("rejects edit payload that does not match editable roster", async () => {
    mockGetDictationById.mockResolvedValueOnce({
      id: dictationId,
      dictationLabelKey: "dictée 1",
    });
    mockGetDictationEntriesByDictationId.mockResolvedValueOnce([
      {
        studentId: students[0].id,
        displayName: "DUPONT Marie",
        archived: false,
        levelAtSave: "yellow",
        wordDenominator: 50,
        globalPercent: 90,
        errorsC: 5,
        errorsH: 0,
        errorsA: 0,
        errorsM: 0,
        errorsP: 0,
        errorsI: 0,
        errorsO: 0,
        errorsN: 0,
        errorsS: 0,
      },
    ]);

    const { saveDictation } = await import("./dictation-save");

    await expect(
      saveDictation(classId, dictationId, {
        [students[1].id]: { ...emptyCounts, C: 1 },
      })
    ).rejects.toThrow();
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("skips promotion cascade for archived students on the dictation", async () => {
    mockGetDictationById.mockResolvedValueOnce({
      id: dictationId,
      dictationLabelKey: "dictée 1",
    });
    mockGetDictationEntriesByDictationId.mockResolvedValueOnce([
      {
        studentId: students[0].id,
        displayName: "DUPONT Marie",
        archived: false,
        levelAtSave: "yellow",
        wordDenominator: 50,
        globalPercent: 80,
        errorsC: 10,
        errorsH: 0,
        errorsA: 0,
        errorsM: 0,
        errorsP: 0,
        errorsI: 0,
        errorsO: 0,
        errorsN: 0,
        errorsS: 0,
      },
      {
        studentId: students[1].id,
        displayName: "MARTIN Paul",
        archived: true,
        levelAtSave: "green",
        wordDenominator: 60,
        globalPercent: 90,
        errorsC: 6,
        errorsH: 0,
        errorsA: 0,
        errorsM: 0,
        errorsP: 0,
        errorsI: 0,
        errorsO: 0,
        errorsN: 0,
        errorsS: 0,
      },
    ]);

    mockTransaction.mockImplementationOnce(async (callback) => {
      const tx = {
        update: mockUpdate,
        delete: mockDelete,
        insert: mockInsert,
        select: mockSelect,
      };
      mockSelectLimit.mockResolvedValueOnce([
        { levelAtSave: "yellow", globalPercent: 96 },
        { levelAtSave: "yellow", globalPercent: 92 },
      ]);
      await callback(tx);
    });

    const { saveDictation } = await import("./dictation-save");
    await saveDictation(classId, dictationId, {
      [students[0].id]: { ...emptyCounts, C: 2 },
    });

    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockSelectLimit).toHaveBeenCalledTimes(1);
  });

  it("does not insert pending promotion when student has only one dictation", async () => {
    mockGetDictationById.mockResolvedValueOnce({
      id: dictationId,
      dictationLabelKey: "dictée 1",
    });
    mockGetDictationEntriesByDictationId.mockResolvedValueOnce([
      {
        studentId: students[0].id,
        displayName: "DUPONT Marie",
        archived: false,
        levelAtSave: "yellow",
        wordDenominator: 50,
        globalPercent: 96,
        errorsC: 2,
        errorsH: 0,
        errorsA: 0,
        errorsM: 0,
        errorsP: 0,
        errorsI: 0,
        errorsO: 0,
        errorsN: 0,
        errorsS: 0,
      },
    ]);

    mockTransaction.mockImplementationOnce(async (callback) => {
      const tx = {
        update: mockUpdate,
        delete: mockDelete,
        insert: mockInsert,
        select: mockSelect,
      };
      mockSelectLimit.mockResolvedValueOnce([
        { levelAtSave: "yellow", globalPercent: 96 },
      ]);
      await callback(tx);
    });

    const { saveDictation } = await import("./dictation-save");
    await saveDictation(classId, dictationId, {
      [students[0].id]: { ...emptyCounts, C: 2 },
    });

    expect(mockDeleteWhere).toHaveBeenCalled();
    expect(mockInsertValues).not.toHaveBeenCalled();
  });
});
