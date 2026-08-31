import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  auth,
  redirect,
  notFound,
  mockGetTeacherClass,
  mockGetDictationById,
  mockGetDictationCompletionSummary,
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
  mockGetDictationCompletionSummary: vi.fn(),
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

vi.mock("@/lib/services/get-dictation-completion-summary", () => ({
  getDictationCompletionSummary: mockGetDictationCompletionSummary,
}));

import MobileDictationSummaryPage from "./page";

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

describe("MobileDictationSummaryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated users to login", async () => {
    auth.mockResolvedValueOnce(null);

    await expect(
      MobileDictationSummaryPage({
        params: Promise.resolve({ id: dictationId }),
      })
    ).rejects.toThrow("NEXT_REDIRECT:/login");
  });

  it("redirects users without a class to onboarding", async () => {
    auth.mockResolvedValueOnce({
      user: { id: teacherId, email: "t@example.com" },
      expires: "2099-01-01T00:00:00.000Z",
    });
    mockGetTeacherClass.mockResolvedValueOnce(null);

    await expect(
      MobileDictationSummaryPage({
        params: Promise.resolve({ id: dictationId }),
      })
    ).rejects.toThrow("NEXT_REDIRECT:/onboarding/class");
  });

  it("returns not found for malformed ids", async () => {
    mockAuthenticatedClass();

    await expect(
      MobileDictationSummaryPage({
        params: Promise.resolve({ id: "not-a-uuid" }),
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("returns not found when the dictation does not belong to the class", async () => {
    mockAuthenticatedClass();
    mockGetDictationById.mockResolvedValueOnce(null);

    await expect(
      MobileDictationSummaryPage({
        params: Promise.resolve({ id: dictationId }),
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders the read-only summary with completion counts", async () => {
    mockAuthenticatedClass();
    mockGetDictationById.mockResolvedValueOnce({
      id: dictationId,
      label: "Dictée 1",
      dictationLabelKey: "dictée 1",
      dictationDate: "2026-08-27",
    });
    mockGetDictationCompletionSummary.mockResolvedValueOnce({
      enteredCount: 2,
      totalLeveledCount: 5,
      isComplete: false,
    });

    const html = renderToStaticMarkup(
      await MobileDictationSummaryPage({
        params: Promise.resolve({ id: dictationId }),
      })
    );

    expect(html).toContain("Dictée 1");
    expect(html).toContain("27 août 2026");
    expect(html).toContain("2 sur 5 élèves saisis");
    expect(html).not.toContain("Dictée complète");
    expect(html).toContain('href="/dictations"');
  });

  it("shows the completion badge when every leveled student is entered", async () => {
    mockAuthenticatedClass();
    mockGetDictationById.mockResolvedValueOnce({
      id: dictationId,
      label: "Dictée 1",
      dictationLabelKey: "dictée 1",
      dictationDate: "2026-08-27",
    });
    mockGetDictationCompletionSummary.mockResolvedValueOnce({
      enteredCount: 5,
      totalLeveledCount: 5,
      isComplete: true,
    });

    const html = renderToStaticMarkup(
      await MobileDictationSummaryPage({
        params: Promise.resolve({ id: dictationId }),
      })
    );

    expect(html).toContain("Dictée complète");
    expect(html).toContain("5 sur 5 élèves saisis");
  });

  it("shows guidance when no leveled students are active", async () => {
    mockAuthenticatedClass();
    mockGetDictationById.mockResolvedValueOnce({
      id: dictationId,
      label: "Dictée 1",
      dictationLabelKey: "dictée 1",
      dictationDate: "2026-08-27",
    });
    mockGetDictationCompletionSummary.mockResolvedValueOnce({
      enteredCount: 0,
      totalLeveledCount: 0,
      isComplete: false,
    });

    const html = renderToStaticMarkup(
      await MobileDictationSummaryPage({
        params: Promise.resolve({ id: dictationId }),
      })
    );

    expect(html).toContain("Aucun élève nivelé actif.");
    expect(html).not.toContain("0 sur 0");
  });
});
