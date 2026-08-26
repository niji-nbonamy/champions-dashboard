import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const { auth, mockGetTeacherClass, mockCountActiveStudents } = vi.hoisted(() => ({
  auth: vi.fn(),
  mockGetTeacherClass: vi.fn(),
  mockCountActiveStudents: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth,
}));

vi.mock("@/lib/services/get-teacher-class", () => ({
  getTeacherClass: mockGetTeacherClass,
}));

vi.mock("@/lib/services/count-active-students", () => ({
  countActiveStudents: mockCountActiveStudents,
}));

vi.mock("./csv-import-form", () => ({
  CsvImportForm: () => <div data-testid="csv-import-form" />,
}));

import ConfigPage from "./page";

const teacherId = "550e8400-e29b-41d4-a716-446655440000";
const classId = "660e8400-e29b-41d4-a716-446655440001";

describe("config page", () => {
  it("renders the CSV import form when the roster is empty", async () => {
    auth.mockResolvedValueOnce({
      user: { id: teacherId, email: "t@example.com" },
    });
    mockGetTeacherClass.mockResolvedValueOnce({
      id: classId,
      teacherId,
      schoolYearLabel: "2025-2026",
    });
    mockCountActiveStudents.mockResolvedValueOnce(0);

    const html = renderToStaticMarkup(
      await ConfigPage({ searchParams: Promise.resolve({}) })
    );

    expect(html).toContain("data-testid=\"csv-import-form\"");
  });

  it("renders the existing-roster message when students are present", async () => {
    auth.mockResolvedValueOnce({
      user: { id: teacherId, email: "t@example.com" },
    });
    mockGetTeacherClass.mockResolvedValueOnce({
      id: classId,
      teacherId,
      schoolYearLabel: "2025-2026",
    });
    mockCountActiveStudents.mockResolvedValueOnce(3);

    const html = renderToStaticMarkup(
      await ConfigPage({ searchParams: Promise.resolve({}) })
    );

    expect(html).toContain("La liste d&#x27;élèves existe déjà");
    expect(html).not.toContain("data-testid=\"csv-import-form\"");
  });

  it("renders a singular success message from search params", async () => {
    auth.mockResolvedValueOnce({
      user: { id: teacherId, email: "t@example.com" },
    });
    mockGetTeacherClass.mockResolvedValueOnce({
      id: classId,
      teacherId,
      schoolYearLabel: "2025-2026",
    });
    mockCountActiveStudents.mockResolvedValueOnce(1);

    const html = renderToStaticMarkup(
      await ConfigPage({ searchParams: Promise.resolve({ imported: "1" }) })
    );

    expect(html).toContain("1 élève importé.");
    expect(html).toContain('role="status"');
  });
});
