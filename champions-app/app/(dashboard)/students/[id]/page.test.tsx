import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  auth,
  redirect,
  notFound,
  mockGetTeacherClass,
  mockGetClassStudent,
  mockGetStudentDictationHistory,
} = vi.hoisted(() => ({
  auth: vi.fn(),
  redirect: vi.fn((url: string): never => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  notFound: vi.fn((): never => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  mockGetTeacherClass: vi.fn(),
  mockGetClassStudent: vi.fn(),
  mockGetStudentDictationHistory: vi.fn(),
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

vi.mock("@/lib/services/get-class-student", () => ({
  getClassStudent: mockGetClassStudent,
}));

vi.mock("@/lib/services/get-student-dictation-history", () => ({
  getStudentDictationHistory: mockGetStudentDictationHistory,
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
}

describe("StudentDossierPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetStudentDictationHistory.mockResolvedValue([]);
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
    expect(html).not.toContain("Historique des dictées");
    expect(mockGetStudentDictationHistory).toHaveBeenCalledWith(
      classId,
      studentId
    );
  });

  it("renders the dossier history list when dictations exist", async () => {
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
      },
    ]);

    const html = renderToStaticMarkup(
      await StudentDossierPage({ params: Promise.resolve({ id: studentId }) })
    );

    expect(html).toContain("Historique des dictées");
    expect(html).toContain("Dictée B");
    expect(html).toContain("27 août 2026");
    expect(html).toContain("92 %");
    expect(html).toContain("jaune");
    expect(html).toContain('data-testid="curve-placeholder"');
    expect(html).not.toContain('href="/dictations/');
    expect(html).not.toContain("Aucune dictée enregistrée.");
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
});
