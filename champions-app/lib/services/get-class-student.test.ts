import { afterEach, describe, expect, it, vi } from "vitest";

import { students } from "@/lib/db/schema";

const mockLimit = vi.fn();
const mockWhere = vi.fn(() => ({ limit: mockLimit }));
const mockFrom = vi.fn(() => ({ where: mockWhere }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

const { mockEq, mockAnd } = vi.hoisted(() => ({
  mockEq: vi.fn(),
  mockAnd: vi.fn(),
}));

vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
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

describe("getClassStudent", () => {
  const classId = "660e8400-e29b-41d4-a716-446655440001";
  const studentId = "770e8400-e29b-41d4-a716-446655440002";

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns the student when found in the class", async () => {
    mockLimit.mockResolvedValueOnce([
      {
        id: studentId,
        displayName: "DUPONT Marie",
        level: "yellow",
        archived: false,
        hasSpeechTherapy: false,
      },
    ]);

    const { getClassStudent } = await import("./get-class-student");
    const result = await getClassStudent(classId, studentId);

    expect(mockSelect).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalledWith(students);
    expect(mockWhere).toHaveBeenCalled();
    expect(mockAnd).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith(students.id, studentId);
    expect(mockEq).toHaveBeenCalledWith(students.classId, classId);
    expect(result).toEqual({
      id: studentId,
      displayName: "DUPONT Marie",
      level: "yellow",
      archived: false,
      hasSpeechTherapy: false,
    });
  });

  it("returns archived students without rejecting them", async () => {
    mockLimit.mockResolvedValueOnce([
      {
        id: studentId,
        displayName: "BERNARD Paul",
        level: "green",
        archived: true,
        hasSpeechTherapy: false,
      },
    ]);

    const { getClassStudent } = await import("./get-class-student");
    const result = await getClassStudent(classId, studentId);

    expect(result).toEqual({
      id: studentId,
      displayName: "BERNARD Paul",
      level: "green",
      archived: true,
      hasSpeechTherapy: false,
    });
  });

  it("returns null when the student is not in the class", async () => {
    mockLimit.mockResolvedValueOnce([]);

    const { getClassStudent } = await import("./get-class-student");
    const result = await getClassStudent(classId, studentId);

    expect(result).toBeNull();
  });
});
