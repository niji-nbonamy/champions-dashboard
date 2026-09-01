import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const {
  auth,
  mockGetTeacherClass,
  mockCountActiveStudents,
  mockListWordCountMatrixRows,
  capturedInitialRows,
} = vi.hoisted(() => ({
  auth: vi.fn(),
  mockGetTeacherClass: vi.fn(),
  mockCountActiveStudents: vi.fn(),
  mockListWordCountMatrixRows: vi.fn(),
  capturedInitialRows: { value: null as unknown },
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

vi.mock("./word-count-matrix-form", () => ({
  WordCountMatrixForm: ({
    initialRows,
  }: {
    initialRows: Array<Record<string, string>>;
  }) => {
    capturedInitialRows.value = initialRows;
    return <div data-testid="word-count-matrix-form" />;
  },
}));

vi.mock("./year-reset-section", () => ({
  YearResetSection: ({
    currentSchoolYearLabel,
  }: {
    currentSchoolYearLabel: string;
  }) => (
    <section id="reset-annuel" data-testid="year-reset-section">
      <button type="button">Remettre à zéro pour la nouvelle année</button>
      <span data-testid="current-school-year-label">{currentSchoolYearLabel}</span>
    </section>
  ),
}));

vi.mock("@/lib/services/list-word-count-matrix-rows", () => ({
  listWordCountMatrixRows: mockListWordCountMatrixRows,
}));

import ConfigPage from "./page";

const teacherId = "550e8400-e29b-41d4-a716-446655440000";
const classId = "660e8400-e29b-41d4-a716-446655440001";

describe("config page", () => {
  it("renders the empty roster message, anchor, and CSV import form", async () => {
    auth.mockResolvedValueOnce({
      user: { id: teacherId, email: "t@example.com" },
    });
    mockGetTeacherClass.mockResolvedValueOnce({
      id: classId,
      teacherId,
      schoolYearLabel: "2025-2026",
    });
    mockCountActiveStudents.mockResolvedValueOnce(0);
    mockListWordCountMatrixRows.mockResolvedValueOnce([]);

    const html = renderToStaticMarkup(
      await ConfigPage()
    );

    expect(html).toContain("Importez votre liste d&#x27;élèves pour commencer.");
    expect(html).toContain('id="liste-eleves"');
    expect(html).toContain('id="matrice-mots"');
    const scrollMarginClass =
      "scroll-mt-[var(--spacing-dashboard-chrome-height)]";
    expect(html).toContain(scrollMarginClass);
    expect(html.split(scrollMarginClass).length - 1).toBe(2);
    expect(html).not.toContain("Importer la liste");
    expect(html).not.toContain('href="/config#liste-eleves"');
    expect(html).toContain("data-testid=\"csv-import-form\"");
    expect(html).toContain("data-testid=\"word-count-matrix-form\"");
    expect(html).toContain("Matrice mots");
    expect(html).toContain("data-testid=\"year-reset-section\"");
    expect(html).toContain("Remettre à zéro pour la nouvelle année");
    expect(html).toContain("2025-2026");
    expect(html).not.toContain("pour configurer l");
    expect(mockListWordCountMatrixRows).toHaveBeenCalledWith(classId);
    expect(capturedInitialRows.value).toEqual([]);
  });

  it("maps persisted matrix rows to form initialRows", async () => {
    auth.mockResolvedValueOnce({
      user: { id: teacherId, email: "t@example.com" },
    });
    mockGetTeacherClass.mockResolvedValueOnce({
      id: classId,
      teacherId,
      schoolYearLabel: "2025-2026",
    });
    mockCountActiveStudents.mockResolvedValueOnce(1);
    mockListWordCountMatrixRows.mockResolvedValueOnce([
      {
        dictationLabelKey: "Dictée A",
        wordsYellow: 10,
        wordsGreen: 12,
        wordsViolet: 14,
        wordsGold: 16,
      },
    ]);

    renderToStaticMarkup(
      await ConfigPage()
    );

    expect(mockListWordCountMatrixRows).toHaveBeenCalledWith(classId);
    expect(capturedInitialRows.value).toEqual([
      {
        label: "Dictée A",
        wordsYellow: "10",
        wordsGreen: "12",
        wordsViolet: "14",
        wordsGold: "16",
      },
    ]);
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
    mockListWordCountMatrixRows.mockResolvedValueOnce([]);

    const html = renderToStaticMarkup(
      await ConfigPage()
    );

    expect(html).toContain("La liste d&#x27;élèves existe déjà");
    expect(html).toContain("pour configurer l");
    expect(html).not.toContain("Importez votre liste d&#x27;élèves pour commencer.");
    expect(html).not.toContain("data-testid=\"csv-import-form\"");
    expect(html).toContain("data-testid=\"word-count-matrix-form\"");
    expect(html).toContain("Matrice mots");
    expect(html).toContain("Remettre à zéro pour la nouvelle année");
  });

  it("does not render the year reset section when the teacher has no class", async () => {
    vi.clearAllMocks();
    auth.mockResolvedValueOnce({
      user: { id: teacherId, email: "t@example.com" },
    });
    mockGetTeacherClass.mockResolvedValueOnce(null);

    const html = renderToStaticMarkup(
      await ConfigPage()
    );

    expect(html).not.toContain("data-testid=\"year-reset-section\"");
    expect(html).not.toContain('id="reset-annuel"');
    expect(mockCountActiveStudents).not.toHaveBeenCalled();
    expect(mockListWordCountMatrixRows).not.toHaveBeenCalled();
  });
});
