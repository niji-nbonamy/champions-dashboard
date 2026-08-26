import { afterEach, describe, expect, it, vi } from "vitest";

const mockWhere = vi.fn();
const mockFrom = vi.fn(() => ({ where: mockWhere }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

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

  it("returns zero when every active student has a level", async () => {
    mockWhere.mockResolvedValueOnce([]);

    const { countUnassignedActiveStudents } = await import(
      "./count-unassigned-active-students"
    );
    const result = await countUnassignedActiveStudents(classId);

    expect(result).toBe(0);
  });
});
