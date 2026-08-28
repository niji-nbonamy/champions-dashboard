import { afterEach, describe, expect, it, vi } from "vitest";

import { dictationEntries, dictations } from "@/lib/db/schema";

const mockOrderBy = vi.fn();
const mockWhere = vi.fn(() => ({ orderBy: mockOrderBy }));
const mockInnerJoin = vi.fn(() => ({ where: mockWhere }));
const mockFrom = vi.fn(() => ({ innerJoin: mockInnerJoin }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

const { mockAsc, mockDesc, mockEq, mockAnd } = vi.hoisted(() => ({
  mockAsc: vi.fn(),
  mockDesc: vi.fn(),
  mockEq: vi.fn(),
  mockAnd: vi.fn(),
}));

vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    asc: (...args: Parameters<typeof actual.asc>) => {
      mockAsc(...args);
      return actual.asc(...args);
    },
    desc: (...args: Parameters<typeof actual.desc>) => {
      mockDesc(...args);
      return actual.desc(...args);
    },
    eq: (...args: Parameters<typeof actual.eq>) => {
      mockEq(...args);
      return actual.eq(...args);
    },
    and: (...args: Parameters<typeof actual.and>) => {
      mockAnd(...args);
      return actual.and(...args);
    },
  };
});

const getDb = vi.fn(() => ({
  select: mockSelect,
}));

vi.mock("@/lib/db/index", () => ({
  getDb,
}));

describe("getStudentDictationHistory", () => {
  const classId = "660e8400-e29b-41d4-a716-446655440001";
  const studentId = "770e8400-e29b-41d4-a716-446655440002";

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("scopes history to the class and student with newest dictation dates first", async () => {
    mockOrderBy.mockResolvedValueOnce([
      {
        entryId: "aa0e8400-e29b-41d4-a716-446655440010",
        dictationId: "880e8400-e29b-41d4-a716-446655440003",
        label: "Dictée B",
        dictationDate: "2026-08-27",
        levelAtSave: "yellow",
        globalPercent: 92,
        wordDenominator: 40,
      },
      {
        entryId: "bb0e8400-e29b-41d4-a716-446655440011",
        dictationId: "770e8400-e29b-41d4-a716-446655440002",
        label: "Dictée A",
        dictationDate: "2026-08-20",
        levelAtSave: "yellow",
        globalPercent: 88,
        wordDenominator: 40,
      },
    ]);

    const { getStudentDictationHistory } = await import(
      "./get-student-dictation-history"
    );
    const result = await getStudentDictationHistory(classId, studentId);

    expect(mockSelect).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalledWith(dictationEntries);
    expect(mockInnerJoin).toHaveBeenCalledWith(
      dictations,
      expect.anything()
    );
    expect(mockWhere).toHaveBeenCalled();
    expect(mockAnd).toHaveBeenCalled();
    expect(mockDesc).toHaveBeenCalledWith(dictations.dictationDate);
    expect(mockAsc).toHaveBeenCalledWith(dictations.label);
    expect(mockAsc).not.toHaveBeenCalledWith(dictations.id);
    expect(mockEq).toHaveBeenCalledWith(
      dictationEntries.dictationId,
      dictations.id
    );
    expect(mockEq).toHaveBeenCalledWith(dictations.classId, classId);
    expect(mockEq).toHaveBeenCalledWith(dictationEntries.studentId, studentId);
    expect(result).toEqual([
      {
        entryId: "aa0e8400-e29b-41d4-a716-446655440010",
        dictationId: "880e8400-e29b-41d4-a716-446655440003",
        label: "Dictée B",
        dictationDate: "2026-08-27",
        levelAtSave: "yellow",
        globalPercent: 92,
        wordDenominator: 40,
      },
      {
        entryId: "bb0e8400-e29b-41d4-a716-446655440011",
        dictationId: "770e8400-e29b-41d4-a716-446655440002",
        label: "Dictée A",
        dictationDate: "2026-08-20",
        levelAtSave: "yellow",
        globalPercent: 88,
        wordDenominator: 40,
      },
    ]);
  });

  it("returns an empty array when the student has no saved dictations", async () => {
    mockOrderBy.mockResolvedValueOnce([]);

    const { getStudentDictationHistory } = await import(
      "./get-student-dictation-history"
    );
    const result = await getStudentDictationHistory(classId, studentId);

    expect(result).toEqual([]);
  });
});
