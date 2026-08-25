import { afterEach, describe, expect, it, vi } from "vitest";

const mockLimit = vi.fn();
const mockWhere = vi.fn(() => ({ limit: mockLimit }));
const mockFrom = vi.fn(() => ({ where: mockWhere }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

const getDb = vi.fn(() => ({
  select: mockSelect,
}));

vi.mock("@/lib/db/index", () => ({
  getDb,
}));

describe("getTeacherClass", () => {
  const teacherId = "550e8400-e29b-41d4-a716-446655440000";
  const classId = "660e8400-e29b-41d4-a716-446655440001";

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns the teacher class when one exists", async () => {
    mockLimit.mockResolvedValueOnce([
      {
        id: classId,
        teacherId,
        schoolYearLabel: "2025-2026",
      },
    ]);

    const { getTeacherClass } = await import("./get-teacher-class");
    const result = await getTeacherClass(teacherId);

    expect(result).toEqual({
      id: classId,
      teacherId,
      schoolYearLabel: "2025-2026",
    });
  });

  it("returns null when the teacher has no class", async () => {
    mockLimit.mockResolvedValueOnce([]);

    const { getTeacherClass } = await import("./get-teacher-class");
    const result = await getTeacherClass(teacherId);

    expect(result).toBeNull();
  });
});
