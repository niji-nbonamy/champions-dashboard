import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  auth,
  redirect,
  notFound,
  mockGetTeacherClass,
  mockGetDictationById,
  mockGetDictationEntriesByDictationId,
  mockListLeveledActiveStudents,
  mockListWordCountMatrixRows,
  mockListPendingPromotionsForStudents,
  mockClassGrid,
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
  mockGetDictationEntriesByDictationId: vi.fn(),
  mockListLeveledActiveStudents: vi.fn(),
  mockListWordCountMatrixRows: vi.fn(),
  mockListPendingPromotionsForStudents: vi.fn(),
  mockClassGrid: vi.fn(),
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

vi.mock("@/lib/services/list-dictations", () => ({
  getDictationById: mockGetDictationById,
}));

vi.mock("@/lib/services/get-dictation-entries", () => ({
  getDictationEntriesByDictationId: mockGetDictationEntriesByDictationId,
}));

vi.mock("@/lib/services/list-leveled-active-students", () => ({
  listLeveledActiveStudents: mockListLeveledActiveStudents,
}));

vi.mock("@/lib/services/list-word-count-matrix-rows", () => ({
  listWordCountMatrixRows: mockListWordCountMatrixRows,
}));

vi.mock("@/lib/services/list-pending-promotions", () => ({
  listPendingPromotionsForStudents: mockListPendingPromotionsForStudents,
}));

vi.mock("@/components/grid/class-grid", () => ({
  ClassGrid: (props: unknown) => {
    mockClassGrid(props);
    return null;
  },
}));

import DictationDetailPage from "./page";

const teacherId = "550e8400-e29b-41d4-a716-446655440000";
const classId = "660e8400-e29b-41d4-a716-446655440001";
const dictationId = "880e8400-e29b-41d4-a716-446655440003";
const marieStudentId = "770e8400-e29b-41d4-a716-446655440002";

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

