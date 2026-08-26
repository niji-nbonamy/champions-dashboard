import { afterEach, describe, expect, it, vi } from "vitest";

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

const getDb = vi.fn(() => ({
  select: mockSelect,
  update: mockUpdate,
  insert: mockInsert,
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
    expect(mockSet).toHaveBeenCalledWith({ level: "green" });
    expect(mockValues).toHaveBeenCalledWith({
      studentId,
      level: "green",
      action: "assigned",
    });
  });

  it("rejects invalid levels", async () => {
    const { assignStudentLevel, AssignStudentLevelError } = await import(
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

    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("rejects students that already have a level", async () => {
    mockLimit.mockResolvedValueOnce([{ id: studentId, level: "yellow" }]);

    const { assignStudentLevel, StudentAlreadyAssignedError } = await import(
      "./assign-student-level"
    );

    await expect(
      assignStudentLevel(classId, studentId, "green")
    ).rejects.toBeInstanceOf(StudentAlreadyAssignedError);

    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("rejects when a concurrent assign wins the level update", async () => {
    mockLimit.mockResolvedValueOnce([{ id: studentId, level: null }]);
    mockReturning.mockResolvedValueOnce([]);

    const { assignStudentLevel, StudentAlreadyAssignedError } = await import(
      "./assign-student-level"
    );

    await expect(
      assignStudentLevel(classId, studentId, "green")
    ).rejects.toBeInstanceOf(StudentAlreadyAssignedError);

    expect(mockInsert).not.toHaveBeenCalled();
  });
});
