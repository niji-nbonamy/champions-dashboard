import { afterEach, describe, expect, it, vi } from "vitest";

const mockWhere = vi.fn();
const mockInnerJoin = vi.fn(() => ({ where: mockWhere }));
const mockFrom = vi.fn(() => ({ innerJoin: mockInnerJoin }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

const getDb = vi.fn(() => ({
  select: mockSelect,
}));

vi.mock("@/lib/db/index", () => ({
  getDb,
}));

describe("listPendingPromotionsForStudents", () => {
  const classId = "660e8400-e29b-41d4-a716-446655440001";
  const activeStudentId = "770e8400-e29b-41d4-a716-446655440002";
  const archivedStudentId = "770e8400-e29b-41d4-a716-446655440099";

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns an empty map when no student ids are provided", async () => {
    const { listPendingPromotionsForStudents } = await import(
      "./list-pending-promotions"
    );

    const result = await listPendingPromotionsForStudents(classId, []);

    expect(result).toEqual({});
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it("returns pending promotions for requested students including archived rows", async () => {
    mockWhere.mockResolvedValueOnce([
      { studentId: activeStudentId, targetLevel: "green" },
      { studentId: archivedStudentId, targetLevel: "violet" },
    ]);

    const { listPendingPromotionsForStudents } = await import(
      "./list-pending-promotions"
    );

    const result = await listPendingPromotionsForStudents(classId, [
      activeStudentId,
      archivedStudentId,
    ]);

    expect(result).toEqual({
      [activeStudentId]: { targetLevel: "green" },
      [archivedStudentId]: { targetLevel: "violet" },
    });
    expect(mockInnerJoin).toHaveBeenCalled();
    expect(mockWhere).toHaveBeenCalled();
  });

  it("skips rows with invalid target levels", async () => {
    mockWhere.mockResolvedValueOnce([
      { studentId: activeStudentId, targetLevel: "not-a-level" },
    ]);

    const { listPendingPromotionsForStudents } = await import(
      "./list-pending-promotions"
    );

    const result = await listPendingPromotionsForStudents(classId, [
      activeStudentId,
    ]);

    expect(result).toEqual({});
  });
});
