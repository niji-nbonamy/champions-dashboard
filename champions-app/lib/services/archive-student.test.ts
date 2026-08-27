import { afterEach, describe, expect, it, vi } from "vitest";

const mockLimit = vi.fn();
const mockWhere = vi.fn(() => ({ limit: mockLimit }));
const mockFrom = vi.fn(() => ({ where: mockWhere }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

const mockReturning = vi.fn();
const mockUpdateWhere = vi.fn(() => ({ returning: mockReturning }));
const mockSet = vi.fn(() => ({ where: mockUpdateWhere }));
const mockUpdate = vi.fn(() => ({ set: mockSet }));

const getDb = vi.fn(() => ({
  select: mockSelect,
  update: mockUpdate,
}));

vi.mock("@/lib/db/index", () => ({
  getDb,
}));

describe("archiveStudent", () => {
  const classId = "660e8400-e29b-41d4-a716-446655440001";
  const studentId = "770e8400-e29b-41d4-a716-446655440002";

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("archives an active student in the class", async () => {
    mockLimit.mockResolvedValueOnce([{ id: studentId, archived: false }]);
    mockReturning.mockResolvedValueOnce([{ id: studentId }]);

    const { archiveStudent } = await import("./archive-student");
    const result = await archiveStudent(classId, studentId);

    expect(result).toEqual({ studentId });
    expect(mockUpdate).toHaveBeenCalledOnce();
    expect(mockSet).toHaveBeenCalledWith({ archived: true });
  });

  it("returns not-found when the student is outside the class", async () => {
    mockLimit.mockResolvedValueOnce([]);

    const { archiveStudent, StudentNotFoundError } = await import(
      "./archive-student"
    );

    await expect(archiveStudent(classId, studentId)).rejects.toBeInstanceOf(
      StudentNotFoundError
    );
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns not-found when the student is already archived", async () => {
    mockLimit.mockResolvedValueOnce([{ id: studentId, archived: true }]);

    const { archiveStudent, StudentNotFoundError } = await import(
      "./archive-student"
    );

    await expect(archiveStudent(classId, studentId)).rejects.toBeInstanceOf(
      StudentNotFoundError
    );
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns not-found when the update race loses to another archive", async () => {
    mockLimit.mockResolvedValueOnce([{ id: studentId, archived: false }]);
    mockReturning.mockResolvedValueOnce([]);

    const { archiveStudent, StudentNotFoundError } = await import(
      "./archive-student"
    );

    await expect(archiveStudent(classId, studentId)).rejects.toBeInstanceOf(
      StudentNotFoundError
    );
  });
});
