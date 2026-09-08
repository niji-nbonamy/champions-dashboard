import { afterEach, describe, expect, it, vi } from "vitest";

import { STUDENT_DISPLAY_NAME_EMPTY_ERROR } from "@/lib/domain/student-display-name";
import { students } from "@/lib/db/schema";

const mockEq = vi.fn((left, right) => ({ left, right }));

const mockLimit = vi.fn();
const mockWhere = vi.fn(() => ({ limit: mockLimit }));
const mockFrom = vi.fn(() => ({ where: mockWhere }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

const mockUpdateSet = vi.fn();
const mockUpdateWhere = vi.fn();
const mockUpdateReturning = vi.fn();
const mockUpdate = vi.fn(() => ({
  set: mockUpdateSet.mockReturnValue({
    where: mockUpdateWhere.mockReturnValue({
      returning: mockUpdateReturning,
    }),
  }),
}));

const mockListActiveStudents = vi.fn();

const getDb = vi.fn(() => ({
  select: mockSelect,
  update: mockUpdate,
}));

vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    eq: mockEq,
    and: (...conditions: unknown[]) => conditions,
  };
});

vi.mock("@/lib/db/index", () => ({
  getDb,
}));

vi.mock("./list-active-students", () => ({
  listActiveStudents: mockListActiveStudents,
}));

describe("updateStudentDisplayName", () => {
  const classId = "660e8400-e29b-41d4-a716-446655440001";
  const studentId = "770e8400-e29b-41d4-a716-446655440002";
  const otherStudentId = "880e8400-e29b-41d4-a716-446655440003";

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("updates the display name when it changes", async () => {
    mockLimit.mockResolvedValueOnce([
      {
        id: studentId,
        displayName: "DUPONT Marie",
        archived: false,
      },
    ]);
    mockListActiveStudents.mockResolvedValueOnce([
      {
        id: studentId,
        displayName: "DUPONT Marie",
        level: "yellow",
        hasSpeechTherapy: false,
      },
    ]);
    mockUpdateReturning.mockResolvedValueOnce([
      {
        id: studentId,
        displayName: "DUPONT Marie-Claire",
      },
    ]);

    const { updateStudentDisplayName } = await import(
      "./update-student-display-name"
    );
    const result = await updateStudentDisplayName(
      classId,
      studentId,
      "DUPONT Marie-Claire"
    );

    expect(result).toEqual({
      studentId,
      displayName: "DUPONT Marie-Claire",
      changed: true,
    });
    expect(mockUpdateSet).toHaveBeenCalledWith({
      displayName: "DUPONT Marie-Claire",
    });
    expect(mockEq).toHaveBeenCalledWith(students.archived, false);
  });

  it("returns changed false when the name is unchanged", async () => {
    mockLimit.mockResolvedValueOnce([
      {
        id: studentId,
        displayName: "DUPONT Marie",
        archived: false,
      },
    ]);

    const { updateStudentDisplayName } = await import(
      "./update-student-display-name"
    );
    const result = await updateStudentDisplayName(
      classId,
      studentId,
      "DUPONT Marie"
    );

    expect(result).toEqual({
      studentId,
      displayName: "DUPONT Marie",
      changed: false,
    });
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockListActiveStudents).not.toHaveBeenCalled();
  });

  it("rejects empty names", async () => {
    const { updateStudentDisplayName, UpdateStudentDisplayNameError } =
      await import("./update-student-display-name");

    await expect(
      updateStudentDisplayName(classId, studentId, "   ")
    ).rejects.toMatchObject({
      message: STUDENT_DISPLAY_NAME_EMPTY_ERROR,
      name: "UpdateStudentDisplayNameError",
    });
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it("rejects duplicate names among active students", async () => {
    mockLimit.mockResolvedValueOnce([
      {
        id: studentId,
        displayName: "DUPONT Marie",
        archived: false,
      },
    ]);
    mockListActiveStudents.mockResolvedValueOnce([
      {
        id: studentId,
        displayName: "DUPONT Marie",
        level: "yellow",
        hasSpeechTherapy: false,
      },
      {
        id: otherStudentId,
        displayName: "MARTIN Paul",
        level: "green",
        hasSpeechTherapy: false,
      },
    ]);

    const { updateStudentDisplayName, StudentDuplicateError } = await import(
      "./update-student-display-name"
    );

    await expect(
      updateStudentDisplayName(classId, studentId, "martin paul")
    ).rejects.toBeInstanceOf(StudentDuplicateError);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects archived students", async () => {
    mockLimit.mockResolvedValueOnce([
      {
        id: studentId,
        displayName: "DUPONT Marie",
        archived: true,
      },
    ]);

    const { updateStudentDisplayName, StudentArchivedError } = await import(
      "./update-student-display-name"
    );

    await expect(
      updateStudentDisplayName(classId, studentId, "DUPONT Marie-Claire")
    ).rejects.toBeInstanceOf(StudentArchivedError);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects unknown students", async () => {
    mockLimit.mockResolvedValueOnce([]);

    const { updateStudentDisplayName, StudentNotFoundError } = await import(
      "./update-student-display-name"
    );

    await expect(
      updateStudentDisplayName(classId, studentId, "DUPONT Marie-Claire")
    ).rejects.toBeInstanceOf(StudentNotFoundError);
  });
});
