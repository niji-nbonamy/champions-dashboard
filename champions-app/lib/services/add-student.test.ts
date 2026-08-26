import { afterEach, describe, expect, it, vi } from "vitest";

import {
  STUDENT_DISPLAY_NAME_EMPTY_ERROR,
  STUDENT_DISPLAY_NAME_TOO_LONG_ERROR,
} from "@/lib/domain/student-display-name";

const mockValues = vi.fn();
const mockInsert = vi.fn(() => ({ values: mockValues }));

const getDb = vi.fn(() => ({
  insert: mockInsert,
}));

const mockListActiveStudents = vi.fn();

vi.mock("@/lib/db/index", () => ({
  getDb,
}));

vi.mock("./list-active-students", () => ({
  listActiveStudents: mockListActiveStudents,
}));

describe("addStudent", () => {
  const classId = "660e8400-e29b-41d4-a716-446655440001";

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("inserts a student when the name is valid and unique", async () => {
    mockListActiveStudents.mockResolvedValueOnce([]);
    mockValues.mockResolvedValueOnce(undefined);

    const { addStudent } = await import("./add-student");
    const result = await addStudent(classId, "  DUPONT Marie  ");

    expect(result).toEqual({ displayName: "DUPONT Marie" });
    expect(mockValues).toHaveBeenCalledWith({
      classId,
      displayName: "DUPONT Marie",
      archived: false,
    });
  });

  it("rejects duplicate names case-insensitively", async () => {
    mockListActiveStudents.mockResolvedValueOnce([
      {
        id: "770e8400-e29b-41d4-a716-446655440002",
        displayName: "DUPONT Marie",
        level: null,
      },
    ]);

    const { addStudent, StudentDuplicateError } = await import("./add-student");

    await expect(addStudent(classId, "dupont marie")).rejects.toMatchObject({
      name: "StudentDuplicateError",
      message: "Un élève avec ce nom existe déjà : DUPONT Marie.",
    });

    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("rejects empty names", async () => {
    const { addStudent, AddStudentError } = await import("./add-student");

    await expect(addStudent(classId, "   ")).rejects.toMatchObject({
      name: "AddStudentError",
      message: STUDENT_DISPLAY_NAME_EMPTY_ERROR,
    });

    expect(mockListActiveStudents).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("rejects names longer than the max length", async () => {
    const { addStudent, AddStudentError } = await import("./add-student");
    const longName = "A".repeat(201);

    await expect(addStudent(classId, longName)).rejects.toMatchObject({
      name: "AddStudentError",
      message: STUDENT_DISPLAY_NAME_TOO_LONG_ERROR,
    });

    expect(mockListActiveStudents).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
