import { afterEach, describe, expect, it, vi } from "vitest";

const mockLimit = vi.fn();
const mockWhereSelect = vi.fn(() => ({ limit: mockLimit }));
const mockInnerJoin = vi.fn(() => ({ where: mockWhereSelect }));
const mockFromSelect = vi.fn(() => ({ innerJoin: mockInnerJoin, where: mockWhereSelect }));
const mockSelect = vi.fn(() => ({ from: mockFromSelect }));

const mockReturningUpdate = vi.fn();
const mockUpdateWhere = vi.fn(() => ({ returning: mockReturningUpdate }));
const mockSet = vi.fn(() => ({ where: mockUpdateWhere }));
const mockUpdate = vi.fn(() => ({ set: mockSet }));

const mockReturningDelete = vi.fn();
const mockDeleteWhere = vi.fn(() => ({ returning: mockReturningDelete }));
const mockDelete = vi.fn(() => ({ where: mockDeleteWhere }));

const mockValues = vi.fn();
const mockInsert = vi.fn(() => ({ values: mockValues }));

const mockTransaction = vi.fn(
  async (callback: (tx: {
    select: typeof mockSelect;
    update: typeof mockUpdate;
    delete: typeof mockDelete;
    insert: typeof mockInsert;
  }) => Promise<unknown>) =>
    callback({
      select: mockSelect,
      update: mockUpdate,
      delete: mockDelete,
      insert: mockInsert,
    })
);

const getDb = vi.fn(() => ({
  transaction: mockTransaction,
}));

vi.mock("@/lib/db/index", () => ({
  getDb,
}));

describe("validateStudentPromotion", () => {
  const classId = "660e8400-e29b-41d4-a716-446655440001";
  const studentId = "770e8400-e29b-41d4-a716-446655440002";

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("promotes the student and clears pending promotion", async () => {
    mockLimit
      .mockResolvedValueOnce([{ targetLevel: "green" }])
      .mockResolvedValueOnce([{ level: "yellow" }]);
    mockReturningUpdate.mockResolvedValueOnce([{ id: studentId }]);
    mockReturningDelete.mockResolvedValueOnce([{ id: "pending-id" }]);
    mockValues.mockResolvedValueOnce(undefined);

    const { validateStudentPromotion } = await import(
      "./validate-student-promotion"
    );
    const result = await validateStudentPromotion(classId, studentId);

    expect(result).toEqual({ studentId, level: "green" });
    expect(mockSet).toHaveBeenCalledWith({ level: "green" });
    expect(mockValues).toHaveBeenCalledWith({
      studentId,
      level: "green",
      action: "promoted",
    });
  });

  it("rejects when no pending promotion exists", async () => {
    mockLimit.mockResolvedValueOnce([]);

    const { validateStudentPromotion, PendingPromotionNotFoundError } =
      await import("./validate-student-promotion");

    await expect(
      validateStudentPromotion(classId, studentId)
    ).rejects.toBeInstanceOf(PendingPromotionNotFoundError);
  });

  it("rejects when the student is outside the class scope", async () => {
    mockLimit.mockResolvedValueOnce([]);

    const { validateStudentPromotion, PendingPromotionNotFoundError } =
      await import("./validate-student-promotion");

    await expect(
      validateStudentPromotion("other-class-id", studentId)
    ).rejects.toBeInstanceOf(PendingPromotionNotFoundError);
  });

  it("rejects when pending target level does not match next level", async () => {
    mockLimit
      .mockResolvedValueOnce([{ targetLevel: "violet" }])
      .mockResolvedValueOnce([{ level: "yellow" }]);

    const { validateStudentPromotion, StudentPromotionError } = await import(
      "./validate-student-promotion"
    );

    await expect(
      validateStudentPromotion(classId, studentId)
    ).rejects.toBeInstanceOf(StudentPromotionError);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
