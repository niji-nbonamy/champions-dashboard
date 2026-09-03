import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DICTATION_DATE_INVALID_ERROR,
} from "@/lib/domain/dictation";
import {
  DICTATION_LABEL_REQUIRED_ERROR,
  DICTATION_LABEL_TOO_LONG_ERROR,
} from "@/lib/domain/word-count-matrix";
import { UNLEVELED_STUDENTS_MESSAGE } from "@/lib/domain/dictation-readiness";

const {
  redirect,
  revalidatePath,
  mockAuth,
  mockGetTeacherClass,
  mockGetYearStartWizardStatus,
  mockCreateDictation,
  mockValidateStudentPromotion,
  mockRefuseStudentPromotion,
  mockSaveDictation,
  mockSaveDictationStudentEntry,
  mockUpdateDictation,
  mockGetDictationEntriesByDictationId,
  mockRevalidateDictationMetadataPaths,
} = vi.hoisted(() => ({
  redirect: vi.fn((url: string): never => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  revalidatePath: vi.fn(),
  mockAuth: vi.fn(),
  mockGetTeacherClass: vi.fn(),
  mockGetYearStartWizardStatus: vi.fn(),
  mockCreateDictation: vi.fn(),
  mockValidateStudentPromotion: vi.fn(),
  mockRefuseStudentPromotion: vi.fn(),
  mockSaveDictation: vi.fn(),
  mockSaveDictationStudentEntry: vi.fn(),
  mockUpdateDictation: vi.fn(),
  mockGetDictationEntriesByDictationId: vi.fn(),
  mockRevalidateDictationMetadataPaths: vi.fn(),
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

vi.mock("@/lib/services/get-year-start-wizard-status", () => ({
  getYearStartWizardStatus: mockGetYearStartWizardStatus,
}));

vi.mock("@/lib/services/create-dictation", async () => {
  const actual = await vi.importActual<typeof import("@/lib/services/create-dictation")>(
    "@/lib/services/create-dictation"
  );
  return {
    ...actual,
    createDictation: mockCreateDictation,
  };
});

vi.mock("@/lib/services/validate-student-promotion", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/services/validate-student-promotion")
  >("@/lib/services/validate-student-promotion");
  return {
    ...actual,
    validateStudentPromotion: mockValidateStudentPromotion,
  };
});

vi.mock("@/lib/services/refuse-student-promotion", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/services/refuse-student-promotion")
  >("@/lib/services/refuse-student-promotion");
  return {
    ...actual,
    refuseStudentPromotion: mockRefuseStudentPromotion,
  };
});

vi.mock("@/lib/services/dictation-save", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/services/dictation-save")
  >("@/lib/services/dictation-save");
  return {
    ...actual,
    saveDictation: mockSaveDictation,
    saveDictationStudentEntry: mockSaveDictationStudentEntry,
  };
});

vi.mock("@/lib/services/update-dictation", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/services/update-dictation")
  >("@/lib/services/update-dictation");
  return {
    ...actual,
    updateDictation: mockUpdateDictation,
  };
});

vi.mock("@/lib/services/get-dictation-entries", () => ({
  getDictationEntriesByDictationId: mockGetDictationEntriesByDictationId,
}));

vi.mock("@/lib/revalidation/dictation-metadata-paths", () => ({
  revalidateDictationMetadataPaths: mockRevalidateDictationMetadataPaths,
}));

const teacherId = "550e8400-e29b-41d4-a716-446655440000";
const classId = "660e8400-e29b-41d4-a716-446655440001";
const dictationId = "880e8400-e29b-41d4-a716-446655440003";
const studentId = "770e8400-e29b-41d4-a716-446655440002";

function mockAuthenticatedTeacherClass() {
  mockAuth.mockResolvedValueOnce({
    user: { id: teacherId, email: "t@example.com" },
  });
  mockGetTeacherClass.mockResolvedValueOnce({
    id: classId,
    teacherId,
    schoolYearLabel: "2025-2026",
  });
}

