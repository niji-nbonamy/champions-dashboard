import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  auth,
  redirect,
  notFound,
  mockGetTeacherClass,
  mockGetYearStartWizardStatus,
  mockGetClassStudent,
  mockGetStudentDictationHistory,
  mockGetStudentLevelHistory,
  mockListPendingPromotionsForStudents,
} = vi.hoisted(() => ({
  auth: vi.fn(),
  redirect: vi.fn((url: string): never => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  notFound: vi.fn((): never => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  mockGetTeacherClass: vi.fn(),
  mockGetYearStartWizardStatus: vi.fn(),
  mockGetClassStudent: vi.fn(),
  mockGetStudentDictationHistory: vi.fn(),
  mockGetStudentLevelHistory: vi.fn(),
  mockListPendingPromotionsForStudents: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth,
}));

vi.mock("next/navigation", () => ({
  redirect,
  notFound,
}));

vi.mock("@/lib/services/get-teacher-class", () => ({
  getTeacherClass: mockGetTeacherClass,
}));

vi.mock("@/lib/services/get-year-start-wizard-status", () => ({
  getYearStartWizardStatus: mockGetYearStartWizardStatus,
}));

vi.mock("@/lib/services/get-class-student", () => ({
  getClassStudent: mockGetClassStudent,
}));

vi.mock("@/lib/services/get-student-dictation-history", () => ({
  getStudentDictationHistory: mockGetStudentDictationHistory,
}));

vi.mock("@/lib/services/get-student-level-history", () => ({
  getStudentLevelHistory: mockGetStudentLevelHistory,
}));

vi.mock("@/lib/services/list-pending-promotions", () => ({
  listPendingPromotionsForStudents: mockListPendingPromotionsForStudents,
}));

vi.mock("../level-dot-picker", () => ({
  LevelDotPicker: ({
    studentId,
    mode,
    currentLevel,
  }: {
    studentId: string;
    mode?: string;
    currentLevel?: string;
  }) => (
    <div
      data-testid={`level-dot-picker-${studentId}`}
      data-mode={mode ?? "assign"}
      data-current-level={currentLevel ?? ""}
    />
  ),
}));

vi.mock("../archive-student-button", () => ({
  ArchiveStudentButton: ({
    studentId,
    displayName,
  }: {
    studentId: string;
    displayName: string;
    filter: string;
  }) => (
    <button type="button" data-testid={`archive-student-${studentId}`}>
      Archiver {displayName}
    </button>
  ),
}));

vi.mock("@/components/promotion/promotion-banner", () => ({
  PromotionBanner: ({
    studentId,
    targetLevel,
  }: {
    studentId: string;
    targetLevel: string;
  }) => (
    <div
      data-testid="promotion-banner"
      data-student-id={studentId}
      role="alert"
      className="bg-promotion-ready text-promotion-ready-foreground"
    >
      Prêt à monter → {targetLevel === "green" ? "vert" : targetLevel}
    </div>
  ),
}));

import StudentDossierPage from "./page";

const teacherId = "550e8400-e29b-41d4-a716-446655440000";
const classId = "660e8400-e29b-41d4-a716-446655440001";
const studentId = "770e8400-e29b-41d4-a716-446655440002";

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
  mockGetYearStartWizardStatus.mockResolvedValueOnce({
    completed: false,
    step: 3,
    activeStudentCount: 8,
    leveledActiveStudentCount: 8,
    unassignedCount: 0,
    matrixRowCount: 5,
  });
}

describe("StudentDossierPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetStudentDictationHistory.mockResolvedValue([]);
    mockGetStudentLevelHistory.mockResolvedValue([]);
    mockListPendingPromotionsForStudents.mockResolvedValue({});
  });

  it("redirects unauthenticated users to login", async () => {
    auth.mockResolvedValueOnce(null);

    await expect(
      StudentDossierPage({ params: Promise.resolve({ id: studentId }) })
    ).rejects.toThrow("NEXT_REDIRECT:/login");
  });

  it("redirects users without a class to onboarding", async () => {
    auth.mockResolvedValueOnce({
      user: { id: teacherId, email: "t@example.com" },
      expires: "2099-01-01T00:00:00.000Z",
    });
    mockGetTeacherClass.mockResolvedValueOnce(null);

    await expect(
      StudentDossierPage({ params: Promise.resolve({ id: studentId }) })
    ).rejects.toThrow("NEXT_REDIRECT:/onboarding/class");
  });

  it("returns not found for malformed ids", async () => {
    mockAuthenticatedClass();

    await expect(
      StudentDossierPage({ params: Promise.resolve({ id: "not-a-uuid" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(mockGetClassStudent).not.toHaveBeenCalled();
    expect(notFound).toHaveBeenCalled();
  });

  it("returns not found when the student is outside the class scope", async () => {
    mockAuthenticatedClass();
    mockGetClassStudent.mockResolvedValueOnce(null);

    await expect(
      StudentDossierPage({ params: Promise.resolve({ id: studentId }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(mockGetClassStudent).toHaveBeenCalledWith(classId, studentId);
    expect(notFound).toHaveBeenCalled();
  });

  it("renders the empty dossier state when no dictations exist", async () => {
    mockAuthenticatedClass();
    mockGetClassStudent.mockResolvedValueOnce({
      id: studentId,
      displayName: "DUPONT Marie",
      level: "yellow",
      archived: false,
    });
    mockGetStudentDictationHistory.mockResolvedValueOnce([]);

    const html = renderToStaticMarkup(
      await StudentDossierPage({ params: Promise.resolve({ id: studentId }) })
    );

    expect(html).toContain("DUPONT Marie");
    expect(html).toContain("jaune");
    expect(html).toContain('href="/students"');
    expect(html).toContain("Retour aux élèves");
    expect(html).toContain("Aucune dictée enregistrée.");
    expect(html).toContain('role="status"');
    expect(html).toContain('data-testid="curve-placeholder"');
    expect(html).toContain("max-w-4xl");
    expect(html).not.toContain("Historique des dictées");
    expect(html).not.toContain('data-testid="global-success-curve"');
    expect(mockGetStudentDictationHistory).toHaveBeenCalledWith(
      classId,
      studentId
    );
    expect(html).toContain("Archiver DUPONT Marie");
  });

  it("hides the archive action on archived dossiers", async () => {
    mockAuthenticatedClass();
    mockGetClassStudent.mockResolvedValueOnce({
      id: studentId,
      displayName: "DUPONT Marie",
      level: "yellow",
      archived: true,
    });

    const html = renderToStaticMarkup(
      await StudentDossierPage({ params: Promise.resolve({ id: studentId }) })
    );

    expect(html).toContain("Archivé");
    expect(html).not.toContain("Archiver DUPONT Marie");
  });

  it("hides the archive action before year-start setup is complete", async () => {
    mockAuthenticatedClass();
    mockGetYearStartWizardStatus.mockReset();
    mockGetYearStartWizardStatus.mockResolvedValueOnce({
      completed: false,
      step: 1,
      activeStudentCount: 1,
      leveledActiveStudentCount: 0,
      unassignedCount: 1,
      matrixRowCount: 0,
    });
    mockGetClassStudent.mockResolvedValueOnce({
      id: studentId,
      displayName: "DUPONT Marie",
      level: null,
      archived: false,
    });

    const html = renderToStaticMarkup(
      await StudentDossierPage({ params: Promise.resolve({ id: studentId }) })
    );

    expect(html).not.toContain("Archiver DUPONT Marie");
  });

  it("renders the dossier curve and collapsed history table when dictations exist", async () => {
    mockAuthenticatedClass();
    mockGetClassStudent.mockResolvedValueOnce({
      id: studentId,
      displayName: "DUPONT Marie",
      level: "yellow",
      archived: false,
    });
    mockGetStudentDictationHistory.mockResolvedValueOnce([
      {
        entryId: "aa0e8400-e29b-41d4-a716-446655440010",
        dictationId: "880e8400-e29b-41d4-a716-446655440003",
        label: "Dictée B",
        dictationDate: "2026-08-27",
        levelAtSave: "yellow",
        globalPercent: 92,
        wordDenominator: 40,
        categoryErrors: {
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
      },
    ]);

    const html = renderToStaticMarkup(
      await StudentDossierPage({ params: Promise.resolve({ id: studentId }) })
    );

    expect(html).toContain("Historique des dictées");
    expect(html).toContain("Courbe de réussite globale");
    expect(html).toContain("Dictée B");
    expect(html).toContain("27 août 2026");
    expect(html).toContain("92 %");
    expect(html).toContain("jaune");
    expect(html).toContain('data-testid="global-success-curve"');
    expect(html).toContain('data-testid="dictation-history-table"');
    expect(html).toContain("<details");
    expect(html).toContain("max-w-4xl");
    expect(html).toContain("flex flex-col gap-6");
    expect(html).toContain("2xl:grid-cols-2");
    expect(html).toContain("[&amp;_svg]:h-56 lg:[&amp;_svg]:h-64");
    expect(html).not.toContain('data-testid="curve-placeholder"');
    expect(html).not.toContain('href="/dictations/');
    expect(html).not.toContain("Aucune dictée enregistrée.");
  });

  it("renders the hero curve in chronological order for multiple dictations", async () => {
    mockAuthenticatedClass();
    mockGetClassStudent.mockResolvedValueOnce({
      id: studentId,
      displayName: "DUPONT Marie",
      level: "yellow",
      archived: false,
    });
    mockGetStudentDictationHistory.mockResolvedValueOnce([
      {
        entryId: "bb0e8400-e29b-41d4-a716-446655440011",
        dictationId: "880e8400-e29b-41d4-a716-446655440003",
        label: "Dictée récente",
        dictationDate: "2026-08-27",
        levelAtSave: "yellow",
        globalPercent: 92,
        wordDenominator: 40,
        categoryErrors: {
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
      },
      {
        entryId: "aa0e8400-e29b-41d4-a716-446655440010",
        dictationId: "770e8400-e29b-41d4-a716-446655440002",
        label: "Dictée ancienne",
        dictationDate: "2026-08-13",
        levelAtSave: "yellow",
        globalPercent: 75,
        wordDenominator: 40,
        categoryErrors: {
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
      },
    ]);

    const html = renderToStaticMarkup(
      await StudentDossierPage({ params: Promise.resolve({ id: studentId }) })
    );

    expect(html).toContain('aria-label="Courbe de réussite globale, 2 dictées"');
    const olderTitleIndex = html.indexOf("Dictée ancienne : 75 %");
    const newerTitleIndex = html.indexOf("Dictée récente : 92 %");
    expect(olderTitleIndex).toBeGreaterThan(-1);
    expect(newerTitleIndex).toBeGreaterThan(-1);
    expect(olderTitleIndex).toBeLessThan(newerTitleIndex);
  });

  it("renders archived students with empty history and an Archivé label", async () => {
    mockAuthenticatedClass();
    mockGetClassStudent.mockResolvedValueOnce({
      id: studentId,
      displayName: "BERNARD Paul",
      level: "green",
      archived: true,
    });
    mockGetStudentDictationHistory.mockResolvedValueOnce([]);

    const html = renderToStaticMarkup(
      await StudentDossierPage({ params: Promise.resolve({ id: studentId }) })
    );

    expect(html).toContain("BERNARD Paul");
    expect(html).toContain("Archivé");
    expect(html).toContain("Aucune dictée enregistrée.");
    expect(html).not.toContain("Historique des dictées");
    expect(html).not.toContain("level-dot-picker");
  });

  it("renders archived students as read-only with an Archivé label", async () => {
    mockAuthenticatedClass();
    mockGetClassStudent.mockResolvedValueOnce({
      id: studentId,
      displayName: "BERNARD Paul",
      level: "green",
      archived: true,
    });
    mockGetStudentDictationHistory.mockResolvedValueOnce([
      {
        entryId: "aa0e8400-e29b-41d4-a716-446655440010",
        dictationId: "880e8400-e29b-41d4-a716-446655440003",
        label: "Dictée B",
        dictationDate: "2026-08-27",
        levelAtSave: "green",
        globalPercent: 90,
        wordDenominator: 40,
        categoryErrors: {
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
      },
    ]);

    const html = renderToStaticMarkup(
      await StudentDossierPage({ params: Promise.resolve({ id: studentId }) })
    );

    expect(html).toContain("BERNARD Paul");
    expect(html).toContain("Archivé");
    expect(html).toContain("Dictée B");
    expect(html).not.toContain("level-dot-picker");
  });

  it("renders the promotion banner when a pending promotion exists", async () => {
    mockAuthenticatedClass();
    mockGetClassStudent.mockResolvedValueOnce({
      id: studentId,
      displayName: "DUPONT Marie",
      level: "yellow",
      archived: false,
    });
    mockListPendingPromotionsForStudents.mockResolvedValueOnce({
      [studentId]: { targetLevel: "green" },
    });

    const html = renderToStaticMarkup(
      await StudentDossierPage({ params: Promise.resolve({ id: studentId }) })
    );

    expect(mockListPendingPromotionsForStudents).toHaveBeenCalledWith(
      classId,
      [studentId]
    );
    expect(html).toContain('data-testid="promotion-banner"');
    expect(html).toContain(`data-student-id="${studentId}"`);
    expect(html).toContain('role="alert"');
    expect(html).toContain("bg-promotion-ready");
    expect(html).toContain("Prêt à monter → vert");
  });

  it("does not render the promotion banner without a pending promotion", async () => {
    mockAuthenticatedClass();
    mockGetClassStudent.mockResolvedValueOnce({
      id: studentId,
      displayName: "DUPONT Marie",
      level: "yellow",
      archived: false,
    });
    mockListPendingPromotionsForStudents.mockResolvedValueOnce({});

    const html = renderToStaticMarkup(
      await StudentDossierPage({ params: Promise.resolve({ id: studentId }) })
    );

    expect(html).not.toContain('data-testid="promotion-banner"');
  });

  it("does not render the promotion banner for archived students", async () => {
    mockAuthenticatedClass();
    mockGetClassStudent.mockResolvedValueOnce({
      id: studentId,
      displayName: "BERNARD Paul",
      level: "green",
      archived: true,
    });

    const html = renderToStaticMarkup(
      await StudentDossierPage({ params: Promise.resolve({ id: studentId }) })
    );

    expect(mockListPendingPromotionsForStudents).not.toHaveBeenCalled();
    expect(html).not.toContain('data-testid="promotion-banner"');
  });

  it("renders the promotion banner above the empty state when pending exists", async () => {
    mockAuthenticatedClass();
    mockGetClassStudent.mockResolvedValueOnce({
      id: studentId,
      displayName: "DUPONT Marie",
      level: "yellow",
      archived: false,
    });
    mockListPendingPromotionsForStudents.mockResolvedValueOnce({
      [studentId]: { targetLevel: "green" },
    });
    mockGetStudentDictationHistory.mockResolvedValueOnce([]);

    const html = renderToStaticMarkup(
      await StudentDossierPage({ params: Promise.resolve({ id: studentId }) })
    );

    const bannerIndex = html.indexOf('data-testid="promotion-banner"');
    const emptyStateIndex = html.indexOf("Aucune dictée enregistrée.");
    expect(bannerIndex).toBeGreaterThan(-1);
    expect(emptyStateIndex).toBeGreaterThan(-1);
    expect(bannerIndex).toBeLessThan(emptyStateIndex);
  });

  it("renders the promotion banner above the curve when history exists", async () => {
    mockAuthenticatedClass();
    mockGetClassStudent.mockResolvedValueOnce({
      id: studentId,
      displayName: "DUPONT Marie",
      level: "yellow",
      archived: false,
    });
    mockListPendingPromotionsForStudents.mockResolvedValueOnce({
      [studentId]: { targetLevel: "green" },
    });
    mockGetStudentDictationHistory.mockResolvedValueOnce([
      {
        entryId: "aa0e8400-e29b-41d4-a716-446655440010",
        dictationId: "880e8400-e29b-41d4-a716-446655440003",
        label: "Dictée B",
        dictationDate: "2026-08-27",
        levelAtSave: "yellow",
        globalPercent: 92,
        wordDenominator: 40,
        categoryErrors: {
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
      },
    ]);

    const html = renderToStaticMarkup(
      await StudentDossierPage({ params: Promise.resolve({ id: studentId }) })
    );

    const bannerIndex = html.indexOf('data-testid="promotion-banner"');
    const curveIndex = html.indexOf('data-testid="global-success-curve"');
    expect(bannerIndex).toBeGreaterThan(-1);
    expect(curveIndex).toBeGreaterThan(-1);
    expect(bannerIndex).toBeLessThan(curveIndex);
  });

  it("renders the level override picker for active leveled students", async () => {
    mockAuthenticatedClass();
    mockGetClassStudent.mockResolvedValueOnce({
      id: studentId,
      displayName: "DUPONT Marie",
      level: "yellow",
      archived: false,
    });

    const html = renderToStaticMarkup(
      await StudentDossierPage({ params: Promise.resolve({ id: studentId }) })
    );

    expect(html).toContain(`data-testid="level-dot-picker-${studentId}"`);
    expect(html).toContain('data-mode="override"');
    expect(html).toContain('data-current-level="yellow"');
    expect(html).toContain("Niveau actuel");
  });

  it("renders level history entries on the dossier", async () => {
    mockAuthenticatedClass();
    mockGetClassStudent.mockResolvedValueOnce({
      id: studentId,
      displayName: "DUPONT Marie",
      level: "yellow",
      archived: false,
    });
    mockGetStudentLevelHistory.mockResolvedValueOnce([
      {
        id: "aa0e8400-e29b-41d4-a716-446655440010",
        level: "yellow",
        action: "assigned",
        occurredAt: new Date("2026-08-20T10:00:00.000Z"),
      },
    ]);

    const html = renderToStaticMarkup(
      await StudentDossierPage({ params: Promise.resolve({ id: studentId }) })
    );

    expect(mockGetStudentLevelHistory).toHaveBeenCalledWith(classId, studentId);
    expect(html).toContain("Historique des niveaux");
    expect(html).toContain("Assigné");
  });

  it("renders the RDV parents accent link to the presentation route", async () => {
    mockAuthenticatedClass();
    mockGetClassStudent.mockResolvedValueOnce({
      id: studentId,
      displayName: "DUPONT Marie",
      level: "yellow",
      archived: false,
    });

    const html = renderToStaticMarkup(
      await StudentDossierPage({ params: Promise.resolve({ id: studentId }) })
    );

    expect(html).toContain("RDV parents");
    expect(html).toContain(`href="/students/${studentId}/present"`);
    expect(html).toContain("border-accent");
    expect(html).toContain("text-accent");
  });

  it("renders the RDV parents link for archived students", async () => {
    mockAuthenticatedClass();
    mockGetClassStudent.mockResolvedValueOnce({
      id: studentId,
      displayName: "BERNARD Paul",
      level: "green",
      archived: true,
    });

    const html = renderToStaticMarkup(
      await StudentDossierPage({ params: Promise.resolve({ id: studentId }) })
    );

    expect(html).toContain("RDV parents");
    expect(html).toContain(`href="/students/${studentId}/present"`);
  });

  it("still renders level history for archived students without override controls", async () => {
    mockAuthenticatedClass();
    mockGetClassStudent.mockResolvedValueOnce({
      id: studentId,
      displayName: "BERNARD Paul",
      level: "green",
      archived: true,
    });
    mockGetStudentLevelHistory.mockResolvedValueOnce([
      {
        id: "bb0e8400-e29b-41d4-a716-446655440011",
        level: "green",
        action: "manual",
        occurredAt: new Date("2026-08-21T10:00:00.000Z"),
      },
    ]);

    const html = renderToStaticMarkup(
      await StudentDossierPage({ params: Promise.resolve({ id: studentId }) })
    );

    expect(html).toContain("Historique des niveaux");
    expect(html).toContain("Modification manuelle");
    expect(html).not.toContain(`data-testid="level-dot-picker-${studentId}"`);
  });
});
