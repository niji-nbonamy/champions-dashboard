import { afterEach, describe, expect, it, vi } from "vitest";

import { levelHistoryEntries, students } from "@/lib/db/schema";

const mockOrderBy = vi.fn();
const mockWhere = vi.fn(() => ({ orderBy: mockOrderBy }));
const mockInnerJoin = vi.fn(() => ({ where: mockWhere }));
const mockFrom = vi.fn(() => ({ innerJoin: mockInnerJoin }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

const { mockDesc, mockEq, mockAnd } = vi.hoisted(() => ({
  mockDesc: vi.fn(),
  mockEq: vi.fn(),
  mockAnd: vi.fn(),
}));

vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
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

describe("getStudentLevelHistory", () => {
  const classId = "660e8400-e29b-41d4-a716-446655440001";
  const studentId = "770e8400-e29b-41d4-a716-446655440002";

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("scopes history to the class and student with newest entries first", async () => {
    const newer = new Date("2026-08-28T10:00:00.000Z");
    const older = new Date("2026-08-20T10:00:00.000Z");

    mockOrderBy.mockResolvedValueOnce([
      {
        id: "aa0e8400-e29b-41d4-a716-446655440010",
        level: "green",
        action: "manual",
        occurredAt: newer,
      },
      {
        id: "bb0e8400-e29b-41d4-a716-446655440011",
        level: "yellow",
        action: "assigned",
        occurredAt: older,
      },
    ]);

    const { getStudentLevelHistory } = await import(
      "./get-student-level-history"
    );
    const result = await getStudentLevelHistory(classId, studentId);

    expect(result).toHaveLength(2);
    expect(result[0]?.action).toBe("manual");
    expect(mockEq).toHaveBeenCalledWith(students.id, studentId);
    expect(mockEq).toHaveBeenCalledWith(students.classId, classId);
    expect(mockDesc).toHaveBeenCalledWith(levelHistoryEntries.occurredAt);
    expect(mockDesc).toHaveBeenCalledWith(levelHistoryEntries.id);
  });

  it("returns an empty array when no history exists", async () => {
    mockOrderBy.mockResolvedValueOnce([]);

    const { getStudentLevelHistory } = await import(
      "./get-student-level-history"
    );
    const result = await getStudentLevelHistory(classId, studentId);

    expect(result).toEqual([]);
  });
});