function mockAuthenticatedSession() {
  mockAuth.mockResolvedValueOnce({
    user: { id: teacherId, email: "t@example.com" },
  });
  mockGetTeacherClass.mockResolvedValueOnce({
    id: classId,
    teacherId,
    schoolYearLabel: "2025-2026",
  });
  mockGetYearStartWizardStatus.mockResolvedValueOnce({
    completed: true,
    step: 3,
    activeStudentCount: 2,
    leveledActiveStudentCount: 2,
    unassignedCount: 0,
    matrixRowCount: 1,
  });
}

function makeFormData(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

describe("createDictationAction", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated users to login", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { createDictationAction } = await import("./actions");

    await expect(
      createDictationAction(
        { error: null },
        makeFormData({ label: "Dictée 1", dictation_date: "2026-08-27" })
      )
    ).rejects.toThrow("NEXT_REDIRECT:/login");
  });

  it("redirects users without a class to onboarding", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: teacherId, email: "t@example.com" },
    });
    mockGetTeacherClass.mockResolvedValueOnce(null);

    const { createDictationAction } = await import("./actions");

    await expect(
      createDictationAction(
        { error: null },
        makeFormData({ label: "Dictée 1", dictation_date: "2026-08-27" })
      )
    ).rejects.toThrow("NEXT_REDIRECT:/onboarding/class");
  });

  it("creates a dictation and redirects to the detail page", async () => {
    mockAuthenticatedSession();
    mockCreateDictation.mockResolvedValueOnce({
      id: dictationId,
      label: "Dictée 1",
      dictationDate: "2026-08-27",
    });

    const { createDictationAction } = await import("./actions");

    await expect(
      createDictationAction(
        { error: null },
        makeFormData({ label: "Dictée 1", dictation_date: "2026-08-27" })
      )
    ).rejects.toThrow(`NEXT_REDIRECT:/dictations/${dictationId}`);

    expect(mockCreateDictation).toHaveBeenCalledWith(classId, {
      label: "Dictée 1",
      dictationDate: "2026-08-27",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/dictations");
  });

  it("returns an error when the class is not ready to create dictations", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: teacherId, email: "t@example.com" },
    });
    mockGetTeacherClass.mockResolvedValueOnce({
      id: classId,
      teacherId,
      schoolYearLabel: "2025-2026",
    });
    mockGetYearStartWizardStatus.mockResolvedValueOnce({
      completed: false,
      step: 2,
      activeStudentCount: 2,
      leveledActiveStudentCount: 0,
      unassignedCount: 2,
      matrixRowCount: 1,
    });

    const { createDictationAction } = await import("./actions");

    const result = await createDictationAction(
      { error: null },
      makeFormData({ label: "Dictée 1", dictation_date: "2026-08-27" })
    );

    expect(result.error).toBe(UNLEVELED_STUDENTS_MESSAGE);
    expect(mockCreateDictation).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("returns a matrix message when the class has no matrix rows", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: teacherId, email: "t@example.com" },
    });
    mockGetTeacherClass.mockResolvedValueOnce({
      id: classId,
      teacherId,
      schoolYearLabel: "2025-2026",
    });
    mockGetYearStartWizardStatus.mockResolvedValueOnce({
      completed: false,
      step: 3,
      activeStudentCount: 2,
      leveledActiveStudentCount: 2,
      unassignedCount: 0,
      matrixRowCount: 0,
    });

    const { createDictationAction } = await import("./actions");

    const result = await createDictationAction(
      { error: null },
      makeFormData({ label: "Dictée 1", dictation_date: "2026-08-27" })
    );

    expect(result.error).toContain("matrice");
    expect(mockCreateDictation).not.toHaveBeenCalled();
  });

  it("returns label validation errors from the service", async () => {
    mockAuthenticatedSession();
    const { CreateDictationError } = await import("@/lib/services/create-dictation");
    mockCreateDictation.mockRejectedValueOnce(
      new CreateDictationError(DICTATION_LABEL_REQUIRED_ERROR)
    );

    const { createDictationAction } = await import("./actions");

    const result = await createDictationAction(
      { error: null },
      makeFormData({ label: "   ", dictation_date: "2026-08-27" })
    );

    expect(result.error).toBe(DICTATION_LABEL_REQUIRED_ERROR);
  });

  it("returns label length validation errors from the service", async () => {
    mockAuthenticatedSession();
    const { CreateDictationError } = await import("@/lib/services/create-dictation");
    mockCreateDictation.mockRejectedValueOnce(
      new CreateDictationError(DICTATION_LABEL_TOO_LONG_ERROR)
    );

    const { createDictationAction } = await import("./actions");

    const result = await createDictationAction(
      { error: null },
      makeFormData({ label: "a".repeat(81), dictation_date: "2026-08-27" })
    );

    expect(result.error).toBe(DICTATION_LABEL_TOO_LONG_ERROR);
  });

  it("returns date validation errors from the service", async () => {
    mockAuthenticatedSession();
    const { CreateDictationError } = await import("@/lib/services/create-dictation");
    mockCreateDictation.mockRejectedValueOnce(
      new CreateDictationError(DICTATION_DATE_INVALID_ERROR)
    );

    const { createDictationAction } = await import("./actions");

    const result = await createDictationAction(
      { error: null },
      makeFormData({ label: "Dictée 1", dictation_date: "2026-13-01" })
    );

    expect(result.error).toBe(DICTATION_DATE_INVALID_ERROR);
  });

  it("returns validation errors from the service", async () => {
    mockAuthenticatedSession();
    const { CreateDictationError } = await import("@/lib/services/create-dictation");
    mockCreateDictation.mockRejectedValueOnce(
      new CreateDictationError(
        "Aucune ligne de matrice pour cette dictée. Configurez la matrice sur Config."
      )
    );

    const { createDictationAction } = await import("./actions");

    const result = await createDictationAction(
      { error: null },
      makeFormData({ label: "Dictée 9", dictation_date: "2026-08-27" })
    );

    expect(result.error).toContain("matrice");
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe("saveDictationAction", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated users to login", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { saveDictationAction } = await import("./actions");

    await expect(
      saveDictationAction(dictationId, {
        [studentId]: {
          C: 0,
          H: 0,
          A: 0,
          M: 0,
          P: 0,
          I: 0,
          O: 0,
          N: 0,
          S: 0,
        },
      })
    ).rejects.toThrow("NEXT_REDIRECT:/login");
  });

  it("redirects users without a class to onboarding", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: teacherId, email: "t@example.com" },
    });
    mockGetTeacherClass.mockResolvedValueOnce(null);

    const { saveDictationAction } = await import("./actions");

    await expect(
      saveDictationAction(dictationId, {})
    ).rejects.toThrow("NEXT_REDIRECT:/onboarding/class");
  });

  it("saves dictation counts and revalidates dictation routes", async () => {
    mockAuthenticatedTeacherClass();
    mockSaveDictation.mockResolvedValueOnce(undefined);
    const counts = {
      [studentId]: {
        C: 1,
        H: 0,
        A: 0,
        M: 0,
        P: 0,
        I: 0,
        O: 0,
        N: 0,
        S: 0,
      },
    };

    const { saveDictationAction } = await import("./actions");
    const result = await saveDictationAction(dictationId, counts);

    expect(result).toEqual({ error: null });
    expect(mockSaveDictation).toHaveBeenCalledWith(
      classId,
      dictationId,
      counts
    );
    expect(revalidatePath).toHaveBeenCalledWith(`/dictations/${dictationId}`);
    expect(revalidatePath).toHaveBeenCalledWith("/dictations");
  });

  it("returns a service error without revalidating paths", async () => {
    mockAuthenticatedTeacherClass();
    const { DictationSaveError } = await import("@/lib/services/dictation-save");
    mockSaveDictation.mockRejectedValueOnce(
      new DictationSaveError("Sauvegarde impossible.")
    );

    const { saveDictationAction } = await import("./actions");
    const result = await saveDictationAction(dictationId, {});

    expect(result.error).toBe("Sauvegarde impossible.");
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns the roster mismatch message from the service", async () => {
    mockAuthenticatedTeacherClass();
    const { DictationRosterMismatchError } = await import(
      "@/lib/services/dictation-save"
    );
    mockSaveDictation.mockRejectedValueOnce(new DictationRosterMismatchError());

    const { saveDictationAction } = await import("./actions");
    const { DICTATION_SAVE_ROSTER_MISMATCH_ERROR } = await import(
      "@/lib/domain/dictation-save-messages"
    );
    const result = await saveDictationAction(dictationId, {});

    expect(result.error).toBe(DICTATION_SAVE_ROSTER_MISMATCH_ERROR);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("validatePromotionAction", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated users to login", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { validatePromotionAction } = await import("./actions");

    await expect(
      validatePromotionAction(studentId, dictationId)
    ).rejects.toThrow("NEXT_REDIRECT:/login");
  });

  it("validates promotion and revalidates dictation routes", async () => {
    mockAuthenticatedTeacherClass();
    mockValidateStudentPromotion.mockResolvedValueOnce({
      studentId,
      level: "green",
    });

    const { validatePromotionAction } = await import("./actions");
    const result = await validatePromotionAction(studentId, dictationId);

    expect(result).toEqual({ error: null });
    expect(mockValidateStudentPromotion).toHaveBeenCalledWith(
      classId,
      studentId
    );
    expect(revalidatePath).toHaveBeenCalledWith(`/dictations/${dictationId}`);
    expect(revalidatePath).toHaveBeenCalledWith(`/students/${studentId}`);
    expect(revalidatePath).toHaveBeenCalledWith("/students", "layout");
    expect(revalidatePath).toHaveBeenCalledWith("/dictations");
    expect(revalidatePath).toHaveBeenCalledWith("/alerts");
    expect(revalidatePath).toHaveBeenCalledWith("/alerts", "layout");
  });

  it("treats a missing pending promotion as idempotent success", async () => {
    mockAuthenticatedTeacherClass();
    const { PendingPromotionNotFoundError } = await import(
      "@/lib/services/validate-student-promotion"
    );
    mockValidateStudentPromotion.mockRejectedValueOnce(
      new PendingPromotionNotFoundError()
    );

    const { validatePromotionAction } = await import("./actions");
    const result = await validatePromotionAction(studentId, dictationId);

    expect(result).toEqual({ error: null });
    expect(revalidatePath).toHaveBeenCalledWith(`/dictations/${dictationId}`);
    expect(revalidatePath).toHaveBeenCalledWith(`/students/${studentId}`);
    expect(revalidatePath).toHaveBeenCalledWith("/students", "layout");
    expect(revalidatePath).toHaveBeenCalledWith("/alerts");
    expect(revalidatePath).toHaveBeenCalledWith("/alerts", "layout");
  });

  it("returns a generic error for other promotion failures", async () => {
    mockAuthenticatedTeacherClass();
    const { StudentPromotionError, PROMOTION_VALIDATE_GENERIC_ERROR } =
      await import("@/lib/services/validate-student-promotion");
    mockValidateStudentPromotion.mockRejectedValueOnce(
      new StudentPromotionError("Élève introuvable.")
    );

    const { validatePromotionAction } = await import("./actions");
    const result = await validatePromotionAction(studentId, dictationId);

    expect(result.error).toBe(PROMOTION_VALIDATE_GENERIC_ERROR);
  });
});

