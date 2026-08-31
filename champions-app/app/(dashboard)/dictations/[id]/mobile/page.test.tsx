import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  auth,
  redirect,
  notFound,
  mockGetTeacherClass,
  mockGetDictationById,
  mockListLeveledActiveStudents,
  mockGetDictationEntriesByDictationId,
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
  mockGetDictationEntriesByDictationId: vi.fn(),
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

vi.mock("@/lib/services/get-dictation-entries", () => ({
  getDictationEntriesByDictationId: mockGetDictationEntriesByDictationId,
}));

import MobileDictationPage from "./page";

const teacherId = "550e8400-e29b-41d4-a716-446655440000";
const classId = "660e8400-e29b-41d4-a716-446655440001";
const dictationId = "880e8400-e29b-41d4-a716-446655440003";

describe("MobileDictationPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockResolvedValue({ user: { id: teacherId } });
    mockGetTeacherClass.mockResolvedValue({ id: classId });
    mockGetDictationById.mockResolvedValue({
      id: dictationId,
      label: "Dictée 1",
      dictationLabelKey: "dictée 1",
    });
    mockListLeveledActiveStudents.mockResolvedValue([
      {
        id: "770e8400-e29b-41d4-a716-446655440002",
        displayName: "DUPONT Marie",
        level: "yellow",
      },
      {
        id: "770e8400-e29b-41d4-a716-446655440004",
        displayName: "MARTIN Paul",
        level: "green",
      },
    ]);
    mockGetDictationEntriesByDictationId.mockResolvedValue([
      {
        studentId: "770e8400-e29b-41d4-a716-446655440002",
        archived: false,
      },
    ]);
  });

  it("renders the picker with remaining count and saisi state", async () => {
    const page = await MobileDictationPage({
      params: Promise.resolve({ id: dictationId }),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Sélectionnez un élève");
    expect(html).toContain("Dictée 1");
    expect(html).toContain("1 restant");
    expect(html).toContain("saisi");
    expect(html).toContain("Marie");
    expect(html).toContain("Paul");
  });
});
