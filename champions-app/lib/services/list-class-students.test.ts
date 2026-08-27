import { afterEach, describe, expect, it, vi } from "vitest";

import { students } from "@/lib/db/schema";

const mockSelect = vi.fn();
const mockFrom = vi.fn(() => ({ where: mockWhere }));
const mockWhere = vi.fn();

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

describe("listClassStudents", () => {
  const classId = "660e8400-e29b-41d4-a716-446655440001";

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns active students sorted by display name by default", async () => {
    mockSelect.mockReturnValueOnce({ from: mockFrom });
    mockWhere.mockResolvedValueOnce([
      {
        id: "880e8400-e29b-41d4-a716-446655440003",
        displayName: "MARTIN Lucas",
        level: "yellow",
        archived: false,
      },
      {
        id: "770e8400-e29b-41d4-a716-446655440002",
        displayName: "DUPONT Marie",
        level: null,
        archived: false,
      },
    ]);

    const { listClassStudents } = await import("./list-class-students");
    const result = await listClassStudents(classId);

    expect(result).toEqual([
      {
        id: "770e8400-e29b-41d4-a716-446655440002",
        displayName: "DUPONT Marie",
        level: null,
        archived: false,
      },
      {
        id: "880e8400-e29b-41d4-a716-446655440003",
        displayName: "MARTIN Lucas",
        level: "yellow",
        archived: false,
      },
    ]);
    expect(mockEq).toHaveBeenCalledWith(students.classId, classId);
    expect(mockEq).toHaveBeenCalledWith(students.archived, false);
  });

  it("filters archived students when filter is archived", async () => {
    mockSelect.mockReturnValueOnce({ from: mockFrom });
    mockWhere.mockResolvedValueOnce([
      {
        id: "990e8400-e29b-41d4-a716-446655440004",
        displayName: "BERNARD Paul",
        level: "green",
        archived: true,
      },
    ]);

    const { listClassStudents } = await import("./list-class-students");
    const result = await listClassStudents(classId, "archived");

    expect(result).toEqual([
      {
        id: "990e8400-e29b-41d4-a716-446655440004",
        displayName: "BERNARD Paul",
        level: "green",
        archived: true,
      },
    ]);
    expect(mockEq).toHaveBeenCalledWith(students.archived, true);
  });

  it("returns all students when filter is all", async () => {
    mockSelect.mockReturnValueOnce({ from: mockFrom });
    mockWhere.mockResolvedValueOnce([
      {
        id: "770e8400-e29b-41d4-a716-446655440002",
        displayName: "DUPONT Marie",
        level: null,
        archived: false,
      },
      {
        id: "990e8400-e29b-41d4-a716-446655440004",
        displayName: "BERNARD Paul",
        level: "green",
        archived: true,
      },
    ]);

    const { listClassStudents } = await import("./list-class-students");
    const result = await listClassStudents(classId, "all");

    expect(result).toHaveLength(2);
    expect(mockEq).toHaveBeenCalledWith(students.classId, classId);
    expect(mockEq).not.toHaveBeenCalledWith(students.archived, false);
    expect(mockEq).not.toHaveBeenCalledWith(students.archived, true);
  });
});
