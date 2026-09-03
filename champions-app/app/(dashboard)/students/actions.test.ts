import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
  mockOverrideStudentLevel,
  mockAuth,
  mockGetTeacherClass,
  mockCountActiveStudents,
  mockGetYearStartWizardStatus,
  mockValidateStudentPromotion,
  mockRefuseStudentPromotion,
} = vi.hoisted(() => ({
  redirect: vi.fn((url: string): never => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  revalidatePath: vi.fn(),
  mockAddStudent: vi.fn(),
  mockArchiveStudent: vi.fn(),
  mockAssignStudentLevel: vi.fn(),
  mockOverrideStudentLevel: vi.fn(),
  mockAuth: vi.fn(),
  mockGetTeacherClass: vi.fn(),
  mockCountActiveStudents: vi.fn(),
  mockGetYearStartWizardStatus: vi.fn(),
  mockValidateStudentPromotion: vi.fn(),
  mockRefuseStudentPromotion: vi.fn(),
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

vi.mock("@/lib/services/count-active-students", () => ({
  countActiveStudents: mockCountActiveStudents,
}));

vi.mock("@/lib/services/get-year-start-wizard-status", () => ({
  getYearStartWizardStatus: mockGetYearStartWizardStatus,
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

vi.mock("@/lib/services/override-student-level", () => {
  class OverrideStudentLevelError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "OverrideStudentLevelError";
    }
  }

  class StudentNotFoundForOverrideError extends OverrideStudentLevelError {
    constructor() {
      super("Élève introuvable.");
      this.name = "StudentNotFoundForOverrideError";
    }
  }

  class StudentNotLeveledForOverrideError extends OverrideStudentLevelError {
    constructor() {
      super("Le niveau n'est pas encore assigné.");
      this.name = "StudentNotLeveledForOverrideError";
    }
  }

  return {
    overrideStudentLevel: mockOverrideStudentLevel,
    OverrideStudentLevelError,
    StudentNotFoundForOverrideError,
    StudentNotLeveledForOverrideError,
    OVERRIDE_STUDENT_LEVEL_GENERIC_ERROR:
      "Modification impossible. Réessayez.",
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

vi.mock("@/lib/services/validate-student-promotion", () => {
  class StudentPromotionError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "StudentPromotionError";
    }
  }

  class PendingPromotionNotFoundError extends StudentPromotionError {
    constructor() {
      super("Aucune promotion en attente.");
      this.name = "PendingPromotionNotFoundError";
    }
  }

  return {
    validateStudentPromotion: mockValidateStudentPromotion,
    StudentPromotionError,
    PendingPromotionNotFoundError,
    PROMOTION_VALIDATE_GENERIC_ERROR: "Validation impossible. Réessayez.",
  };
});

vi.mock("@/lib/services/refuse-student-promotion", () => ({
  refuseStudentPromotion: mockRefuseStudentPromotion,
  PROMOTION_REFUSE_GENERIC_ERROR: "Refus impossible. Réessayez.",
}));

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

  beforeEach(() => {
    mockCountActiveStudents.mockResolvedValue(1);
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

  it("redirects to the year-start wizard after the first manual student add", async () => {
    mockAuthenticatedSession();
    mockCountActiveStudents.mockResolvedValueOnce(0);
    mockAddStudent.mockResolvedValueOnce({ displayName: "DUPONT Marie" });
    mockGetYearStartWizardStatus.mockResolvedValueOnce({
      completed: false,
      step: 1,
      activeStudentCount: 1,
      unassignedCount: 1,
      matrixRowCount: 0,
    });

    const { addStudentAction } = await import("./actions");
    const formData = new FormData();
    formData.set("display_name", "DUPONT Marie");

    await expect(
      addStudentAction({ error: null, success: null }, formData)
    ).rejects.toThrow("NEXT_REDIRECT:/onboarding/year-start?step=1");

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

describe("overrideStudentLevelAction", () => {
  const studentId = "770e8400-e29b-41d4-a716-446655440002";

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated users to login", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { overrideStudentLevelAction } = await import("./actions");

    await expect(
      overrideStudentLevelAction(
        { error: null, changed: false },
        new FormData()
      )
    ).rejects.toThrow("NEXT_REDIRECT:/login");
  });

  it("overrides a level and revalidates student sheet routes", async () => {
    mockAuthenticatedSession();
    mockOverrideStudentLevel.mockResolvedValueOnce({
      studentId,
      level: "green",
      changed: true,
    });

    const { overrideStudentLevelAction } = await import("./actions");
    const formData = new FormData();
    formData.set("student_id", studentId);
    formData.set("level", "green");

    const result = await overrideStudentLevelAction(
      { error: null, changed: false },
      formData
    );

    expect(result).toEqual({ error: null, changed: true });
    expect(mockOverrideStudentLevel).toHaveBeenCalledWith(
      classId,
      studentId,
      "green"
    );
    expect(revalidatePath).toHaveBeenCalledWith(`/students/${studentId}`);
    expect(revalidatePath).toHaveBeenCalledWith("/students", "layout");
    expect(revalidatePath).toHaveBeenCalledWith("/dictations");
  });

  it("returns not-found when student_id is missing", async () => {
    mockAuthenticatedSession();

    const { overrideStudentLevelAction } = await import("./actions");
    const formData = new FormData();
    formData.set("level", "green");

    const result = await overrideStudentLevelAction(
      { error: null, changed: false },
      formData
    );

    expect(result).toEqual({ error: "Élève introuvable.", changed: false });
    expect(mockOverrideStudentLevel).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("skips revalidation when the level is unchanged", async () => {
    mockAuthenticatedSession();
    mockOverrideStudentLevel.mockResolvedValueOnce({
      studentId,
      level: "yellow",
      changed: false,
    });

    const { overrideStudentLevelAction } = await import("./actions");
    const formData = new FormData();
    formData.set("student_id", studentId);
    formData.set("level", "yellow");

    const result = await overrideStudentLevelAction(
      { error: null, changed: false },
      formData
    );

    expect(result).toEqual({ error: null, changed: false });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns not-found errors from the override service", async () => {
    mockAuthenticatedSession();
    const { StudentNotFoundForOverrideError } = await import(
      "@/lib/services/override-student-level"
    );
    mockOverrideStudentLevel.mockRejectedValueOnce(
      new StudentNotFoundForOverrideError()
    );

    const { overrideStudentLevelAction } = await import("./actions");
    const formData = new FormData();
    formData.set("student_id", studentId);
    formData.set("level", "green");

    const result = await overrideStudentLevelAction(
      { error: null, changed: false },
      formData
    );

    expect(result.error).toBe("Élève introuvable.");
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("redirects users without a class to onboarding", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: teacherId, email: "t@example.com" },
    });
    mockGetTeacherClass.mockResolvedValueOnce(null);

    const { overrideStudentLevelAction } = await import("./actions");

    await expect(
      overrideStudentLevelAction(
        { error: null, changed: false },
        new FormData()
      )
    ).rejects.toThrow("NEXT_REDIRECT:/onboarding/class");
  });

  it("returns a generic French error for invalid levels", async () => {
    mockAuthenticatedSession();

    const { overrideStudentLevelAction } = await import("./actions");
    const formData = new FormData();
    formData.set("student_id", studentId);
    formData.set("level", "red");

    const result = await overrideStudentLevelAction(
      { error: null, changed: false },
      formData
    );

    expect(result.error).toBe("Modification impossible. Réessayez.");
    expect(mockOverrideStudentLevel).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns not-leveled errors from the override service", async () => {
    mockAuthenticatedSession();
    const { StudentNotLeveledForOverrideError } = await import(
      "@/lib/services/override-student-level"
    );
    mockOverrideStudentLevel.mockRejectedValueOnce(
      new StudentNotLeveledForOverrideError()
    );

    const { overrideStudentLevelAction } = await import("./actions");
    const formData = new FormData();
    formData.set("student_id", studentId);
    formData.set("level", "green");

    const result = await overrideStudentLevelAction(
      { error: null, changed: false },
      formData
    );

    expect(result.error).toBe("Le niveau n'est pas encore assigné.");
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns a generic French error for unexpected failures", async () => {
    mockAuthenticatedSession();
    mockOverrideStudentLevel.mockRejectedValueOnce(new Error("database down"));

    const { overrideStudentLevelAction } = await import("./actions");
    const formData = new FormData();
    formData.set("student_id", studentId);
    formData.set("level", "green");

    const result = await overrideStudentLevelAction(
      { error: null, changed: false },
      formData
    );

    expect(result.error).toBe("Modification impossible. Réessayez.");
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

describe("validateStudentPromotionAction", () => {
  const studentId = "770e8400-e29b-41d4-a716-446655440002";

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("redirects unauthenticated users to login", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { validateStudentPromotionAction } = await import("./actions");

    await expect(validateStudentPromotionAction(studentId)).rejects.toThrow(
      "NEXT_REDIRECT:/login"
    );
  });

  it("validates promotion and revalidates student sheet routes", async () => {
    mockAuthenticatedSession();
    mockValidateStudentPromotion.mockResolvedValueOnce({
      studentId,
      level: "green",
    });

    const { validateStudentPromotionAction } = await import("./actions");
    const result = await validateStudentPromotionAction(studentId);

    expect(result).toEqual({ error: null });
    expect(mockValidateStudentPromotion).toHaveBeenCalledWith(classId, studentId);
    expect(revalidatePath).toHaveBeenCalledWith(`/students/${studentId}`);
    expect(revalidatePath).toHaveBeenCalledWith("/students", "layout");
    expect(revalidatePath).toHaveBeenCalledWith("/dictations");
    expect(revalidatePath).toHaveBeenCalledWith("/alerts");
    expect(revalidatePath).toHaveBeenCalledWith("/alerts", "layout");
  });

  it("treats a missing pending promotion as idempotent success", async () => {
    mockAuthenticatedSession();
    const { PendingPromotionNotFoundError } = await import(
      "@/lib/services/validate-student-promotion"
    );
    mockValidateStudentPromotion.mockRejectedValueOnce(
      new PendingPromotionNotFoundError()
    );

    const { validateStudentPromotionAction } = await import("./actions");
    const result = await validateStudentPromotionAction(studentId);

    expect(result).toEqual({ error: null });
    expect(revalidatePath).toHaveBeenCalledWith(`/students/${studentId}`);
    expect(revalidatePath).toHaveBeenCalledWith("/students", "layout");
    expect(revalidatePath).toHaveBeenCalledWith("/dictations");
    expect(revalidatePath).toHaveBeenCalledWith("/alerts");
    expect(revalidatePath).toHaveBeenCalledWith("/alerts", "layout");
  });

  it("returns a generic error for blank student ids", async () => {
    mockAuthenticatedSession();
    const { PROMOTION_VALIDATE_GENERIC_ERROR } = await import(
      "@/lib/services/validate-student-promotion"
    );

    const { validateStudentPromotionAction } = await import("./actions");
    const result = await validateStudentPromotionAction("   ");

    expect(result.error).toBe(PROMOTION_VALIDATE_GENERIC_ERROR);
    expect(mockValidateStudentPromotion).not.toHaveBeenCalled();
  });

  it("trims padded student ids before validating", async () => {
    mockAuthenticatedSession();
    mockValidateStudentPromotion.mockResolvedValueOnce({
      studentId,
      level: "green",
    });

    const { validateStudentPromotionAction } = await import("./actions");
    const result = await validateStudentPromotionAction(`  ${studentId}  `);

    expect(result).toEqual({ error: null });
    expect(mockValidateStudentPromotion).toHaveBeenCalledWith(classId, studentId);
  });

  it("returns a generic error for other promotion failures", async () => {
    mockAuthenticatedSession();
    const { StudentPromotionError, PROMOTION_VALIDATE_GENERIC_ERROR } =
      await import("@/lib/services/validate-student-promotion");
    mockValidateStudentPromotion.mockRejectedValueOnce(
      new StudentPromotionError("Élève introuvable.")
    );

    const { validateStudentPromotionAction } = await import("./actions");
    const result = await validateStudentPromotionAction(studentId);

    expect(result.error).toBe(PROMOTION_VALIDATE_GENERIC_ERROR);
  });
});

describe("refuseStudentPromotionAction", () => {
  const studentId = "770e8400-e29b-41d4-a716-446655440002";

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("redirects unauthenticated users to login", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { refuseStudentPromotionAction } = await import("./actions");

    await expect(refuseStudentPromotionAction(studentId)).rejects.toThrow(
      "NEXT_REDIRECT:/login"
    );
  });

  it("refuses promotion and revalidates student sheet routes", async () => {
    mockAuthenticatedSession();
    mockRefuseStudentPromotion.mockResolvedValueOnce({ studentId });

    const { refuseStudentPromotionAction } = await import("./actions");
    const result = await refuseStudentPromotionAction(studentId);

    expect(result).toEqual({ error: null });
    expect(mockRefuseStudentPromotion).toHaveBeenCalledWith(classId, studentId);
    expect(revalidatePath).toHaveBeenCalledWith(`/students/${studentId}`);
    expect(revalidatePath).toHaveBeenCalledWith("/students", "layout");
    expect(revalidatePath).toHaveBeenCalledWith("/dictations");
    expect(revalidatePath).toHaveBeenCalledWith("/alerts");
    expect(revalidatePath).toHaveBeenCalledWith("/alerts", "layout");
  });

  it("treats a missing pending promotion as idempotent success", async () => {
    mockAuthenticatedSession();
    const { PendingPromotionNotFoundError } = await import(
      "@/lib/services/validate-student-promotion"
    );
    mockRefuseStudentPromotion.mockRejectedValueOnce(
      new PendingPromotionNotFoundError()
    );

    const { refuseStudentPromotionAction } = await import("./actions");
    const result = await refuseStudentPromotionAction(studentId);

    expect(result).toEqual({ error: null });
    expect(revalidatePath).toHaveBeenCalledWith(`/students/${studentId}`);
    expect(revalidatePath).toHaveBeenCalledWith("/students", "layout");
    expect(revalidatePath).toHaveBeenCalledWith("/dictations");
    expect(revalidatePath).toHaveBeenCalledWith("/alerts");
    expect(revalidatePath).toHaveBeenCalledWith("/alerts", "layout");
  });

  it("returns a generic error for blank student ids", async () => {
    mockAuthenticatedSession();
    const { PROMOTION_REFUSE_GENERIC_ERROR } = await import(
      "@/lib/services/refuse-student-promotion"
    );

    const { refuseStudentPromotionAction } = await import("./actions");
    const result = await refuseStudentPromotionAction("   ");

    expect(result.error).toBe(PROMOTION_REFUSE_GENERIC_ERROR);
    expect(mockRefuseStudentPromotion).not.toHaveBeenCalled();
  });

  it("trims padded student ids before refusing", async () => {
    mockAuthenticatedSession();
    mockRefuseStudentPromotion.mockResolvedValueOnce({ studentId });

    const { refuseStudentPromotionAction } = await import("./actions");
    const result = await refuseStudentPromotionAction(`  ${studentId}  `);

    expect(result).toEqual({ error: null });
    expect(mockRefuseStudentPromotion).toHaveBeenCalledWith(classId, studentId);
  });

  it("returns a generic error for other promotion failures", async () => {
    mockAuthenticatedSession();
    const { StudentPromotionError } = await import(
      "@/lib/services/validate-student-promotion"
    );
    const { PROMOTION_REFUSE_GENERIC_ERROR } = await import(
      "@/lib/services/refuse-student-promotion"
    );
    mockRefuseStudentPromotion.mockRejectedValueOnce(
      new StudentPromotionError("Élève introuvable.")
    );

    const { refuseStudentPromotionAction } = await import("./actions");
    const result = await refuseStudentPromotionAction(studentId);

    expect(result.error).toBe(PROMOTION_REFUSE_GENERIC_ERROR);
  });
});
