import { afterEach, describe, expect, it, vi } from "vitest";

import {
  STUDENT_ADD_SUCCESS_MESSAGE,
  STUDENT_DISPLAY_NAME_EMPTY_ERROR,
  STUDENT_DISPLAY_NAME_TOO_LONG_ERROR,
} from "@/lib/domain/student-display-name";

const {
  redirect,
  revalidatePath,
  mockAddStudent,
  mockAuth,
  mockGetTeacherClass,
} = vi.hoisted(() => ({
  redirect: vi.fn((url: string): never => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  revalidatePath: vi.fn(),
  mockAddStudent: vi.fn(),
  mockAuth: vi.fn(),
  mockGetTeacherClass: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect,
}));

vi.mock("next/cache", () => ({
  revalidatePath,
}));

vi.mock("next/dist/client/components/redirect-error", () => ({
  isRedirectError: (error: unknown) =>
    error instanceof Error && error.message.startsWith("NEXT_REDIRECT:"),
}));

vi.mock("@/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/services/get-teacher-class", () => ({
  getTeacherClass: mockGetTeacherClass,
}));

vi.mock("@/lib/services/add-student", () => {
  class AddStudentError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "AddStudentError";
    }
  }

  class StudentDuplicateError extends AddStudentError {
    constructor(existingName: string) {
      super(`Un élève avec ce nom existe déjà : ${existingName}.`);
      this.name = "StudentDuplicateError";
    }
  }

  return {
    addStudent: mockAddStudent,
    AddStudentError,
    StudentDuplicateError,
  };
});

const teacherId = "550e8400-e29b-41d4-a716-446655440000";
const classId = "660e8400-e29b-41d4-a716-446655440001";

function mockAuthenticatedSession() {
  mockAuth.mockResolvedValueOnce({
    user: { id: teacherId, email: "t@example.com" },
  });
  mockGetTeacherClass.mockResolvedValueOnce({
    id: classId,
    teacherId,
    schoolYearLabel: "2025-2026",
  });
}

describe("addStudentAction", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated users to login", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { addStudentAction } = await import("./actions");

    await expect(
      addStudentAction({ error: null, success: null }, new FormData())
    ).rejects.toThrow("NEXT_REDIRECT:/login");
  });

  it("redirects users without a class to onboarding", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: teacherId, email: "t@example.com" },
    });
    mockGetTeacherClass.mockResolvedValueOnce(null);

    const { addStudentAction } = await import("./actions");

    await expect(
      addStudentAction({ error: null, success: null }, new FormData())
    ).rejects.toThrow("NEXT_REDIRECT:/onboarding/class");
  });

  it("returns a French success message after adding a student", async () => {
    mockAuthenticatedSession();
    mockAddStudent.mockResolvedValueOnce({ displayName: "DUPONT Marie" });

    const { addStudentAction } = await import("./actions");
    const formData = new FormData();
    formData.set("display_name", "DUPONT Marie");

    const result = await addStudentAction(
      { error: null, success: null },
      formData
    );

    expect(result).toEqual({
      error: null,
      success: STUDENT_ADD_SUCCESS_MESSAGE,
    });
    expect(mockAddStudent).toHaveBeenCalledWith(classId, "DUPONT Marie");
    expect(revalidatePath).toHaveBeenCalledWith("/students");
    expect(revalidatePath).toHaveBeenCalledWith("/config");
  });

  it("returns duplicate errors from the add service", async () => {
    mockAuthenticatedSession();
    const { StudentDuplicateError } = await import("@/lib/services/add-student");
    mockAddStudent.mockRejectedValueOnce(
      new StudentDuplicateError("DUPONT Marie")
    );

    const { addStudentAction } = await import("./actions");
    const formData = new FormData();
    formData.set("display_name", "dupont marie");

    const result = await addStudentAction(
      { error: null, success: null },
      formData
    );

    expect(result.error).toBe(
      "Un élève avec ce nom existe déjà : DUPONT Marie."
    );
  });

  it("returns too-long name errors from the add service", async () => {
    mockAuthenticatedSession();
    const { AddStudentError } = await import("@/lib/services/add-student");
    mockAddStudent.mockRejectedValueOnce(
      new AddStudentError(STUDENT_DISPLAY_NAME_TOO_LONG_ERROR)
    );

    const { addStudentAction } = await import("./actions");
    const formData = new FormData();
    formData.set("display_name", "A".repeat(201));

    const result = await addStudentAction(
      { error: null, success: null },
      formData
    );

    expect(result.error).toBe(STUDENT_DISPLAY_NAME_TOO_LONG_ERROR);
  });

  it("returns validation errors from the add service", async () => {
    mockAuthenticatedSession();
    const { AddStudentError } = await import("@/lib/services/add-student");
    mockAddStudent.mockRejectedValueOnce(
      new AddStudentError(STUDENT_DISPLAY_NAME_EMPTY_ERROR)
    );

    const { addStudentAction } = await import("./actions");
    const formData = new FormData();
    formData.set("display_name", "   ");

    const result = await addStudentAction(
      { error: null, success: null },
      formData
    );

    expect(result.error).toBe(STUDENT_DISPLAY_NAME_EMPTY_ERROR);
  });

  it("returns a generic French error for unexpected failures", async () => {
    mockAuthenticatedSession();
    mockAddStudent.mockRejectedValueOnce(new Error("database down"));

    const { addStudentAction } = await import("./actions");
    const formData = new FormData();
    formData.set("display_name", "DUPONT Marie");

    const result = await addStudentAction(
      { error: null, success: null },
      formData
    );

    expect(result.error).toBe("Ajout impossible. Réessayez.");
  });
});