describe("refusePromotionAction", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("refuses promotion and revalidates dictation routes", async () => {
    mockAuthenticatedTeacherClass();
    mockRefuseStudentPromotion.mockResolvedValueOnce({ studentId });

    const { refusePromotionAction } = await import("./actions");
    const result = await refusePromotionAction(studentId, dictationId);

    expect(result).toEqual({ error: null });
    expect(mockRefuseStudentPromotion).toHaveBeenCalledWith(classId, studentId);
    expect(revalidatePath).toHaveBeenCalledWith(`/dictations/${dictationId}`);
    expect(revalidatePath).toHaveBeenCalledWith(`/students/${studentId}`);
    expect(revalidatePath).toHaveBeenCalledWith("/students", "layout");
    expect(revalidatePath).toHaveBeenCalledWith("/dictations");
    expect(revalidatePath).toHaveBeenCalledWith("/alerts");
    expect(revalidatePath).toHaveBeenCalledWith("/alerts", "layout");
  });

  it("treats a missing pending promotion as idempotent success", async () => {
    mockAuthenticatedTeacherClass();
    const { PendingPromotionNotFoundError } = await import(
      "@/lib/services/validate-student-promotion"
    );
    mockRefuseStudentPromotion.mockRejectedValueOnce(
      new PendingPromotionNotFoundError()
    );

    const { refusePromotionAction } = await import("./actions");
    const result = await refusePromotionAction(studentId, dictationId);

    expect(result).toEqual({ error: null });
    expect(revalidatePath).toHaveBeenCalledWith(`/dictations/${dictationId}`);
    expect(revalidatePath).toHaveBeenCalledWith(`/students/${studentId}`);
    expect(revalidatePath).toHaveBeenCalledWith("/students", "layout");
    expect(revalidatePath).toHaveBeenCalledWith("/alerts");
    expect(revalidatePath).toHaveBeenCalledWith("/alerts", "layout");
  });

  it("returns a generic error for other promotion failures", async () => {
    mockAuthenticatedTeacherClass();
    const { StudentPromotionError } = await import(
      "@/lib/services/validate-student-promotion"
    );
    const { PROMOTION_REFUSE_GENERIC_ERROR } = await import(
      "@/lib/services/refuse-student-promotion"
    );
    mockRefuseStudentPromotion.mockRejectedValueOnce(
      new StudentPromotionError("Élève introuvable.")
    );

    const { refusePromotionAction } = await import("./actions");
    const result = await refusePromotionAction(studentId, dictationId);

    expect(result.error).toBe(PROMOTION_REFUSE_GENERIC_ERROR);
  });
});

