import { afterEach, describe, expect, it, vi } from "vitest";

import { pendingPromotions } from "@/lib/db/schema";

const mockLimit = vi.fn();
const mockOrderBy = vi.fn(() => ({ limit: mockLimit }));
const mockWhereSelect = vi.fn(() => ({ orderBy: mockOrderBy }));
const mockInnerJoin = vi.fn(() => ({ where: mockWhereSelect }));
const mockFromSelect = vi.fn(() => ({ innerJoin: mockInnerJoin }));
const mockSelect = vi.fn(() => ({ from: mockFromSelect }));

const mockOnConflictDoNothing = vi.fn();
const mockValues = vi.fn(() => ({ onConflictDoNothing: mockOnConflictDoNothing }));
const mockInsert = vi.fn(() => ({ values: mockValues }));

const mockDeleteWhere = vi.fn();
const mockDelete = vi.fn(() => ({ where: mockDeleteWhere }));

const mockTransaction = vi.fn(
  async (callback: (tx: {
    select: typeof mockSelect;
    delete: typeof mockDelete;
    insert: typeof mockInsert;
  }) => Promise<unknown>) =>
    callback({
      select: mockSelect,
      delete: mockDelete,
      insert: mockInsert,
    })
);

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
  transaction: mockTransaction,
}));

vi.mock("@/lib/db/index", () => ({
  getDb,
}));

describe("reevaluatePendingPromotionForCurrentLevel", () => {
  const classId = "660e8400-e29b-41d4-a716-446655440001";
  const studentId = "770e8400-e29b-41d4-a716-446655440002";

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("creates a pending promotion when recent dictations qualify from the new level", async () => {
    mockLimit.mockResolvedValueOnce([
      { globalPercent: 92 },
      { globalPercent: 91 },
    ]);
    mockDeleteWhere.mockResolvedValueOnce(undefined);
    mockOnConflictDoNothing.mockResolvedValueOnce(undefined);

    const { reevaluatePendingPromotionForCurrentLevel } = await import(
      "./reevaluate-pending-promotion"
    );

    await getDb().transaction(async (tx) => {
      await reevaluatePendingPromotionForCurrentLevel(
        tx,
        classId,
        studentId,
        "yellow"
      );
    });

    expect(mockDelete).toHaveBeenCalledOnce();
    expect(mockEq).toHaveBeenCalledWith(pendingPromotions.studentId, studentId);
    expect(mockValues).toHaveBeenCalledWith({
      studentId,
      targetLevel: "green",
    });
  });

  it("clears pending promotion when recent dictations do not qualify", async () => {
    mockLimit.mockResolvedValueOnce([
      { globalPercent: 90 },
      { globalPercent: 91 },
    ]);
    mockDeleteWhere.mockResolvedValueOnce(undefined);

    const { reevaluatePendingPromotionForCurrentLevel } = await import(
      "./reevaluate-pending-promotion"
    );

    await getDb().transaction(async (tx) => {
      await reevaluatePendingPromotionForCurrentLevel(
        tx,
        classId,
        studentId,
        "yellow"
      );
    });

    expect(mockDelete).toHaveBeenCalledOnce();
    expect(mockInsert).not.toHaveBeenCalled();
  });
});

describe("reevaluatePendingPromotionFromDictationHistory", () => {
  const classId = "660e8400-e29b-41d4-a716-446655440001";
  const studentId = "770e8400-e29b-41d4-a716-446655440002";

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("uses levelAtSave from the most recent dictation entry", async () => {
    mockLimit.mockResolvedValueOnce([
      { levelAtSave: "yellow", globalPercent: 96 },
      { levelAtSave: "yellow", globalPercent: 95 },
    ]);
    mockDeleteWhere.mockResolvedValueOnce(undefined);
    mockOnConflictDoNothing.mockResolvedValueOnce(undefined);

    const { reevaluatePendingPromotionFromDictationHistory } = await import(
      "./reevaluate-pending-promotion"
    );

    await getDb().transaction(async (tx) => {
      await reevaluatePendingPromotionFromDictationHistory(
        tx,
        classId,
        studentId
      );
    });

    expect(mockValues).toHaveBeenCalledWith({
      studentId,
      targetLevel: "green",
    });
  });

  it("clears pending promotion when fewer than two dictations exist", async () => {
    mockLimit.mockResolvedValueOnce([{ levelAtSave: "yellow", globalPercent: 96 }]);
    mockDeleteWhere.mockResolvedValueOnce(undefined);

    const { reevaluatePendingPromotionFromDictationHistory } = await import(
      "./reevaluate-pending-promotion"
    );

    await getDb().transaction(async (tx) => {
      await reevaluatePendingPromotionFromDictationHistory(
        tx,
        classId,
        studentId
      );
    });

    expect(mockDelete).toHaveBeenCalledOnce();
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
