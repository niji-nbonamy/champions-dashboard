import { afterEach, describe, expect, it, vi } from "vitest";

import { students } from "@/lib/db/schema";

const mockWhere = vi.fn();
const mockFrom = vi.fn(() => ({ where: mockWhere }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

const { mockEq, mockIsNull } = vi.hoisted(() => ({
  mockEq: vi.fn(),
  mockIsNull: vi.fn(),
}));

vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    eq: (...args: Parameters<typeof actual.eq>) => {
      mockEq(...args);
      return actual.eq(...args);
    },
    isNull: (...args: Parameters<typeof actual.isNull>) => {
      mockIsNull(...args);
      return actual.isNull(...args);
    },
  };
});

const getDb = vi.fn(() => ({
  select: mockSelect,
}));

vi.mock("@/lib/db/index", () => ({
  getDb,
}));

describe("countUnassignedActiveStudents", () => {
  const classId = "660e8400-e29b-41d4-a716-446655440001";

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns only active students without a level", async () => {
    mockWhere.mockResolvedValueOnce([{ count: 3 }]);

    const { countUnassignedActiveStudents } = await import(
      "./count-unassigned-active-students"
    );
    const result = await countUnassignedActiveStudents(classId);

    expect(result).toBe(3);
    expect(mockSelect).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalled();
    expect(mockWhere).toHaveBeenCalled();
  });

  it("filters unassigned active students in the query", async () => {
    mockWhere.mockResolvedValueOnce([{ count: 2 }]);

    const { countUnassignedActiveStudents } = await import(
      "./count-unassigned-active-students"
    );
    await countUnassignedActiveStudents(classId);

    expect(mockEq).toHaveBeenCalledWith(students.classId, classId);
    expect(mockEq).toHaveBeenCalledWith(students.archived, false);
    expect(mockIsNull).toHaveBeenCalledWith(students.level);
  });

  it("returns zero when every active student has a level", async () => {
    mockWhere.mockResolvedValueOnce([]);

    const { countUnassignedActiveStudents } = await import(
      "./count-unassigned-active-students"
    );
    const result = await countUnassignedActiveStudents(classId);

    expect(result).toBe(0);
  });
});
