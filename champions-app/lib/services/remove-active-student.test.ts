import { afterEach, describe, expect, it, vi } from "vitest";

const mockLimit = vi.fn();
const mockWhere = vi.fn(() => ({ limit: mockLimit }));
const mockFrom = vi.fn(() => ({ where: mockWhere }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

const mockReturning = vi.fn();
const mockDeleteWhere = vi.fn(() => ({ returning: mockReturning }));
const mockDelete = vi.fn(() => ({ where: mockDeleteWhere }));

const getDb = vi.fn(() => ({
  select: mockSelect,
  delete: mockDelete,
}));

vi.mock("@/lib/db/index", () => ({
  getDb,
}));

describe("removeActiveStudent", () => {
  const classId = "660e8400-e29b-41d4-a716-446655440001";
  const studentId = "770e8400-e29b-41d4-a716-446655440002";

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("rejects removal when the student already has level history", async () => {
    mockLimit
      .mockResolvedValueOnce([{ yearStartWizardCompletedAt: null }])
      .mockResolvedValueOnce([{ id: studentId, level: null }])
      .mockResolvedValueOnce([{ id: "history-1" }]);

    const { removeActiveStudent, StudentRemovalBlockedError } = await import(
      "./remove-active-student"
    );

    await expect(removeActiveStudent(classId, studentId)).rejects.toBeInstanceOf(
      StudentRemovalBlockedError
    );

    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("removes the student when wizard is incomplete and there is no level history", async () => {
    mockLimit
      .mockResolvedValueOnce([{ yearStartWizardCompletedAt: null }])
      .mockResolvedValueOnce([{ id: studentId, level: null }])
      .mockResolvedValueOnce([]);
    mockReturning.mockResolvedValueOnce([{ id: studentId }]);

    const { removeActiveStudent } = await import("./remove-active-student");
    const result = await removeActiveStudent(classId, studentId);

    expect(result).toEqual({ studentId });
    expect(mockDelete).toHaveBeenCalledOnce();
  });

  it("rejects removal when the wizard is already complete", async () => {
    mockLimit.mockResolvedValueOnce([
      { yearStartWizardCompletedAt: new Date("2026-01-01T00:00:00.000Z") },
    ]);

    const { removeActiveStudent, StudentRemovalBlockedError } = await import(
      "./remove-active-student"
    );

    await expect(removeActiveStudent(classId, studentId)).rejects.toBeInstanceOf(
      StudentRemovalBlockedError
    );

    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("rejects removal when the student already has an assigned level", async () => {
    mockLimit
      .mockResolvedValueOnce([{ yearStartWizardCompletedAt: null }])
      .mockResolvedValueOnce([{ id: studentId, level: "green" }]);

    const { removeActiveStudent, StudentRemovalBlockedError } = await import(
      "./remove-active-student"
    );

    await expect(removeActiveStudent(classId, studentId)).rejects.toBeInstanceOf(
      StudentRemovalBlockedError
    );

    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("returns not-found when the student is outside the class roster", async () => {
    mockLimit
      .mockResolvedValueOnce([{ yearStartWizardCompletedAt: null }])
      .mockResolvedValueOnce([]);

    const { removeActiveStudent, StudentNotFoundError } = await import(
      "./remove-active-student"
    );

    await expect(removeActiveStudent(classId, studentId)).rejects.toBeInstanceOf(
      StudentNotFoundError
    );
  });
});