describe("saveDictationStudentEntryAction", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated users to login", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { saveDictationStudentEntryAction } = await import("./actions");

    await expect(
      saveDictationStudentEntryAction(dictationId, studentId, {
        C: 0,
        H: 0,
        A: 0,
        M: 0,
        P: 0,
        I: 0,
        O: 0,
        N: 0,
        S: 0,
      })
    ).rejects.toThrow("NEXT_REDIRECT:/login");
  });

  it("saves a student entry and revalidates mobile dictation routes", async () => {
    mockAuthenticatedTeacherClass();
    mockSaveDictationStudentEntry.mockResolvedValueOnce({
      dictationId,
      entryCount: 1,
    });

    const { saveDictationStudentEntryAction } = await import("./actions");
    const counts = {
      C: 2,
      H: 0,
      A: 0,
      M: 0,
      P: 0,
      I: 0,
      O: 0,
      N: 0,
      S: 0,
    };
    const result = await saveDictationStudentEntryAction(
      dictationId,
      studentId,
      counts
    );

    expect(result).toEqual({ error: null });
    expect(mockSaveDictationStudentEntry).toHaveBeenCalledWith(
      classId,
      dictationId,
      studentId,
      counts
    );
    expect(revalidatePath).toHaveBeenCalledWith(`/dictations/${dictationId}`);
    expect(revalidatePath).toHaveBeenCalledWith(
      `/dictations/${dictationId}/mobile`
    );
    expect(revalidatePath).toHaveBeenCalledWith(
      `/dictations/${dictationId}/mobile/summary`
    );
    expect(revalidatePath).toHaveBeenCalledWith("/dictations");
  });

  it("returns a service error without revalidating paths", async () => {
    mockAuthenticatedTeacherClass();
    const { DictationNotFoundError } = await import(
      "@/lib/services/dictation-save"
    );
    mockSaveDictationStudentEntry.mockRejectedValueOnce(
      new DictationNotFoundError()
    );

    const { saveDictationStudentEntryAction } = await import("./actions");
    const result = await saveDictationStudentEntryAction(
      dictationId,
      studentId,
      {
        C: 0,
        H: 0,
        A: 0,
        M: 0,
        P: 0,
        I: 0,
        O: 0,
        N: 0,
        S: 0,
      }
    );

    expect(result.error).toBeTruthy();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("updateDictationAction", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated users to login", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { updateDictationAction } = await import("./actions");

    await expect(
      updateDictationAction(
        { error: null },
        makeFormData({
          dictation_id: dictationId,
          label: "Dictée 1",
          dictation_date: "2026-08-27",
        })
      )
    ).rejects.toThrow("NEXT_REDIRECT:/login");
  });

  it("updates metadata and revalidates student sheet paths for affected students", async () => {
    mockAuthenticatedTeacherClass();
    mockUpdateDictation.mockResolvedValueOnce({
      id: dictationId,
      label: "Dictée 2",
      dictationDate: "2026-09-01",
    });
    mockGetDictationEntriesByDictationId.mockResolvedValueOnce([
      { studentId },
    ]);

    const { updateDictationAction } = await import("./actions");
    const result = await updateDictationAction(
      { error: null },
      makeFormData({
        dictation_id: dictationId,
        label: "Dictée 2",
        dictation_date: "2026-09-01",
      })
    );

    expect(result).toEqual({ error: null });
    expect(mockUpdateDictation).toHaveBeenCalledWith(classId, dictationId, {
      label: "Dictée 2",
      dictationDate: "2026-09-01",
    });
    expect(mockRevalidateDictationMetadataPaths).toHaveBeenCalledWith(
      dictationId,
      [studentId]
    );
  });

  it("revalidates base paths when the dictation has no student entries", async () => {
    mockAuthenticatedTeacherClass();
    mockUpdateDictation.mockResolvedValueOnce({
      id: dictationId,
      label: "Dictée 1",
      dictationDate: "2026-09-01",
    });
    mockGetDictationEntriesByDictationId.mockResolvedValueOnce([]);

    const { updateDictationAction } = await import("./actions");
    const result = await updateDictationAction(
      { error: null },
      makeFormData({
        dictation_id: dictationId,
        label: "Dictée 1",
        dictation_date: "2026-09-01",
      })
    );

    expect(result).toEqual({ error: null });
    expect(mockRevalidateDictationMetadataPaths).toHaveBeenCalledWith(
      dictationId,
      []
    );
  });

  it("returns a service error without revalidating paths", async () => {
    mockAuthenticatedTeacherClass();
    const { UpdateDictationError } = await import(
      "@/lib/services/update-dictation"
    );
    mockUpdateDictation.mockRejectedValueOnce(
      new UpdateDictationError(DICTATION_DATE_INVALID_ERROR)
    );

    const { updateDictationAction } = await import("./actions");
    const result = await updateDictationAction(
      { error: null },
      makeFormData({
        dictation_id: dictationId,
        label: "Dictée 1",
        dictation_date: "bad-date",
      })
    );

    expect(result).toEqual({ error: DICTATION_DATE_INVALID_ERROR });
    expect(mockRevalidateDictationMetadataPaths).not.toHaveBeenCalled();
  });

  it("rejects malformed dictation ids", async () => {
    mockAuthenticatedTeacherClass();

    const { updateDictationAction } = await import("./actions");
    const { UPDATE_DICTATION_GENERIC_ERROR } = await import(
      "@/lib/services/update-dictation"
    );
    const result = await updateDictationAction(
      { error: null },
      makeFormData({
        dictation_id: "not-a-uuid",
        label: "Dictée 1",
        dictation_date: "2026-08-27",
      })
    );

    expect(result).toEqual({ error: UPDATE_DICTATION_GENERIC_ERROR });
    expect(mockUpdateDictation).not.toHaveBeenCalled();
  });
});
