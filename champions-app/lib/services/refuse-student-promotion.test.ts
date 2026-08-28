import { afterEach, describe, expect, it, vi } from "vitest";

const mockLimit = vi.fn();
const mockWhereSelect = vi.fn(() => ({ limit: mockLimit }));
const mockInnerJoin = vi.fn(() => ({ where: mockWhereSelect }));
const mockFromSelect = vi.fn(() => ({ innerJoin: mockInnerJoin }));
const mockSelect = vi.fn(() => ({ from: mockFromSelect }));

const mockTransactionLimit = vi.fn();
const mockTransactionWhereSelect = vi.fn(() => ({
  limit: mockTransactionLimit,
}));
const mockTransactionFromSelect = vi.fn(() => ({
  where: mockTransactionWhereSelect,
}));
const mockTransactionSelect = vi.fn(() => ({ from: mockTransactionFromSelect }));

const mockReturningDelete = vi.fn();
const mockDeleteWhere = vi.fn(() => ({ returning: mockReturningDelete }));
const mockDelete = vi.fn(() => ({ where: mockDeleteWhere }));

const mockValues = vi.fn();
const mockInsert = vi.fn(() => ({ values: mockValues }));

const mockTransaction = vi.fn(
  async (callback: (tx: {
    select: typeof mockTransactionSelect;
    delete: typeof mockDelete;
    insert: typeof mockInsert;
  }) => Promise<unknown>) =>
    callback({
      select: mockTransactionSelect,
      delete: mockDelete,
      insert: mockInsert,
    })
);

const getDb = vi.fn(() => ({
  select: mockSelect,
  transaction: mockTransaction,
}));

vi.mock("@/lib/db/index", () => ({
  getDb,
}));

describe("refuseStudentPromotion", () => {
  const classId = "660e8400-e29b-41d4-a716-446655440001";
  const studentId = "770e8400-e29b-41d4-a716-446655440002";

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("records refusal and clears pending promotion without changing level", async () => {
    mockLimit.mockResolvedValueOnce([{ targetLevel: "green" }]);
    mockTransactionLimit.mockResolvedValueOnce([{ id: studentId }]);
    mockReturningDelete.mockResolvedValueOnce([{ id: "pending-id" }]);
    mockValues.mockResolvedValueOnce(undefined);

    const { refuseStudentPromotion } = await import("./refuse-student-promotion");
    const result = await refuseStudentPromotion(classId, studentId);

    expect(result).toEqual({ studentId });
    expect(mockValues).toHaveBeenCalledWith({
      studentId,
      level: "green",
      action: "refused",
    });
  });

  it("rejects when no pending promotion exists", async () => {
    mockLimit.mockResolvedValueOnce([]);

    const { refuseStudentPromotion } = await import("./refuse-student-promotion");
    const { PendingPromotionNotFoundError } = await import(
      "./validate-student-promotion"
    );

    await expect(
      refuseStudentPromotion(classId, studentId)
    ).rejects.toBeInstanceOf(PendingPromotionNotFoundError);
    expect(mockTransaction).not.toHaveBeenCalled();
  });
});
