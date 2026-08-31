import { afterEach, describe, expect, it, vi } from "vitest";

import { students } from "@/lib/db/schema";

const mockWhere = vi.fn();
const mockInnerJoin = vi.fn(() => ({ where: mockWhere }));
const mockFrom = vi.fn(() => ({ innerJoin: mockInnerJoin }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

const { mockEq } = vi.hoisted(() => ({
  mockEq: vi.fn(),
}));

vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    eq: (...args: Parameters<typeof actual.eq>) => {
      mockEq(...args);
      return actual.eq(...args);
    },
  };
});

const getDb = vi.fn(() => ({
  select: mockSelect,
}));

vi.mock("@/lib/db/index", () => ({
  getDb,
}));

describe("countPendingPromotionsForClass", () => {
  const classId = "660e8400-e29b-41d4-a716-446655440001";

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns the count of active non-archived pending promotions", async () => {
    mockWhere.mockResolvedValueOnce([
      { targetLevel: "green" },
      { targetLevel: "violet" },
    ]);

    const { countPendingPromotionsForClass } = await import(
      "./count-pending-promotions"
    );
    const result = await countPendingPromotionsForClass(classId);

    expect(result).toBe(2);
    expect(mockSelect).toHaveBeenCalled();
    expect(mockInnerJoin).toHaveBeenCalledWith(
      students,
      expect.anything()
    );
    expect(mockEq).toHaveBeenCalledWith(students.classId, classId);
    expect(mockEq).toHaveBeenCalledWith(students.archived, false);
  });

  it("skips rows with invalid target levels", async () => {
    mockWhere.mockResolvedValueOnce([
      { targetLevel: "green" },
      { targetLevel: "not-a-level" },
    ]);

    const { countPendingPromotionsForClass } = await import(
      "./count-pending-promotions"
    );
    const result = await countPendingPromotionsForClass(classId);

    expect(result).toBe(1);
  });

  it("returns zero when no pending promotions exist", async () => {
    mockWhere.mockResolvedValueOnce([]);

    const { countPendingPromotionsForClass } = await import(
      "./count-pending-promotions"
    );
    const result = await countPendingPromotionsForClass(classId);

    expect(result).toBe(0);
  });
});
