import { afterEach, describe, expect, it, vi } from "vitest";

const {
  redirect,
  revalidatePath,
  mockAuth,
  mockGetTeacherClass,
  mockGetYearStartWizardStatus,
  mockRemoveActiveStudent,
  mockCompleteYearStartWizard,
} = vi.hoisted(() => ({
  redirect: vi.fn((url: string): never => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  revalidatePath: vi.fn(),
  mockAuth: vi.fn(),
  mockGetTeacherClass: vi.fn(),
  mockGetYearStartWizardStatus: vi.fn(),
  mockRemoveActiveStudent: vi.fn(),
  mockCompleteYearStartWizard: vi.fn(),
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

vi.mock("@/lib/services/remove-active-student", () => ({
  removeActiveStudent: mockRemoveActiveStudent,
  RemoveActiveStudentError: class RemoveActiveStudentError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "RemoveActiveStudentError";
    }
  },
}));

vi.mock("@/lib/services/complete-year-start-wizard", () => ({
  completeYearStartWizard: mockCompleteYearStartWizard,
  CompleteYearStartWizardError: class CompleteYearStartWizardError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "CompleteYearStartWizardError";
    }
  },
}));

const teacherId = "550e8400-e29b-41d4-a716-446655440000";
const classId = "660e8400-e29b-41d4-a716-446655440001";
const studentId = "770e8400-e29b-41d4-a716-446655440002";

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

function mockIncompleteWizardStatus() {
  mockGetYearStartWizardStatus.mockResolvedValueOnce({
    completed: false,
    step: 1,
    activeStudentCount: 2,
    unassignedCount: 2,
    matrixRowCount: 0,
  });
}

describe("year-start wizard actions", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("confirmRosterStepAction", () => {
    it("redirects to step 2 when students exist", async () => {
      mockAuthenticatedSession();
      mockIncompleteWizardStatus();

      const { confirmRosterStepAction } = await import("./actions");

      await expect(confirmRosterStepAction()).rejects.toThrow(
        "NEXT_REDIRECT:/onboarding/year-start?step=2"
      );
    });

    it("keeps step 1 when the roster is empty", async () => {
      mockAuthenticatedSession();
      mockGetYearStartWizardStatus.mockResolvedValueOnce({
        completed: false,
        step: 1,
        activeStudentCount: 0,
        unassignedCount: 0,
        matrixRowCount: 0,
      });

      const { confirmRosterStepAction } = await import("./actions");

      await expect(confirmRosterStepAction()).rejects.toThrow(
        "NEXT_REDIRECT:/onboarding/year-start?step=1"
      );
    });
  });

  describe("confirmLevelsStepAction", () => {
    it("redirects to step 3 when all students are leveled", async () => {
      mockAuthenticatedSession();
      mockGetYearStartWizardStatus.mockResolvedValueOnce({
        completed: false,
        step: 3,
        activeStudentCount: 2,
        unassignedCount: 0,
        matrixRowCount: 0,
      });

      const { confirmLevelsStepAction } = await import("./actions");

      await expect(confirmLevelsStepAction()).rejects.toThrow(
        "NEXT_REDIRECT:/onboarding/year-start?step=3"
      );
    });

    it("returns to step 1 when the roster became empty", async () => {
      mockAuthenticatedSession();
      mockGetYearStartWizardStatus.mockResolvedValueOnce({
        completed: false,
        step: 2,
        activeStudentCount: 0,
        unassignedCount: 0,
        matrixRowCount: 0,
      });

      const { confirmLevelsStepAction } = await import("./actions");

      await expect(confirmLevelsStepAction()).rejects.toThrow(
        "NEXT_REDIRECT:/onboarding/year-start?step=1"
      );
    });
  });

  describe("removeStudentFromWizardAction", () => {
    it("revalidates wizard paths after a successful removal", async () => {
      mockAuthenticatedSession();
      mockRemoveActiveStudent.mockResolvedValueOnce({ studentId });

      const { removeStudentFromWizardAction } = await import("./actions");
      const formData = new FormData();
      formData.set("student_id", studentId);

      const result = await removeStudentFromWizardAction(
        { error: null },
        formData
      );

      expect(result).toEqual({ error: null });
      expect(revalidatePath).toHaveBeenCalledWith("/onboarding/year-start");
      expect(revalidatePath).toHaveBeenCalledWith("/dictations");
    });
  });

  describe("completeYearStartWizardAction", () => {
    it("redirects to dictations after successful completion", async () => {
      mockAuthenticatedSession();
      mockGetYearStartWizardStatus.mockResolvedValueOnce({
        completed: false,
        step: 3,
        activeStudentCount: 2,
        unassignedCount: 0,
        matrixRowCount: 1,
      });
      mockCompleteYearStartWizard.mockResolvedValueOnce({
        completedAt: new Date("2026-08-26T10:00:00.000Z"),
        alreadyComplete: false,
      });

      const { completeYearStartWizardAction } = await import("./actions");

      await expect(
        completeYearStartWizardAction({ error: null })
      ).rejects.toThrow("NEXT_REDIRECT:/dictations");
    });

    it("returns a French error when completion prerequisites fail in the service", async () => {
      mockAuthenticatedSession();
      mockGetYearStartWizardStatus.mockResolvedValueOnce({
        completed: false,
        step: 3,
        activeStudentCount: 2,
        unassignedCount: 0,
        matrixRowCount: 1,
      });
      const { CompleteYearStartWizardError } = await import(
        "@/lib/services/complete-year-start-wizard"
      );
      mockCompleteYearStartWizard.mockRejectedValueOnce(
        new CompleteYearStartWizardError(
          "Enregistrez au moins une dictée complète dans la matrice."
        )
      );

      const { completeYearStartWizardAction } = await import("./actions");
      const result = await completeYearStartWizardAction({ error: null });

      expect(result.error).toBe(
        "Enregistrez au moins une dictée complète dans la matrice."
      );
    });
  });
});
