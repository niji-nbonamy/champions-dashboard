import { afterEach, describe, expect, it, vi } from "vitest";

import { students } from "@/lib/db/schema";

const mockWhere = vi.fn();
const mockFrom = vi.fn(() => ({ where: mockWhere }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

const { mockEq, mockIsNotNull } = vi.hoisted(() => ({
  mockEq: vi.fn(),
  mockIsNotNull: vi.fn(),
}));

vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    eq: (...args: Parameters<typeof actual.eq>) => {
      mockEq(...args);
      return actual.eq(...args);
    },
    isNotNull: (...args: Parameters<typeof actual.isNotNull>) => {
      mockIsNotNull(...args);
      return actual.isNotNull(...args);
    },
  };
});

const getDb = vi.fn(() => ({
  select: mockSelect,
}));

vi.mock("@/lib/db/index", () => ({
  getDb,
}));

describe("countLeveledActiveStudents", () => {
  const classId = "660e8400-e29b-41d4-a716-446655440001";

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("counts only active students with valid Champions levels", async () => {
    mockWhere.mockResolvedValueOnce([
      { level: "yellow" },
      { level: "green" },
      { level: "invalid" },
      { level: null },
    ]);

    const { countLeveledActiveStudents } = await import(
      "./count-leveled-active-students"
    );
    const result = await countLeveledActiveStudents(classId);

    expect(result).toBe(2);
    expect(mockSelect).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalledWith(students);
    expect(mockWhere).toHaveBeenCalled();
  });

  it("returns zero when no leveled students exist", async () => {
    mockWhere.mockResolvedValueOnce([{ level: "not-a-level" }]);

    const { countLeveledActiveStudents } = await import(
      "./count-leveled-active-students"
    );
    const result = await countLeveledActiveStudents(classId);

    expect(result).toBe(0);
  });
});
