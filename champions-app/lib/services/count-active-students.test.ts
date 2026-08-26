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

describe("countActiveStudents", () => {
  const classId = "660e8400-e29b-41d4-a716-446655440001";

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns only non-archived students for the class", async () => {
    mockWhere.mockResolvedValueOnce([{ count: 2 }]);

    const { countActiveStudents } = await import("./count-active-students");
    const result = await countActiveStudents(classId);

    expect(result).toBe(2);
    expect(mockSelect).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalled();
    expect(mockWhere).toHaveBeenCalled();
  });

  it("returns zero when no active students exist", async () => {
    mockWhere.mockResolvedValueOnce([]);

    const { countActiveStudents } = await import("./count-active-students");
    const result = await countActiveStudents(classId);

    expect(result).toBe(0);
  });
});
