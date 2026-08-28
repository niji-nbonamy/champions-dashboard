import { afterEach, describe, expect, it, vi } from "vitest";

import { students } from "@/lib/db/schema";

const mockLimit = vi.fn();
const mockWhereSelect = vi.fn(() => ({ limit: mockLimit }));
const mockFromSelect = vi.fn(() => ({ where: mockWhereSelect }));
const mockSelect = vi.fn(() => ({ from: mockFromSelect }));

const mockReturningUpdate = vi.fn();
const mockUpdateWhere = vi.fn(() => ({ returning: mockReturningUpdate }));
const mockSet = vi.fn(() => ({ where: mockUpdateWhere }));
const mockUpdate = vi.fn(() => ({ set: mockSet }));

const mockDeleteWhere = vi.fn();
const mockDelete = vi.fn(() => ({ where: mockDeleteWhere }));

const mockValues = vi.fn();
const mockInsert = vi.fn(() => ({ values: mockValues }));

const mockTransaction = vi.fn(
  async (callback: (tx: {
    update: typeof mockUpdate;
    delete: typeof mockDelete;
    insert: typeof mockInsert;
  }) => Promise<unknown>) =>
    callback({
      update: mockUpdate,
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
  select: mockSelect,
  transaction: mockTransaction,
}));

vi.mock("@/lib/db/index", () => ({
  getDb,
}));

describe("overrideStudentLevel", () => {
  const classId = "660e8400-e29b-41d4-a716-446655440001";
  const studentId = "770e8400-e29b-41d4-a716-446655440002";

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("overrides the level, clears pending promotion, and records manual history", async () => {
    mockLimit.mockResolvedValueOnce([{ id: studentId, level: "yellow" }]);
    mockReturningUpdate.mockResolvedValueOnce([{ id: studentId }]);
    mockDeleteWhere.mockResolvedValueOnce(undefined);
    mockValues.mockResolvedValueOnce(undefined);

    const { overrideStudentLevel } = await import("./override-student-level");
    const result = await overrideStudentLevel(classId, studentId, "green");

    expect(result).toEqual({
      studentId,
      level: "green",
      changed: true,
    });
    expect(mockTransaction).toHaveBeenCalledOnce();
    expect(mockSet).toHaveBeenCalledWith({ level: "green" });
    expect(mockDelete).toHaveBeenCalledOnce();
    expect(mockValues).toHaveBeenCalledWith({
      studentId,
      level: "green",
      action: "manual",
    });
  });

  it("returns unchanged when the target level matches the current level", async () => {
    mockLimit.mockResolvedValueOnce([{ id: studentId, level: "yellow" }]);

    const { overrideStudentLevel } = await import("./override-student-level");
    const result = await overrideStudentLevel(classId, studentId, "yellow");

    expect(result).toEqual({
      studentId,
      level: "yellow",
      changed: false,
    });
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("rejects invalid levels", async () => {
    const { overrideStudentLevel, OverrideStudentLevelError } = await import(
      "./override-student-level"
    );

    await expect(
      overrideStudentLevel(classId, studentId, "red")
    ).rejects.toBeInstanceOf(OverrideStudentLevelError);

    expect(mockSelect).not.toHaveBeenCalled();
  });

  it("rejects students that are not found in the class", async () => {
    mockLimit.mockResolvedValueOnce([]);

    const { overrideStudentLevel, StudentNotFoundForOverrideError } =
      await import("./override-student-level");

    await expect(
      overrideStudentLevel(classId, studentId, "green")
    ).rejects.toBeInstanceOf(StudentNotFoundForOverrideError);

    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("filters archived students out of the override query", async () => {
    mockLimit.mockResolvedValueOnce([]);

    const { overrideStudentLevel, StudentNotFoundForOverrideError } =
      await import("./override-student-level");

    await expect(
      overrideStudentLevel(classId, studentId, "green")
    ).rejects.toBeInstanceOf(StudentNotFoundForOverrideError);

    expect(mockEq).toHaveBeenCalledWith(students.archived, false);
  });

  it("rejects students without an assigned level", async () => {
    mockLimit.mockResolvedValueOnce([{ id: studentId, level: null }]);

    const { overrideStudentLevel, StudentNotLeveledForOverrideError } =
      await import("./override-student-level");

    await expect(
      overrideStudentLevel(classId, studentId, "green")
    ).rejects.toBeInstanceOf(StudentNotLeveledForOverrideError);

    expect(mockTransaction).not.toHaveBeenCalled();
  });
});
