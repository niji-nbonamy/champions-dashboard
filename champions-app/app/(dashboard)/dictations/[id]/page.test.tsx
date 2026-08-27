import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const {
  auth,
  redirect,
  notFound,
  mockGetTeacherClass,
  mockGetDictationById,
  mockListLeveledActiveStudents,
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
  mockListLeveledActiveStudents: vi.fn(),
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

vi.mock("@/lib/services/list-leveled-active-students", () => ({
  listLeveledActiveStudents: mockListLeveledActiveStudents,
}));

import DictationDetailPage from "./page";

const teacherId = "550e8400-e29b-41d4-a716-446655440000";
const classId = "660e8400-e29b-41d4-a716-446655440001";
const dictationId = "880e8400-e29b-41d4-a716-446655440003";

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
        id: "770e8400-e29b-41d4-a716-446655440002",
        displayName: "DUPONT Marie",
        level: "yellow",
      },
    ]);

    const html = renderToStaticMarkup(
      await DictationDetailPage({ params: Promise.resolve({ id: dictationId }) })
    );

    expect(html).toContain("Dictée 1");
    expect(html).toContain("DUPONT Marie");
    expect(html).toContain("jaune");
    expect(html).toContain('href="/dictations"');
    expect(html).toContain("Conjugaison");
    expect(mockListLeveledActiveStudents).toHaveBeenCalledWith(classId);
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

    const html = renderToStaticMarkup(
      await DictationDetailPage({ params: Promise.resolve({ id: dictationId }) })
    );

    expect(html).toContain("Aucun élève nivelé");
    expect(html).toContain('href="/students"');
  });
});
