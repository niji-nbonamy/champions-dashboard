import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  auth,
  redirect,
  notFound,
  mockGetTeacherClass,
  mockGetDictationById,
  mockGetClassStudent,
  mockListLeveledActiveStudents,
  mockGetDictationEntriesByDictationId,
  mockListWordCountMatrixRows,
} = vi.hoisted(() => ({
  auth: vi.fn(),
  redirect: vi.fn((url: string): never => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  notFound: vi.fn((): never => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  mockGetTeacherClass: vi.fn(),
  mockGetDictationById: vi.fn(),
  mockGetClassStudent: vi.fn(),
  mockListLeveledActiveStudents: vi.fn(),
  mockGetDictationEntriesByDictationId: vi.fn(),
  mockListWordCountMatrixRows: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth,
}));

vi.mock("next/navigation", () => ({
  redirect,
  notFound,
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/lib/services/get-teacher-class", () => ({
  getTeacherClass: mockGetTeacherClass,
}));

vi.mock("@/lib/services/list-dictations", () => ({
  getDictationById: mockGetDictationById,
}));

vi.mock("@/lib/services/get-class-student", () => ({
  getClassStudent: mockGetClassStudent,
}));

vi.mock("@/lib/services/list-leveled-active-students", () => ({
  listLeveledActiveStudents: mockListLeveledActiveStudents,
}));

vi.mock("@/lib/services/get-dictation-entries", () => ({
  getDictationEntriesByDictationId: mockGetDictationEntriesByDictationId,
}));

vi.mock("@/lib/services/list-word-count-matrix-rows", () => ({
  listWordCountMatrixRows: mockListWordCountMatrixRows,
}));

import MobileStudentEntryPage from "./page";

const teacherId = "550e8400-e29b-41d4-a716-446655440000";
const classId = "660e8400-e29b-41d4-a716-446655440001";
const dictationId = "880e8400-e29b-41d4-a716-446655440003";
const studentId = "770e8400-e29b-41d4-a716-446655440002";

describe("MobileStudentEntryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockResolvedValue({ user: { id: teacherId } });
    mockGetTeacherClass.mockResolvedValue({ id: classId });
    mockGetDictationById.mockResolvedValue({
      id: dictationId,
      label: "Dictée 1",
      dictationLabelKey: "dictée 1",
    });
    mockGetClassStudent.mockResolvedValue({
      id: studentId,
      displayName: "DUPONT Marie",
      level: "yellow",
      archived: false,
    });
    mockListLeveledActiveStudents.mockResolvedValue([
      {
        id: studentId,
        displayName: "DUPONT Marie",
        level: "yellow",
      },
    ]);
    mockGetDictationEntriesByDictationId.mockResolvedValue([
      {
        studentId,
        displayName: "DUPONT Marie",
        archived: false,
        levelAtSave: "yellow",
        wordDenominator: 50,
        globalPercent: 96,
        errorsC: 2,
        errorsH: 0,
        errorsA: 0,
        errorsM: 0,
        errorsP: 0,
        errorsI: 0,
        errorsO: 0,
        errorsN: 0,
        errorsS: 0,
      },
    ]);
    mockListWordCountMatrixRows.mockResolvedValue([
      {
        dictationLabelKey: "dictée 1",
        wordsYellow: 50,
        wordsGreen: 60,
        wordsViolet: 70,
        wordsGold: 80,
      },
    ]);
  });

  it("redirects unauthenticated users to login", async () => {
    auth.mockResolvedValueOnce(null);

    await expect(
      MobileStudentEntryPage({
        params: Promise.resolve({ id: dictationId, studentId }),
      })
    ).rejects.toThrow("NEXT_REDIRECT:/login");
  });

  it("returns notFound for an unknown student", async () => {
    mockGetClassStudent.mockResolvedValueOnce(null);

    await expect(
      MobileStudentEntryPage({
        params: Promise.resolve({ id: dictationId, studentId }),
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("returns notFound for an archived student", async () => {
    mockGetClassStudent.mockResolvedValueOnce({
      id: studentId,
      displayName: "DUPONT Marie",
      level: "yellow",
      archived: true,
    });

    await expect(
      MobileStudentEntryPage({
        params: Promise.resolve({ id: dictationId, studentId }),
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("blocks unleveled students with the FR39 message", async () => {
    mockGetClassStudent.mockResolvedValueOnce({
      id: studentId,
      displayName: "DUPONT Marie",
      level: null,
      archived: false,
    });

    const page = await MobileStudentEntryPage({
      params: Promise.resolve({ id: dictationId, studentId }),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain(
      "Niveau requis pour DUPONT Marie. Assignez le niveau depuis un ordinateur."
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain("Retour à la liste");
    expect(html).not.toContain("Enregistrer");
    expect(html).not.toContain('inputmode="numeric"');
    expect(html).not.toContain("Conjugaison");
    expect(html).not.toContain('href="/students"');
    expect(mockListLeveledActiveStudents).not.toHaveBeenCalled();
    expect(mockGetDictationEntriesByDictationId).not.toHaveBeenCalled();
    expect(mockListWordCountMatrixRows).not.toHaveBeenCalled();
  });

  it("limits prev/next navigation to leveled students only", async () => {
    const firstLeveledId = "770e8400-e29b-41d4-a716-446655440002";
    const middleLeveledId = "770e8400-e29b-41d4-a716-446655440004";
    const thirdLeveledId = "770e8400-e29b-41d4-a716-446655440006";
    const unleveledId = "770e8400-e29b-41d4-a716-446655440008";

    mockGetClassStudent.mockResolvedValueOnce({
      id: middleLeveledId,
      displayName: "MARTIN Paul",
      level: "green",
      archived: false,
    });
    mockListLeveledActiveStudents.mockResolvedValueOnce([
      {
        id: firstLeveledId,
        displayName: "DUPONT Marie",
        level: "yellow",
      },
      {
        id: middleLeveledId,
        displayName: "MARTIN Paul",
        level: "green",
      },
      {
        id: thirdLeveledId,
        displayName: "BERNARD Eve",
        level: "violet",
      },
    ]);
    mockGetDictationEntriesByDictationId.mockResolvedValueOnce([]);

    const page = await MobileStudentEntryPage({
      params: Promise.resolve({ id: dictationId, studentId: middleLeveledId }),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain(
      `href="/dictations/${dictationId}/mobile/${firstLeveledId}"`
    );
    expect(html).toContain(
      `href="/dictations/${dictationId}/mobile/${thirdLeveledId}"`
    );
    expect(html).not.toContain(
      `href="/dictations/${dictationId}/mobile/${unleveledId}"`
    );
  });

  it("renders the per-student form with pre-filled counts", async () => {
    const page = await MobileStudentEntryPage({
      params: Promise.resolve({ id: dictationId, studentId }),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("DUPONT Marie");
    expect(html).toContain("DUPONT Marie, Conjugaison, 2 erreurs");
    expect(html).toContain("Enregistrer");
    expect(html).toContain("Retour à la liste");
  });

  it("shows a matrix error instead of notFound when no matrix row matches", async () => {
    mockGetDictationEntriesByDictationId.mockResolvedValueOnce([]);
    mockListWordCountMatrixRows.mockResolvedValueOnce([]);

    const page = await MobileStudentEntryPage({
      params: Promise.resolve({ id: dictationId, studentId }),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("matrice de mots");
    expect(html).toContain('role="alert"');
  });
});
