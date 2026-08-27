import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ASSIGN_STUDENT_LEVEL_GENERIC_ERROR,
} from "@/lib/domain/champions-level";
import {
  STUDENT_ADD_SUCCESS_MESSAGE,
  STUDENT_ARCHIVE_GENERIC_ERROR,
  STUDENT_ARCHIVE_NOT_FOUND_ERROR,
  STUDENT_DISPLAY_NAME_EMPTY_ERROR,
  STUDENT_DISPLAY_NAME_TOO_LONG_ERROR,
} from "@/lib/domain/student-display-name";

const {
  redirect,
  revalidatePath,
  mockAddStudent,
  mockArchiveStudent,
  mockAssignStudentLevel,
  mockAuth,
  mockGetTeacherClass,
} = vi.hoisted(() => ({
  redirect: vi.fn((url: string): never => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  revalidatePath: vi.fn(),
  mockAddStudent: vi.fn(),
  mockArchiveStudent: vi.fn(),
  mockAssignStudentLevel: vi.fn(),
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

vi.mock("@/lib/services/assign-student-level", () => {
  class AssignStudentLevelError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "AssignStudentLevelError";
    }
  }

  class StudentNotFoundError extends AssignStudentLevelError {
    constructor() {
      super("Élève introuvable.");
      this.name = "StudentNotFoundError";
    }
  }

  class StudentAlreadyAssignedError extends AssignStudentLevelError {
    constructor() {
      super("Le niveau est déjà assigné.");
      this.name = "StudentAlreadyAssignedError";
    }
  }

  return {
    assignStudentLevel: mockAssignStudentLevel,
    AssignStudentLevelError,
    StudentNotFoundError,
    StudentAlreadyAssignedError,
  };
});

vi.mock("@/lib/services/archive-student", () => {
  class ArchiveStudentError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "ArchiveStudentError";
    }
  }

  class StudentNotFoundError extends ArchiveStudentError {
    constructor() {
      super("Élève introuvable.");
      this.name = "StudentNotFoundError";
    }
  }

  return {
    archiveStudent: mockArchiveStudent,
    ArchiveStudentError,
    StudentNotFoundError,
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
    expect(revalidatePath).toHaveBeenCalledWith("/onboarding/year-start");
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
    expect(revalidatePath).not.toHaveBeenCalled();
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
    expect(revalidatePath).not.toHaveBeenCalled();
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
    expect(revalidatePath).not.toHaveBeenCalled();
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
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("assignStudentLevelAction", () => {
  const studentId = "770e8400-e29b-41d4-a716-446655440002";

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated users to login", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { assignStudentLevelAction } = await import("./actions");

    await expect(
      assignStudentLevelAction({ error: null }, new FormData())
    ).rejects.toThrow("NEXT_REDIRECT:/login");
  });

  it("redirects users without a class to onboarding", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: teacherId, email: "t@example.com" },
    });
    mockGetTeacherClass.mockResolvedValueOnce(null);

    const { assignStudentLevelAction } = await import("./actions");

    await expect(
      assignStudentLevelAction({ error: null }, new FormData())
    ).rejects.toThrow("NEXT_REDIRECT:/onboarding/class");
  });

  it("assigns a level and revalidates the students page", async () => {
    mockAuthenticatedSession();
    mockAssignStudentLevel.mockResolvedValueOnce({
      studentId,
      level: "green",
    });

    const { assignStudentLevelAction } = await import("./actions");
    const formData = new FormData();
    formData.set("student_id", studentId);
    formData.set("level", "green");

    const result = await assignStudentLevelAction({ error: null }, formData);

    expect(result).toEqual({ error: null });
    expect(mockAssignStudentLevel).toHaveBeenCalledWith(
      classId,
      studentId,
      "green"
    );
    expect(revalidatePath).toHaveBeenCalledWith("/students", "layout");
    expect(revalidatePath).toHaveBeenCalledWith("/onboarding/year-start");
    expect(revalidatePath).toHaveBeenCalledWith("/dictations");
  });

  it("returns not-found errors from the assign service", async () => {
    mockAuthenticatedSession();
    const { StudentNotFoundError } = await import(
      "@/lib/services/assign-student-level"
    );
    mockAssignStudentLevel.mockRejectedValueOnce(new StudentNotFoundError());

    const { assignStudentLevelAction } = await import("./actions");
    const formData = new FormData();
    formData.set("student_id", studentId);
    formData.set("level", "yellow");

    const result = await assignStudentLevelAction({ error: null }, formData);

    expect(result.error).toBe("Élève introuvable.");
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns already-assigned errors from the assign service", async () => {
    mockAuthenticatedSession();
    const { StudentAlreadyAssignedError } = await import(
      "@/lib/services/assign-student-level"
    );
    mockAssignStudentLevel.mockRejectedValueOnce(
      new StudentAlreadyAssignedError()
    );

    const { assignStudentLevelAction } = await import("./actions");
    const formData = new FormData();
    formData.set("student_id", studentId);
    formData.set("level", "yellow");

    const result = await assignStudentLevelAction({ error: null }, formData);

    expect(result.error).toBe("Le niveau est déjà assigné.");
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns a generic French error for invalid levels", async () => {
    mockAuthenticatedSession();

    const { assignStudentLevelAction } = await import("./actions");
    const formData = new FormData();
    formData.set("student_id", studentId);
    formData.set("level", "red");

    const result = await assignStudentLevelAction({ error: null }, formData);

    expect(result.error).toBe(ASSIGN_STUDENT_LEVEL_GENERIC_ERROR);
    expect(mockAssignStudentLevel).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns a generic French error for unexpected failures", async () => {
    mockAuthenticatedSession();
    mockAssignStudentLevel.mockRejectedValueOnce(new Error("database down"));

    const { assignStudentLevelAction } = await import("./actions");
    const formData = new FormData();
    formData.set("student_id", studentId);
    formData.set("level", "yellow");

    const result = await assignStudentLevelAction({ error: null }, formData);

    expect(result.error).toBe(ASSIGN_STUDENT_LEVEL_GENERIC_ERROR);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("archiveStudentAction", () => {
  const studentId = "770e8400-e29b-41d4-a716-446655440002";

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated users to login", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { archiveStudentAction } = await import("./actions");

    await expect(
      archiveStudentAction({ error: null }, new FormData())
    ).rejects.toThrow("NEXT_REDIRECT:/login");
  });

  it("redirects users without a class to onboarding", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: teacherId, email: "t@example.com" },
    });
    mockGetTeacherClass.mockResolvedValueOnce(null);

    const { archiveStudentAction } = await import("./actions");

    await expect(
      archiveStudentAction({ error: null }, new FormData())
    ).rejects.toThrow("NEXT_REDIRECT:/onboarding/class");
  });

  it("archives a student, revalidates paths, and redirects with notice", async () => {
    mockAuthenticatedSession();
    mockArchiveStudent.mockResolvedValueOnce({ studentId });

    const { archiveStudentAction } = await import("./actions");
    const formData = new FormData();
    formData.set("student_id", studentId);
    formData.set("filter", "active");

    await expect(
      archiveStudentAction({ error: null }, formData)
    ).rejects.toThrow("NEXT_REDIRECT:/students?notice=archived");

    expect(mockArchiveStudent).toHaveBeenCalledWith(classId, studentId);
    expect(revalidatePath).toHaveBeenCalledWith("/students", "layout");
    expect(revalidatePath).toHaveBeenCalledWith("/students");
    expect(revalidatePath).toHaveBeenCalledWith("/dictations");
    expect(revalidatePath).toHaveBeenCalledWith("/config");
    expect(revalidatePath).toHaveBeenCalledWith("/onboarding/year-start");
  });

  it("preserves the archived filter in the redirect", async () => {
    mockAuthenticatedSession();
    mockArchiveStudent.mockResolvedValueOnce({ studentId });

    const { archiveStudentAction } = await import("./actions");
    const formData = new FormData();
    formData.set("student_id", studentId);
    formData.set("filter", "all");

    await expect(
      archiveStudentAction({ error: null }, formData)
    ).rejects.toThrow("NEXT_REDIRECT:/students?filter=all&notice=archived");
  });

  it("preserves the archived-only filter in the redirect", async () => {
    mockAuthenticatedSession();
    mockArchiveStudent.mockResolvedValueOnce({ studentId });

    const { archiveStudentAction } = await import("./actions");
    const formData = new FormData();
    formData.set("student_id", studentId);
    formData.set("filter", "archived");

    await expect(
      archiveStudentAction({ error: null }, formData)
    ).rejects.toThrow(
      "NEXT_REDIRECT:/students?filter=archived&notice=archived"
    );
  });

  it("returns not-found when student_id is missing", async () => {
    mockAuthenticatedSession();

    const { archiveStudentAction } = await import("./actions");
    const formData = new FormData();

    const result = await archiveStudentAction({ error: null }, formData);

    expect(result.error).toBe(STUDENT_ARCHIVE_NOT_FOUND_ERROR);
    expect(mockArchiveStudent).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns not-found errors from the archive service", async () => {
    mockAuthenticatedSession();
    const { StudentNotFoundError } = await import(
      "@/lib/services/archive-student"
    );
    mockArchiveStudent.mockRejectedValueOnce(new StudentNotFoundError());

    const { archiveStudentAction } = await import("./actions");
    const formData = new FormData();
    formData.set("student_id", studentId);

    const result = await archiveStudentAction({ error: null }, formData);

    expect(result.error).toBe(STUDENT_ARCHIVE_NOT_FOUND_ERROR);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns a generic French error for unexpected failures", async () => {
    mockAuthenticatedSession();
    mockArchiveStudent.mockRejectedValueOnce(new Error("database down"));

    const { archiveStudentAction } = await import("./actions");
    const formData = new FormData();
    formData.set("student_id", studentId);

    const result = await archiveStudentAction({ error: null }, formData);

    expect(result.error).toBe(STUDENT_ARCHIVE_GENERIC_ERROR);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
