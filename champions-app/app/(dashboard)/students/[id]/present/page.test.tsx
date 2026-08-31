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

vi.mock("@/components/dossier/presentation-mode", () => ({
  PresentationMode: ({
    studentId,
    displayName,
    level,
    history,
  }: {
    studentId: string;
    displayName: string;
    level: string | null;
    history: Array<{ globalPercent: number }>;
  }) => (
    <div
      data-testid="presentation-mode"
      data-student-id={studentId}
      data-display-name={displayName}
      data-level={level ?? ""}
      data-history-count={history.length}
    />
  ),
}));

import StudentPresentationPage from "./page";

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

describe("StudentPresentationPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetStudentDictationHistory.mockResolvedValue([]);
  });

  it("redirects unauthenticated users to login", async () => {
    auth.mockResolvedValueOnce(null);

    await expect(
      StudentPresentationPage({ params: Promise.resolve({ id: studentId }) })
    ).rejects.toThrow("NEXT_REDIRECT:/login");
  });

  it("redirects users without a class to onboarding", async () => {
    auth.mockResolvedValueOnce({
      user: { id: teacherId, email: "t@example.com" },
      expires: "2099-01-01T00:00:00.000Z",
    });
    mockGetTeacherClass.mockResolvedValueOnce(null);

    await expect(
      StudentPresentationPage({ params: Promise.resolve({ id: studentId }) })
    ).rejects.toThrow("NEXT_REDIRECT:/onboarding/class");
  });

  it("returns not found for malformed ids", async () => {
    mockAuthenticatedClass();

    await expect(
      StudentPresentationPage({ params: Promise.resolve({ id: "not-a-uuid" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(mockGetClassStudent).not.toHaveBeenCalled();
    expect(notFound).toHaveBeenCalled();
  });

  it("returns not found when the student is outside the class scope", async () => {
    mockAuthenticatedClass();
    mockGetClassStudent.mockResolvedValueOnce(null);

    await expect(
      StudentPresentationPage({ params: Promise.resolve({ id: studentId }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(mockGetClassStudent).toHaveBeenCalledWith(classId, studentId);
    expect(notFound).toHaveBeenCalled();
  });

  it("passes student and history data to the presentation shell", async () => {
    mockAuthenticatedClass();
    mockGetClassStudent.mockResolvedValueOnce({
      id: studentId,
      displayName: "DUPONT Marie",
      level: "green",
      archived: false,
    });
    mockGetStudentDictationHistory.mockResolvedValueOnce([
      {
        entryId: "aa0e8400-e29b-41d4-a716-446655440010",
        dictationId: "880e8400-e29b-41d4-a716-446655440003",
        label: "Dictée B",
        dictationDate: "2026-08-27",
        levelAtSave: "green",
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
      await StudentPresentationPage({ params: Promise.resolve({ id: studentId }) })
    );

    expect(mockGetStudentDictationHistory).toHaveBeenCalledWith(
      classId,
      studentId
    );
    expect(html).toContain('data-testid="presentation-mode"');
    expect(html).toContain(`data-student-id="${studentId}"`);
    expect(html).toContain('data-display-name="DUPONT Marie"');
    expect(html).toContain('data-level="green"');
    expect(html).toContain('data-history-count="1"');
  });

  it("loads presentation data for archived students", async () => {
    mockAuthenticatedClass();
    mockGetClassStudent.mockResolvedValueOnce({
      id: studentId,
      displayName: "BERNARD Paul",
      level: "yellow",
      archived: true,
    });

    const html = renderToStaticMarkup(
      await StudentPresentationPage({ params: Promise.resolve({ id: studentId }) })
    );

    expect(html).toContain('data-testid="presentation-mode"');
    expect(html).toContain('data-display-name="BERNARD Paul"');
    expect(html).toContain('data-level="yellow"');
  });
});