describe("DictationDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDictationEntriesByDictationId.mockResolvedValue([]);
    mockListPendingPromotionsForStudents.mockResolvedValue({});
  });

  it("redirects unauthenticated users to login", async () => {
    auth.mockResolvedValueOnce(null);

    await expect(
      DictationDetailPage({ params: Promise.resolve({ id: dictationId }) })
    ).rejects.toThrow("NEXT_REDIRECT:/login");
  });

  it("redirects users without a class to onboarding", async () => {
    auth.mockResolvedValueOnce({
      user: { id: teacherId, email: "t@example.com" },
      expires: "2099-01-01T00:00:00.000Z",
    });
    mockGetTeacherClass.mockResolvedValueOnce(null);

    await expect(
      DictationDetailPage({ params: Promise.resolve({ id: dictationId }) })
    ).rejects.toThrow("NEXT_REDIRECT:/onboarding/class");
  });

  it("returns not found for malformed ids", async () => {
    mockAuthenticatedClass();

    await expect(
      DictationDetailPage({ params: Promise.resolve({ id: "not-a-uuid" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(mockGetDictationById).not.toHaveBeenCalled();
    expect(notFound).toHaveBeenCalled();
  });

  it("returns not found when the dictation is outside the class scope", async () => {
    mockAuthenticatedClass();
    mockGetDictationById.mockResolvedValueOnce(null);

    await expect(
      DictationDetailPage({ params: Promise.resolve({ id: dictationId }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(mockGetDictationById).toHaveBeenCalledWith(classId, dictationId);
    expect(notFound).toHaveBeenCalled();
  });

  it("renders the class grid for a scoped dictation", async () => {
    mockAuthenticatedClass();
    mockGetDictationById.mockResolvedValueOnce({
      id: dictationId,
      label: "Dictée 1",
      dictationLabelKey: "dictée 1",
      dictationDate: "2026-08-27",
    });
    mockListLeveledActiveStudents.mockResolvedValueOnce([
      {
        id: marieStudentId,
        displayName: "DUPONT Marie",
        level: "yellow",
      },
    ]);
    mockListWordCountMatrixRows.mockResolvedValueOnce([
      {
        dictationLabelKey: "Dictée 1",
        wordsYellow: 10,
        wordsGreen: 12,
        wordsViolet: 14,
        wordsGold: 16,
      },
    ]);

    const html = renderToStaticMarkup(
      await DictationDetailPage({ params: Promise.resolve({ id: dictationId }) })
    );

    expect(html).toContain("Dictée 1");
    expect(html).toContain('href="/dictations"');
    expect(mockListLeveledActiveStudents).toHaveBeenCalledWith(classId);
    expect(mockListWordCountMatrixRows).toHaveBeenCalledWith(classId);
    expect(mockListPendingPromotionsForStudents).toHaveBeenCalledWith(classId, [
      marieStudentId,
    ]);
    expect(mockClassGrid).toHaveBeenCalledWith(
      expect.objectContaining({
        pendingPromotionsByStudentId: {},
      })
    );
    expect(mockClassGrid).toHaveBeenCalledTimes(1);
  });

  it("passes non-empty pending promotions to ClassGrid on new entry", async () => {
    mockAuthenticatedClass();
    mockGetDictationById.mockResolvedValueOnce({
      id: dictationId,
      label: "Dictée 1",
      dictationLabelKey: "dictée 1",
      dictationDate: "2026-08-27",
    });
    mockListLeveledActiveStudents.mockResolvedValueOnce([
      {
        id: marieStudentId,
        displayName: "DUPONT Marie",
        level: "yellow",
      },
    ]);
    mockListWordCountMatrixRows.mockResolvedValueOnce([
      {
        dictationLabelKey: "Dictée 1",
        wordsYellow: 10,
        wordsGreen: 12,
        wordsViolet: 14,
        wordsGold: 16,
      },
    ]);
    mockListPendingPromotionsForStudents.mockResolvedValueOnce({
      [marieStudentId]: { targetLevel: "green" },
    });

    renderToStaticMarkup(
      await DictationDetailPage({ params: Promise.resolve({ id: dictationId }) })
    );

    expect(mockClassGrid).toHaveBeenCalledWith(
      expect.objectContaining({
        pendingPromotionsByStudentId: {
          [marieStudentId]: { targetLevel: "green" },
        },
      })
    );
  });

  it("passes matrix-derived word totals per student level to ClassGrid (FR13)", async () => {
    mockAuthenticatedClass();
    mockGetDictationById.mockResolvedValueOnce({
      id: dictationId,
      label: "Dictée 1",
      dictationLabelKey: "dictée 1",
      dictationDate: "2026-08-27",
    });
    mockListLeveledActiveStudents.mockResolvedValueOnce([
      {
        id: marieStudentId,
        displayName: "DUPONT Marie",
        level: "yellow",
      },
      {
        id: "770e8400-e29b-41d4-a716-446655440004",
        displayName: "MARTIN Paul",
        level: "green",
      },
    ]);
    mockListWordCountMatrixRows.mockResolvedValueOnce([
      {
        dictationLabelKey: "Dictée 1",
        wordsYellow: 10,
        wordsGreen: 12,
        wordsViolet: 14,
        wordsGold: 16,
      },
    ]);

    renderToStaticMarkup(
      await DictationDetailPage({ params: Promise.resolve({ id: dictationId }) })
    );

    expect(mockClassGrid).toHaveBeenCalledWith(
      expect.objectContaining({
        dictationId,
        wordTotalsByStudentId: {
          [marieStudentId]: 10,
          "770e8400-e29b-41d4-a716-446655440004": 12,
        },
      })
    );
  });

  it("shows a blocking message when the matrix row is missing", async () => {
    mockAuthenticatedClass();
    mockGetDictationById.mockResolvedValueOnce({
      id: dictationId,
      label: "Dictée 1",
      dictationLabelKey: "dictée 1",
      dictationDate: "2026-08-27",
    });
    mockListLeveledActiveStudents.mockResolvedValueOnce([
      {
        id: marieStudentId,
        displayName: "DUPONT Marie",
        level: "yellow",
      },
    ]);
    mockListWordCountMatrixRows.mockResolvedValueOnce([]);

    const html = renderToStaticMarkup(
      await DictationDetailPage({ params: Promise.resolve({ id: dictationId }) })
    );

    expect(html).toContain("Aucune ligne de matrice pour cette dictée");
    expect(html).toContain("Configurez la matrice sur");
    expect(html).toContain('href="/config"');
    expect(html).toContain(">Config</a>");
    expect(html).not.toContain("Config</a> Config");
    expect(mockClassGrid).not.toHaveBeenCalled();
  });

  it("renders the empty leveled roster message when no students are returned", async () => {
    mockAuthenticatedClass();
    mockGetDictationById.mockResolvedValueOnce({
      id: dictationId,
      label: "Dictée 1",
      dictationLabelKey: "dictée 1",
      dictationDate: "2026-08-27",
    });
    mockListLeveledActiveStudents.mockResolvedValueOnce([]);
    mockListWordCountMatrixRows.mockResolvedValueOnce([]);

    const html = renderToStaticMarkup(
      await DictationDetailPage({ params: Promise.resolve({ id: dictationId }) })
    );

    expect(mockClassGrid).toHaveBeenCalledWith(
      expect.objectContaining({
        dictationId,
        students: [],
        wordTotalsByStudentId: {},
      })
    );
    expect(html).not.toContain("Enregistrer");
  });

  it("passes saved entry snapshots and read-only archived ids on reopen", async () => {
    mockAuthenticatedClass();
    mockGetDictationById.mockResolvedValueOnce({
      id: dictationId,
      label: "Dictée 1",
      dictationLabelKey: "dictée 1",
      dictationDate: "2026-08-27",
    });
    mockGetDictationEntriesByDictationId.mockResolvedValueOnce([
      {
        studentId: marieStudentId,
        displayName: "DUPONT Marie",
        archived: false,
        levelAtSave: "yellow",
        wordDenominator: 42,
        globalPercent: 90,
        errorsC: 4,
        errorsH: 0,
        errorsA: 0,
        errorsM: 0,
        errorsP: 0,
        errorsI: 0,
        errorsO: 0,
        errorsN: 0,
        errorsS: 0,
      },
      {
        studentId: "770e8400-e29b-41d4-a716-446655440099",
        displayName: "ANCIEN Léa",
        archived: true,
        levelAtSave: "yellow",
        wordDenominator: 40,
        globalPercent: 88,
        errorsC: 5,
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
    mockListLeveledActiveStudents.mockResolvedValueOnce([
      {
        id: marieStudentId,
        displayName: "DUPONT Marie",
        level: "yellow",
      },
    ]);
    mockListPendingPromotionsForStudents.mockResolvedValueOnce({
      [marieStudentId]: { targetLevel: "green" },
    });

    renderToStaticMarkup(
      await DictationDetailPage({ params: Promise.resolve({ id: dictationId }) })
    );

    expect(mockClassGrid).toHaveBeenCalledWith(
      expect.objectContaining({
        dictationId,
        students: [
          {
            id: marieStudentId,
            displayName: "DUPONT Marie",
            level: "yellow",
          },
          {
            id: "770e8400-e29b-41d4-a716-446655440099",
            displayName: "ANCIEN Léa",
            level: "yellow",
          },
        ],
        wordTotalsByStudentId: {
          [marieStudentId]: 42,
          "770e8400-e29b-41d4-a716-446655440099": 40,
        },
        initialCounts: {
          [marieStudentId]: expect.objectContaining({ C: 4 }),
          "770e8400-e29b-41d4-a716-446655440099": expect.objectContaining({
            C: 5,
          }),
        },
        readOnlyStudentIds: ["770e8400-e29b-41d4-a716-446655440099"],
      })
    );
    expect(mockListPendingPromotionsForStudents).toHaveBeenCalledWith(classId, [
      marieStudentId,
      "770e8400-e29b-41d4-a716-446655440099",
    ]);
    expect(mockClassGrid).toHaveBeenCalledWith(
      expect.objectContaining({
        pendingPromotionsByStudentId: {
          [marieStudentId]: { targetLevel: "green" },
        },
      })
    );
  });

  it("renders the grid with an empty pending map when pending lookup fails", async () => {
    mockAuthenticatedClass();
    mockGetDictationById.mockResolvedValueOnce({
      id: dictationId,
      label: "Dictée 1",
      dictationLabelKey: "dictée 1",
      dictationDate: "2026-08-27",
    });
    mockListLeveledActiveStudents.mockResolvedValueOnce([
      {
        id: marieStudentId,
        displayName: "DUPONT Marie",
        level: "yellow",
      },
    ]);
    mockListWordCountMatrixRows.mockResolvedValueOnce([
      {
        dictationLabelKey: "Dictée 1",
        wordsYellow: 10,
        wordsGreen: 12,
        wordsViolet: 14,
        wordsGold: 16,
      },
    ]);
    mockListPendingPromotionsForStudents.mockRejectedValueOnce(
      new Error("database unavailable")
    );

    renderToStaticMarkup(
      await DictationDetailPage({ params: Promise.resolve({ id: dictationId }) })
    );

    expect(mockClassGrid).toHaveBeenCalledWith(
      expect.objectContaining({
        pendingPromotionsByStudentId: {},
      })
    );
  });
});
