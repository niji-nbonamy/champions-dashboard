import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const { auth, redirect, mockGetTeacherClass, mockGetYearStartWizardStatus, mockListActiveStudents, mockListWordCountMatrixRows } =
  vi.hoisted(() => ({
    auth: vi.fn(),
    redirect: vi.fn((url: string): never => {
      throw new Error(`NEXT_REDIRECT:${url}`);
    }),
    mockGetTeacherClass: vi.fn(),
    mockGetYearStartWizardStatus: vi.fn(),
    mockListActiveStudents: vi.fn(),
    mockListWordCountMatrixRows: vi.fn(),
  }));

vi.mock("@/auth", () => ({
  auth,
}));

vi.mock("next/navigation", () => ({
  redirect,
}));

vi.mock("@/lib/services/get-teacher-class", () => ({
  getTeacherClass: mockGetTeacherClass,
}));

vi.mock("@/lib/services/get-year-start-wizard-status", () => ({
  getYearStartWizardStatus: mockGetYearStartWizardStatus,
}));

vi.mock("@/lib/services/list-active-students", () => ({
  listActiveStudents: mockListActiveStudents,
}));

vi.mock("@/lib/services/list-word-count-matrix-rows", () => ({
  listWordCountMatrixRows: mockListWordCountMatrixRows,
}));

vi.mock("./step-roster", () => ({
  StepRoster: () => <div data-testid="step-roster" />,
}));

vi.mock("./step-levels", () => ({
  StepLevels: () => <div data-testid="step-levels" />,
}));

vi.mock("./step-matrix", () => ({
  StepMatrix: () => <div data-testid="step-matrix" />,
}));

vi.mock("./year-start-step-three", () => ({
  YearStartStepThree: () => <div data-testid="step-three" />,
}));

vi.mock("./wizard-shell", () => ({
  WizardShell: ({
    children,
    footer,
  }: {
    children: React.ReactNode;
    footer?: React.ReactNode;
  }) => (
    <div data-testid="wizard-shell">
      {children}
      {footer}
    </div>
  ),
}));

import YearStartWizardPage from "./page";

const teacherId = "550e8400-e29b-41d4-a716-446655440000";
const classId = "660e8400-e29b-41d4-a716-446655440001";

function mockAuthenticatedClass() {
  auth.mockResolvedValueOnce({
    user: { id: teacherId, email: "t@example.com" },
    expires: "2099-01-01T00:00:00.000Z",
  });
  mockGetTeacherClass.mockResolvedValueOnce({
    id: classId,
    teacherId,
    schoolYearLabel: "2025-2026",
  });
}

describe("YearStartWizardPage", () => {
  it("redirects unauthenticated users to login", async () => {
    auth.mockResolvedValueOnce(null);

    await expect(YearStartWizardPage({ searchParams: Promise.resolve({}) })).rejects.toThrow(
      "NEXT_REDIRECT:/login"
    );
  });

  it("redirects to dictations when the wizard is already complete", async () => {
    mockAuthenticatedClass();
    mockGetYearStartWizardStatus.mockResolvedValueOnce({
      completed: true,
      step: 3,
      activeStudentCount: 3,
      unassignedCount: 0,
      matrixRowCount: 1,
    });

    await expect(
      YearStartWizardPage({ searchParams: Promise.resolve({ step: "1" }) })
    ).rejects.toThrow("NEXT_REDIRECT:/dictations");
  });

  it("redirects to the earliest incomplete step when the URL skips ahead", async () => {
    mockAuthenticatedClass();
    mockGetYearStartWizardStatus.mockResolvedValueOnce({
      completed: false,
      step: 2,
      activeStudentCount: 3,
      unassignedCount: 2,
      matrixRowCount: 0,
    });

    await expect(
      YearStartWizardPage({ searchParams: Promise.resolve({ step: "3" }) })
    ).rejects.toThrow("NEXT_REDIRECT:/onboarding/year-start?step=2");
  });

  it("redirects to step 1 when the roster is not confirmed and step 2 is requested", async () => {
    mockAuthenticatedClass();
    mockGetYearStartWizardStatus.mockResolvedValueOnce({
      completed: false,
      step: 1,
      activeStudentCount: 3,
      unassignedCount: 2,
      matrixRowCount: 0,
    });

    await expect(
      YearStartWizardPage({ searchParams: Promise.resolve({ step: "2" }) })
    ).rejects.toThrow("NEXT_REDIRECT:/onboarding/year-start?step=1");
  });

  it("renders step 1 when the roster still needs confirmation", async () => {
    mockAuthenticatedClass();
    mockGetYearStartWizardStatus.mockResolvedValueOnce({
      completed: false,
      step: 1,
      activeStudentCount: 2,
      unassignedCount: 2,
      matrixRowCount: 0,
    });
    mockListActiveStudents.mockResolvedValueOnce([
      {
        id: "770e8400-e29b-41d4-a716-446655440002",
        displayName: "DUPONT Marie",
        level: null,
      },
    ]);

    const html = renderToStaticMarkup(
      await YearStartWizardPage({ searchParams: Promise.resolve({ step: "1" }) })
    );

    expect(html).toContain("data-testid=\"step-roster\"");
    expect(html).not.toContain("data-testid=\"step-levels\"");
    expect(mockListWordCountMatrixRows).not.toHaveBeenCalled();
  });

  it("renders step 2 when levels still need assignment", async () => {
    mockAuthenticatedClass();
    mockGetYearStartWizardStatus.mockResolvedValueOnce({
      completed: false,
      step: 2,
      activeStudentCount: 2,
      unassignedCount: 1,
      matrixRowCount: 0,
    });
    mockListActiveStudents.mockResolvedValueOnce([]);

    const html = renderToStaticMarkup(
      await YearStartWizardPage({ searchParams: Promise.resolve({ step: "2" }) })
    );

    expect(html).toContain("data-testid=\"step-levels\"");
    expect(html).not.toContain("data-testid=\"step-roster\"");
    expect(html).toContain("disabled=\"\"");
    expect(html).toContain("Suivant");
    expect(mockListWordCountMatrixRows).not.toHaveBeenCalled();
  });

  it("renders step 3 when the matrix still needs configuration", async () => {
    mockAuthenticatedClass();
    mockGetYearStartWizardStatus.mockResolvedValueOnce({
      completed: false,
      step: 3,
      activeStudentCount: 2,
      unassignedCount: 0,
      matrixRowCount: 0,
    });
    mockListWordCountMatrixRows.mockResolvedValueOnce([]);

    const html = renderToStaticMarkup(
      await YearStartWizardPage({ searchParams: Promise.resolve({ step: "3" }) })
    );

    expect(html).toContain("data-testid=\"step-three\"");
    expect(html).not.toContain("data-testid=\"step-levels\"");
    expect(mockListWordCountMatrixRows).toHaveBeenCalledOnce();
  });
});
