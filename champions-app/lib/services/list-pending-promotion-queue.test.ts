import { afterEach, describe, expect, it, vi } from "vitest";

import { students } from "@/lib/db/schema";

const mockOrderBy = vi.fn();
const mockWhere = vi.fn(() => ({ orderBy: mockOrderBy }));
const mockInnerJoin = vi.fn(() => ({ where: mockWhere }));
const mockFrom = vi.fn(() => ({ innerJoin: mockInnerJoin }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

const { mockEq, mockAsc } = vi.hoisted(() => ({
  mockEq: vi.fn(),
  mockAsc: vi.fn(),
}));

vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    eq: (...args: Parameters<typeof actual.eq>) => {
      mockEq(...args);
      return actual.eq(...args);
    },
    asc: (...args: Parameters<typeof actual.asc>) => {
      mockAsc(...args);
      return actual.asc(...args);
    },
  };
});

const getDb = vi.fn(() => ({
  select: mockSelect,
}));

vi.mock("@/lib/db/index", () => ({
  getDb,
}));

describe("listPendingPromotionQueueForClass", () => {
  const classId = "660e8400-e29b-41d4-a716-446655440001";

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns active pending promotions sorted by display name", async () => {
    mockOrderBy.mockResolvedValueOnce([
      {
        studentId: "770e8400-e29b-41d4-a716-446655440002",
        displayName: "Alice Martin",
        targetLevel: "green",
      },
      {
        studentId: "770e8400-e29b-41d4-a716-446655440003",
        displayName: "Bruno Dupont",
        targetLevel: "violet",
      },
    ]);

    const { listPendingPromotionQueueForClass } = await import(
      "./list-pending-promotion-queue"
    );
    const result = await listPendingPromotionQueueForClass(classId);

    expect(result).toEqual([
      {
        studentId: "770e8400-e29b-41d4-a716-446655440002",
        displayName: "Alice Martin",
        targetLevel: "green",
      },
      {
        studentId: "770e8400-e29b-41d4-a716-446655440003",
        displayName: "Bruno Dupont",
        targetLevel: "violet",
      },
    ]);
    expect(mockEq).toHaveBeenCalledWith(students.classId, classId);
    expect(mockEq).toHaveBeenCalledWith(students.archived, false);
    expect(mockAsc).toHaveBeenCalledWith(students.displayName);
  });

  it("skips rows with invalid target levels", async () => {
    mockOrderBy.mockResolvedValueOnce([
      {
        studentId: "770e8400-e29b-41d4-a716-446655440002",
        displayName: "Alice Martin",
        targetLevel: "not-a-level",
      },
    ]);

    const { listPendingPromotionQueueForClass } = await import(
      "./list-pending-promotion-queue"
    );
    const result = await listPendingPromotionQueueForClass(classId);

    expect(result).toEqual([]);
  });

  it("returns an empty array when no pending promotions exist", async () => {
    mockOrderBy.mockResolvedValueOnce([]);

    const { listPendingPromotionQueueForClass } = await import(
      "./list-pending-promotion-queue"
    );
    const result = await listPendingPromotionQueueForClass(classId);

    expect(result).toEqual([]);
    expect(mockInnerJoin).toHaveBeenCalledWith(
      students,
      expect.anything()
    );
    expect(mockWhere).toHaveBeenCalled();
  });
});
