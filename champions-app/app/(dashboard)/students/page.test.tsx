import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const {
  auth,
  mockGetTeacherClass,
  mockGetYearStartWizardStatus,
  mockListClassStudents,
} = vi.hoisted(() => ({
  auth: vi.fn(),
  mockGetTeacherClass: vi.fn(),
  mockGetYearStartWizardStatus: vi.fn(),
  mockListClassStudents: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth,
}));

vi.mock("@/lib/services/get-teacher-class", () => ({
  getTeacherClass: mockGetTeacherClass,
}));

vi.mock("@/lib/services/get-year-start-wizard-status", () => ({
  getYearStartWizardStatus: mockGetYearStartWizardStatus,
}));

vi.mock("@/lib/services/list-class-students", () => ({
  listClassStudents: mockListClassStudents,
}));

vi.mock("./add-student-form", () => ({
  AddStudentForm: () => <div data-testid="add-student-form" />,
}));

vi.mock("./roster-filter", () => ({
  RosterFilter: ({ current }: { current: string }) => (
    <div data-testid={`roster-filter-${current}`} />
  ),
}));

vi.mock("./level-dot-picker", () => ({
  LevelDotPicker: ({ studentId }: { studentId: string }) => (
    <div data-testid={`level-dot-picker-${studentId}`} />
  ),
}));

import StudentsPage from "./page";

const teacherId = "550e8400-e29b-41d4-a716-446655440000";
const classId = "660e8400-e29b-41d4-a716-446655440001";

function mockClassContext() {
  auth.mockResolvedValueOnce({
    user: { id: teacherId, email: "t@example.com" },
  });
  mockGetTeacherClass.mockResolvedValueOnce({
    id: classId,
    teacherId,
    schoolYearLabel: "2025-2026",
  });
  mockGetYearStartWizardStatus.mockResolvedValueOnce({
    completed: true,
    step: 3,
    activeStudentCount: 1,
    unassignedCount: 0,
    matrixRowCount: 4,
  });
}

describe("students page", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the add form and empty roster state", async () => {
    mockClassContext();
    mockListClassStudents.mockResolvedValueOnce([]);

    const html = renderToStaticMarkup(
      await StudentsPage({ searchParams: Promise.resolve({}) })
    );

    expect(html).toContain('data-testid="add-student-form"');
    expect(html).toContain("Aucun élève actif pour le moment.");
    expect(html).toContain('data-testid="roster-filter-active"');
    expect(mockListClassStudents).toHaveBeenCalledWith(classId, "active");
  });

  it("renders active students with level status", async () => {
    mockClassContext();
    mockListClassStudents.mockResolvedValueOnce([
      {
        id: "770e8400-e29b-41d4-a716-446655440002",
        displayName: "DUPONT Marie",
        level: null,
        archived: false,
      },
      {
        id: "880e8400-e29b-41d4-a716-446655440003",
        displayName: "MARTIN Lucas",
        level: "yellow",
        archived: false,
      },
    ]);

    const html = renderToStaticMarkup(
      await StudentsPage({ searchParams: Promise.resolve({}) })
    );

    expect(html).toContain("DUPONT Marie");
    expect(html).toContain("niveau requis");
    expect(html).toContain(
      'data-testid="level-dot-picker-770e8400-e29b-41d4-a716-446655440002"'
    );
    expect(html).toContain("MARTIN Lucas");
    expect(html).toContain(
      'data-testid="level-dot-picker-880e8400-e29b-41d4-a716-446655440003"'
    );
    expect(mockListClassStudents).toHaveBeenCalledWith(classId, "active");
  });

  it("loads all students when the all filter is selected", async () => {
    mockClassContext();
    mockListClassStudents.mockResolvedValueOnce([]);

    const html = renderToStaticMarkup(
      await StudentsPage({
        searchParams: Promise.resolve({ filter: "all" }),
      })
    );

    expect(html).toContain("Aucun élève pour le moment.");
    expect(html).toContain('data-testid="roster-filter-all"');
    expect(mockListClassStudents).toHaveBeenCalledWith(classId, "all");
  });

  it("hides archive buttons when the year-start wizard is incomplete", async () => {
    auth.mockResolvedValueOnce({
      user: { id: teacherId, email: "t@example.com" },
    });
    mockGetTeacherClass.mockResolvedValueOnce({
      id: classId,
      teacherId,
      schoolYearLabel: "2025-2026",
    });
    mockGetYearStartWizardStatus.mockResolvedValueOnce({
      completed: false,
      step: 1,
      activeStudentCount: 1,
      unassignedCount: 0,
      matrixRowCount: 0,
    });
    mockListClassStudents.mockResolvedValueOnce([
      {
        id: "770e8400-e29b-41d4-a716-446655440002",
        displayName: "DUPONT Marie",
        level: "yellow",
        archived: false,
      },
    ]);

    const html = renderToStaticMarkup(
      await StudentsPage({ searchParams: Promise.resolve({}) })
    );

    expect(html).not.toContain("Archiver");
  });

  it("shows archive buttons when the year-start wizard is complete", async () => {
    mockClassContext();
    mockListClassStudents.mockResolvedValueOnce([
      {
        id: "770e8400-e29b-41d4-a716-446655440002",
        displayName: "DUPONT Marie",
        level: "yellow",
        archived: false,
      },
    ]);

    const html = renderToStaticMarkup(
      await StudentsPage({ searchParams: Promise.resolve({}) })
    );

    expect(html).toContain("Archiver");
  });

  it("loads archived students when the archived filter is selected", async () => {
    mockClassContext();
    mockListClassStudents.mockResolvedValueOnce([]);

    const html = renderToStaticMarkup(
      await StudentsPage({
        searchParams: Promise.resolve({ filter: "archived" }),
      })
    );

    expect(html).toContain("Aucun élève archivé.");
    expect(html).toContain('data-testid="roster-filter-archived"');
    expect(mockListClassStudents).toHaveBeenCalledWith(classId, "archived");
  });

  it("shows the archive success notice after redirect", async () => {
    mockClassContext();
    mockListClassStudents.mockResolvedValueOnce([]);

    const html = renderToStaticMarkup(
      await StudentsPage({
        searchParams: Promise.resolve({ notice: "archived" }),
      })
    );

    expect(html).toContain("Élève archivé.");
  });

  it("does not load students when no class exists", async () => {
    auth.mockResolvedValueOnce({
      user: { id: teacherId, email: "t@example.com" },
    });
    mockGetTeacherClass.mockResolvedValueOnce(null);

    const html = renderToStaticMarkup(
      await StudentsPage({ searchParams: Promise.resolve({}) })
    );

    expect(mockListClassStudents).not.toHaveBeenCalled();
    expect(mockGetYearStartWizardStatus).not.toHaveBeenCalled();
    expect(html).toContain("Aucun élève actif pour le moment.");
  });
});
