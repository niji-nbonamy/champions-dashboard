import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const { auth, mockGetTeacherClass, mockListActiveStudents } = vi.hoisted(() => ({
  auth: vi.fn(),
  mockGetTeacherClass: vi.fn(),
  mockListActiveStudents: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth,
}));

vi.mock("@/lib/services/get-teacher-class", () => ({
  getTeacherClass: mockGetTeacherClass,
}));

vi.mock("@/lib/services/list-active-students", () => ({
  listActiveStudents: mockListActiveStudents,
}));

vi.mock("./add-student-form", () => ({
  AddStudentForm: () => <div data-testid="add-student-form" />,
}));

import StudentsPage from "./page";

const teacherId = "550e8400-e29b-41d4-a716-446655440000";
const classId = "660e8400-e29b-41d4-a716-446655440001";

describe("students page", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the add form and empty roster state", async () => {
    auth.mockResolvedValueOnce({
      user: { id: teacherId, email: "t@example.com" },
    });
    mockGetTeacherClass.mockResolvedValueOnce({
      id: classId,
      teacherId,
      schoolYearLabel: "2025-2026",
    });
    mockListActiveStudents.mockResolvedValueOnce([]);

    const html = renderToStaticMarkup(await StudentsPage());

    expect(html).toContain("data-testid=\"add-student-form\"");
    expect(html).toContain("Aucun élève actif pour le moment.");
    expect(mockListActiveStudents).toHaveBeenCalledWith(classId);
  });

  it("renders active students with level status", async () => {
    auth.mockResolvedValueOnce({
      user: { id: teacherId, email: "t@example.com" },
    });
    mockGetTeacherClass.mockResolvedValueOnce({
      id: classId,
      teacherId,
      schoolYearLabel: "2025-2026",
    });
    mockListActiveStudents.mockResolvedValueOnce([
      {
        id: "770e8400-e29b-41d4-a716-446655440002",
        displayName: "DUPONT Marie",
        level: null,
      },
      {
        id: "880e8400-e29b-41d4-a716-446655440003",
        displayName: "MARTIN Lucas",
        level: "yellow",
      },
    ]);

    const html = renderToStaticMarkup(await StudentsPage());

    expect(html).toContain("DUPONT Marie");
    expect(html).toContain("Niveau non assigné");
    expect(html).toContain("MARTIN Lucas");
    expect(html).toContain("yellow");
    expect(mockListActiveStudents).toHaveBeenCalledWith(classId);
  });

  it("does not load students when no class exists", async () => {
    auth.mockResolvedValueOnce({
      user: { id: teacherId, email: "t@example.com" },
    });
    mockGetTeacherClass.mockResolvedValueOnce(null);

    const html = renderToStaticMarkup(await StudentsPage());

    expect(mockListActiveStudents).not.toHaveBeenCalled();
    expect(html).toContain("Aucun élève actif pour le moment.");
  });
});
