import { afterEach, describe, expect, it, vi } from "vitest";

import { students } from "@/lib/db/schema";

const mockLimit = vi.fn();
const mockWhereSelect = vi.fn(() => ({ limit: mockLimit }));
const mockFromSelect = vi.fn(() => ({ where: mockWhereSelect }));
const mockSelect = vi.fn(() => ({ from: mockFromSelect }));

const mockReturning = vi.fn();
const mockUpdateWhere = vi.fn(() => ({ returning: mockReturning }));
const mockSet = vi.fn(() => ({ where: mockUpdateWhere }));
const mockUpdate = vi.fn(() => ({ set: mockSet }));

const mockValues = vi.fn();
const mockInsert = vi.fn(() => ({ values: mockValues }));

const mockTransactionLimit = vi.fn();
const mockTransactionWhereSelect = vi.fn(() => ({
  limit: mockTransactionLimit,
}));
const mockTransactionFromSelect = vi.fn(() => ({
  where: mockTransactionWhereSelect,
}));
const mockTransactionSelect = vi.fn(() => ({ from: mockTransactionFromSelect }));

const mockTransaction = vi.fn(
  async (callback: (tx: {
    update: typeof mockUpdate;
    insert: typeof mockInsert;
    select: typeof mockTransactionSelect;
  }) => Promise<unknown>) =>
    callback({
      update: mockUpdate,
      insert: mockInsert,
      select: mockTransactionSelect,
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
  select: mockSelect,
  transaction: mockTransaction,
}));

vi.mock("@/lib/db/index", () => ({
  getDb,
}));

describe("assignStudentLevel", () => {
  const classId = "660e8400-e29b-41d4-a716-446655440001";
  const studentId = "770e8400-e29b-41d4-a716-446655440002";

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("assigns a level and records history for an unassigned student", async () => {
    mockLimit.mockResolvedValueOnce([{ id: studentId, level: null }]);
    mockReturning.mockResolvedValueOnce([{ id: studentId }]);
    mockValues.mockResolvedValueOnce(undefined);

    const { assignStudentLevel } = await import("./assign-student-level");
    const result = await assignStudentLevel(classId, studentId, "green");

    expect(result).toEqual({ studentId, level: "green" });
    expect(mockTransaction).toHaveBeenCalledOnce();
    expect(mockSet).toHaveBeenCalledWith({ level: "green" });
    expect(mockValues).toHaveBeenCalledWith({
      studentId,
      level: "green",
      action: "assigned",
    });
  });

  it("reassigns when the stored level is not a valid CHAMPIONS level", async () => {
    mockLimit.mockResolvedValueOnce([{ id: studentId, level: "red" }]);
    mockReturning.mockResolvedValueOnce([{ id: studentId }]);
    mockValues.mockResolvedValueOnce(undefined);

    const { assignStudentLevel } = await import("./assign-student-level");
    const result = await assignStudentLevel(classId, studentId, "green");

    expect(result).toEqual({ studentId, level: "green" });
    expect(mockSet).toHaveBeenCalledWith({ level: "green" });
  });

  it("rejects invalid levels", async () => {
    const { assignStudentLevel } = await import(
      "./assign-student-level"
    );

    await expect(
      assignStudentLevel(classId, studentId, "red")
    ).rejects.toMatchObject({
      name: "AssignStudentLevelError",
      message: "Assignation impossible. Réessayez.",
    });

    expect(mockSelect).not.toHaveBeenCalled();
  });

  it("rejects students that are not found in the class", async () => {
    mockLimit.mockResolvedValueOnce([]);

    const { assignStudentLevel, StudentNotFoundError } = await import(
      "./assign-student-level"
    );

    await expect(
      assignStudentLevel(classId, studentId, "yellow")
    ).rejects.toBeInstanceOf(StudentNotFoundError);

    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("filters archived students out of the assignment query", async () => {
    mockLimit.mockResolvedValueOnce([]);

    const { assignStudentLevel, StudentNotFoundError } = await import(
      "./assign-student-level"
    );

    await expect(
      assignStudentLevel(classId, studentId, "yellow")
    ).rejects.toBeInstanceOf(StudentNotFoundError);

    expect(mockEq).toHaveBeenCalledWith(students.archived, false);
  });

  it("rejects students that already have a level", async () => {
    mockLimit.mockResolvedValueOnce([{ id: studentId, level: "yellow" }]);

    const { assignStudentLevel, StudentAlreadyAssignedError } = await import(
      "./assign-student-level"
    );

    await expect(
      assignStudentLevel(classId, studentId, "green")
    ).rejects.toBeInstanceOf(StudentAlreadyAssignedError);

    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("rejects when a concurrent assign wins the level update", async () => {
    mockLimit.mockResolvedValueOnce([{ id: studentId, level: null }]);
    mockReturning.mockResolvedValueOnce([]);
    mockTransactionLimit.mockResolvedValueOnce([
      { id: studentId, level: "green" },
    ]);

    const { assignStudentLevel, StudentAlreadyAssignedError } = await import(
      "./assign-student-level"
    );

    await expect(
      assignStudentLevel(classId, studentId, "green")
    ).rejects.toBeInstanceOf(StudentAlreadyAssignedError);

    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns not-found when the student disappears before the update", async () => {
    mockLimit.mockResolvedValueOnce([{ id: studentId, level: null }]);
    mockReturning.mockResolvedValueOnce([]);
    mockTransactionLimit.mockResolvedValueOnce([]);

    const { assignStudentLevel, StudentNotFoundError } = await import(
      "./assign-student-level"
    );

    await expect(
      assignStudentLevel(classId, studentId, "green")
    ).rejects.toBeInstanceOf(StudentNotFoundError);

    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("propagates history insert failures inside the transaction", async () => {
    mockLimit.mockResolvedValueOnce([{ id: studentId, level: null }]);
    mockReturning.mockResolvedValueOnce([{ id: studentId }]);
    mockValues.mockRejectedValueOnce(new Error("insert failed"));

    const { assignStudentLevel } = await import("./assign-student-level");

    await expect(
      assignStudentLevel(classId, studentId, "green")
    ).rejects.toThrow("insert failed");
  });
});
