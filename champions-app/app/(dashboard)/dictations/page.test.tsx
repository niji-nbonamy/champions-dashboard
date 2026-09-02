import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const {
  auth,
  redirect,
  mockGetTeacherClass,
  mockGetYearStartWizardStatus,
  mockListDictations,
  mockListWordCountMatrixRows,
  mockGetDictationCompletionSummary,
} = vi.hoisted(() => ({
  auth: vi.fn(),
  redirect: vi.fn((url: string): never => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  mockGetTeacherClass: vi.fn(),
  mockGetYearStartWizardStatus: vi.fn(),
  mockListDictations: vi.fn(),
  mockListWordCountMatrixRows: vi.fn(),
  mockGetDictationCompletionSummary: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth,
}));

vi.mock("next/navigation", () => ({
  redirect,
}));

vi.mock("@/lib/services/get-teacher-class", () => ({
  getTeacherClass: mockGetTeacherClass,
}));

vi.mock("@/lib/services/get-year-start-wizard-status", () => ({
  getYearStartWizardStatus: mockGetYearStartWizardStatus,
}));

vi.mock("@/lib/services/list-dictations", () => ({
  listDictations: mockListDictations,
}));

vi.mock("@/lib/services/list-word-count-matrix-rows", () => ({
  listWordCountMatrixRows: mockListWordCountMatrixRows,
}));

vi.mock("@/lib/services/get-dictation-completion-summary", () => ({
  getDictationCompletionSummary: mockGetDictationCompletionSummary,
}));

import {
  CONFIG_FIRST_CTA_LABEL,
  CONFIG_FIRST_HINT_MESSAGE,
} from "@/lib/domain/dictation-readiness";

import DictationsPage from "./page";

const teacherId = "550e8400-e29b-41d4-a716-446655440000";
const classId = "660e8400-e29b-41d4-a716-446655440001";

function mockAuthenticatedClass(
  options: {
    dictations?: Array<{
      id: string;
      label: string;
      dictationLabelKey: string;
      dictationDate: string;
    }>;
    matrixRows?: Array<{
      dictationLabelKey: string;
      wordsYellow: number;
      wordsGreen: number;
      wordsViolet: number;
      wordsGold: number;
    }>;
  } = {}
) {
  auth.mockResolvedValueOnce({
    user: { id: teacherId, email: "t@example.com" },
    expires: "2099-01-01T00:00:00.000Z",
  });
  mockGetTeacherClass.mockResolvedValueOnce({
    id: classId,
    teacherId,
    schoolYearLabel: "2025-2026",
  });
  mockListDictations.mockResolvedValueOnce(options.dictations ?? []);
  mockListWordCountMatrixRows.mockResolvedValueOnce(options.matrixRows ?? []);
}

describe("DictationsPage", () => {
  it("redirects unauthenticated users to login", async () => {
    auth.mockResolvedValueOnce(null);

    await expect(DictationsPage()).rejects.toThrow("NEXT_REDIRECT:/login");
  });

  it("redirects users without a class to onboarding", async () => {
    auth.mockResolvedValueOnce({
      user: { id: teacherId, email: "t@example.com" },
      expires: "2099-01-01T00:00:00.000Z",
    });
    mockGetTeacherClass.mockResolvedValueOnce(null);

    await expect(DictationsPage()).rejects.toThrow(
      "NEXT_REDIRECT:/onboarding/class"
    );
  });

  it("renders the empty roster pre-setup state with a Config CTA", async () => {
    mockAuthenticatedClass();
    mockGetYearStartWizardStatus.mockResolvedValueOnce({
      completed: false,
      step: 1,
      activeStudentCount: 0,
      leveledActiveStudentCount: 0,
      unassignedCount: 0,
      matrixRowCount: 0,
    });

    const html = renderToStaticMarkup(await DictationsPage());

    expect(html).toContain("Importez votre liste d&#x27;élèves pour commencer.");
    expect(html).toContain('href="/config#liste-eleves"');
    expect(html).toContain("Importer la liste");
    expect(html).toContain("Nouvelle dictée");
    expect(html).toContain("disabled=\"\"");
    expect(html).not.toContain("Configurez votre année scolaire pour préparer les dictées.");
    expect(html).not.toContain("Configurez la matrice sur Config");
    expect(html).not.toContain('href="/config#matrice-mots"');
  });

  it("renders a disabled create button when the matrix is missing", async () => {
    mockAuthenticatedClass();
    mockGetYearStartWizardStatus.mockResolvedValueOnce({
      completed: false,
      step: 2,
      activeStudentCount: 2,
      leveledActiveStudentCount: 1,
      unassignedCount: 1,
      matrixRowCount: 0,
    });

    const html = renderToStaticMarkup(await DictationsPage());

    expect(html).toContain("Dictées");
    expect(html).toContain("Nouvelle dictée");
    expect(html).toContain("disabled=\"\"");
    expect(html).toContain("Configurez la matrice sur Config pour créer une dictée.");
    expect(html).toContain("Configurer la matrice");
    expect(html).toContain('href="/config#matrice-mots"');
    expect(html).not.toContain("Importez votre liste d&#x27;élèves pour commencer.");
  });

  it("renders a disabled create button when all active students are unassigned", async () => {
    mockAuthenticatedClass();
    mockGetYearStartWizardStatus.mockResolvedValueOnce({
      completed: false,
      step: 2,
      activeStudentCount: 2,
      leveledActiveStudentCount: 0,
      unassignedCount: 2,
      matrixRowCount: 1,
    });

    const html = renderToStaticMarkup(await DictationsPage());

    expect(html).toContain("disabled=\"\"");
    expect(html).toContain("Attribuez un niveau à vos élèves pour créer une dictée.");
    expect(html).toContain("Attribuer les niveaux");
    expect(html).toContain('href="/students"');
    expect(html).not.toContain("Configurez la matrice sur Config");
  });

  it("keeps the create button disabled when wizard is complete but roster is empty", async () => {
    mockAuthenticatedClass();
    mockGetYearStartWizardStatus.mockResolvedValueOnce({
      completed: true,
      step: 3,
      activeStudentCount: 0,
      leveledActiveStudentCount: 0,
      unassignedCount: 0,
      matrixRowCount: 0,
    });

    const html = renderToStaticMarkup(await DictationsPage());

    expect(html).toContain("disabled=\"\"");
    expect(html).toContain("Importez votre liste d&#x27;élèves pour commencer.");
    expect(html).not.toContain("Configurez votre année scolaire pour préparer les dictées.");
    expect(html).not.toContain("Configurez la matrice sur Config");
  });

  it("keeps the create button disabled when wizard is complete but matrix is missing", async () => {
    mockAuthenticatedClass();
    mockGetYearStartWizardStatus.mockResolvedValueOnce({
      completed: true,
      step: 3,
      activeStudentCount: 2,
      leveledActiveStudentCount: 2,
      unassignedCount: 0,
      matrixRowCount: 0,
    });

    const html = renderToStaticMarkup(await DictationsPage());

    expect(html).toContain("disabled=\"\"");
    expect(html).toContain("Configurer la matrice");
    expect(html).toContain('href="/config#matrice-mots"');
  });

  it("shows both level and matrix guidance when students are unassigned and matrix is missing", async () => {
    mockAuthenticatedClass();
    mockGetYearStartWizardStatus.mockResolvedValueOnce({
      completed: false,
      step: 2,
      activeStudentCount: 2,
      leveledActiveStudentCount: 0,
      unassignedCount: 2,
      matrixRowCount: 0,
    });

    const html = renderToStaticMarkup(await DictationsPage());

    expect(html).toContain("Attribuer les niveaux");
    expect(html).toContain('href="/students"');
    expect(html).toContain("Configurer la matrice");
    expect(html).toContain('href="/config#matrice-mots"');
  });

  it("keeps blocking guidance visible when history exists but creation is blocked", async () => {
    mockAuthenticatedClass({
      dictations: [
        {
          id: "880e8400-e29b-41d4-a716-446655440003",
          label: "Dictée 1",
          dictationLabelKey: "dictée 1",
          dictationDate: "2026-08-27",
        },
      ],
    });
    mockGetYearStartWizardStatus.mockResolvedValueOnce({
      completed: true,
      step: 2,
      activeStudentCount: 2,
      leveledActiveStudentCount: 0,
      unassignedCount: 2,
      matrixRowCount: 1,
    });

    const html = renderToStaticMarkup(await DictationsPage());

    expect(html).toContain("Historique");
    expect(html).toContain("Attribuez un niveau à vos élèves pour créer une dictée.");
    expect(html).toContain("disabled=\"\"");
  });

  it("excludes incomplete matrix rows from the create dialog options", async () => {
    mockAuthenticatedClass({
      matrixRows: [
        {
          dictationLabelKey: "Dictée complète",
          wordsYellow: 10,
          wordsGreen: 12,
          wordsViolet: 14,
          wordsGold: 16,
        },
        {
          dictationLabelKey: "Dictée partielle",
          wordsYellow: 10,
          wordsGreen: 0,
          wordsViolet: 14,
          wordsGold: 16,
        },
      ],
    });
    mockGetYearStartWizardStatus.mockResolvedValueOnce({
      completed: true,
      step: 3,
      activeStudentCount: 2,
      leveledActiveStudentCount: 2,
      unassignedCount: 0,
      matrixRowCount: 1,
    });

    const html = renderToStaticMarkup(await DictationsPage());

    expect(html).toContain("Dictée complète");
    expect(html).not.toContain("Dictée partielle");
  });

  it("renders an enabled create button when leveled students and matrix are ready", async () => {
    mockAuthenticatedClass({
      matrixRows: [
        {
          dictationLabelKey: "Dictée 1",
          wordsYellow: 10,
          wordsGreen: 12,
          wordsViolet: 14,
          wordsGold: 16,
        },
      ],
    });
    mockGetYearStartWizardStatus.mockResolvedValueOnce({
      completed: false,
      step: 2,
      activeStudentCount: 2,
      leveledActiveStudentCount: 1,
      unassignedCount: 1,
      matrixRowCount: 1,
    });

    const html = renderToStaticMarkup(await DictationsPage());

    expect(html).toContain("Nouvelle dictée");
    expect(html).not.toContain("disabled=\"\"");
    expect(html).toContain("Créez votre première dictée pour commencer la saisie.");
    expect(html).toContain(CONFIG_FIRST_HINT_MESSAGE);
    expect(html).toContain(CONFIG_FIRST_CTA_LABEL);
    expect(html).toContain('href="/config#matrice-mots"');
    expect(html).not.toContain("Configurez la matrice sur Config");
    expect(html).not.toContain("Importez votre liste d&#x27;élèves pour commencer.");
  });

  it("renders the year history list ordered by date", async () => {
    mockAuthenticatedClass({
      dictations: [
        {
          id: "880e8400-e29b-41d4-a716-446655440003",
          label: "Dictée 2",
          dictationLabelKey: "dictée 2",
          dictationDate: "2026-08-27",
        },
        {
          id: "770e8400-e29b-41d4-a716-446655440002",
          label: "Dictée 1",
          dictationLabelKey: "dictée 1",
          dictationDate: "2026-01-15",
        },
      ],
      matrixRows: [
        {
          dictationLabelKey: "Dictée 1",
          wordsYellow: 10,
          wordsGreen: 12,
          wordsViolet: 14,
          wordsGold: 16,
        },
      ],
    });
    mockGetYearStartWizardStatus.mockResolvedValueOnce({
      completed: true,
      step: 3,
      activeStudentCount: 2,
      leveledActiveStudentCount: 2,
      unassignedCount: 0,
      matrixRowCount: 1,
    });

    const html = renderToStaticMarkup(await DictationsPage());

    expect(html).toContain("Historique");
    expect(html).toContain("Dictée 2");
    expect(html).toContain("Dictée 1");
    expect(html).toContain('href="/dictations/880e8400-e29b-41d4-a716-446655440003"');
    expect(html).toContain('href="/dictations/770e8400-e29b-41d4-a716-446655440002"');
    expect(
      html.indexOf('href="/dictations/880e8400-e29b-41d4-a716-446655440003"')
    ).toBeLessThan(
      html.indexOf('href="/dictations/770e8400-e29b-41d4-a716-446655440002"')
    );
  });

  it("renders same-date history entries in label order from the service", async () => {
    mockAuthenticatedClass({
      dictations: [
        {
          id: "770e8400-e29b-41d4-a716-446655440002",
          label: "Dictée A",
          dictationLabelKey: "dictée a",
          dictationDate: "2026-08-27",
        },
        {
          id: "880e8400-e29b-41d4-a716-446655440003",
          label: "Dictée B",
          dictationLabelKey: "dictée b",
          dictationDate: "2026-08-27",
        },
      ],
      matrixRows: [
        {
          dictationLabelKey: "Dictée A",
          wordsYellow: 10,
          wordsGreen: 12,
          wordsViolet: 14,
          wordsGold: 16,
        },
      ],
    });
    mockGetYearStartWizardStatus.mockResolvedValueOnce({
      completed: true,
      step: 3,
      activeStudentCount: 2,
      leveledActiveStudentCount: 2,
      unassignedCount: 0,
      matrixRowCount: 1,
    });

    const html = renderToStaticMarkup(await DictationsPage());

    expect(
      html.indexOf('href="/dictations/770e8400-e29b-41d4-a716-446655440002"')
    ).toBeLessThan(
      html.indexOf('href="/dictations/880e8400-e29b-41d4-a716-446655440003"')
    );
  });

  it("renders the mobile hub alongside the hidden G1 section", async () => {
    mockAuthenticatedClass({
      dictations: [
        {
          id: "880e8400-e29b-41d4-a716-446655440003",
          label: "Dictée 2",
          dictationLabelKey: "dictée 2",
          dictationDate: "2026-08-27",
        },
      ],
      matrixRows: [
        {
          dictationLabelKey: "Dictée 2",
          wordsYellow: 10,
          wordsGreen: 12,
          wordsViolet: 14,
          wordsGold: 16,
        },
      ],
    });
    mockGetYearStartWizardStatus.mockResolvedValueOnce({
      completed: true,
      step: 3,
      activeStudentCount: 2,
      leveledActiveStudentCount: 2,
      unassignedCount: 0,
      matrixRowCount: 1,
    });
    mockGetDictationCompletionSummary.mockResolvedValueOnce({
      enteredCount: 1,
      totalLeveledCount: 2,
      isComplete: false,
    });

    const html = renderToStaticMarkup(await DictationsPage());

    expect(html).toContain("hidden flex-1 flex-col md:flex");
    expect(html).toContain("flex flex-1 flex-col md:hidden");
    expect(html).toContain('aria-label="Hub dictée mobile"');
    expect(html).toContain("Dictée 2");
    expect(html).toContain('href="/dictations/880e8400-e29b-41d4-a716-446655440003/mobile"');
    expect(html).toContain(
      'href="/dictations/880e8400-e29b-41d4-a716-446655440003/mobile/summary"'
    );
    expect(html).toContain("Saisir");
    expect(html).toContain("Voir");
    expect(mockGetDictationCompletionSummary).toHaveBeenCalledWith(
      classId,
      "880e8400-e29b-41d4-a716-446655440003"
    );
  });

  it("renders every dictation in the mobile hub list", async () => {
    mockGetDictationCompletionSummary.mockClear();
    mockAuthenticatedClass({
      dictations: [
        {
          id: "880e8400-e29b-41d4-a716-446655440003",
          label: "Dictée récente",
          dictationLabelKey: "dictée récente",
          dictationDate: "2026-08-27",
        },
        {
          id: "770e8400-e29b-41d4-a716-446655440002",
          label: "Dictée ancienne",
          dictationLabelKey: "dictée ancienne",
          dictationDate: "2026-06-01",
        },
      ],
      matrixRows: [
        {
          dictationLabelKey: "Dictée récente",
          wordsYellow: 10,
          wordsGreen: 12,
          wordsViolet: 14,
          wordsGold: 16,
        },
      ],
    });
    mockGetYearStartWizardStatus.mockResolvedValueOnce({
      completed: true,
      step: 3,
      activeStudentCount: 2,
      leveledActiveStudentCount: 2,
      unassignedCount: 0,
      matrixRowCount: 1,
    });
    mockGetDictationCompletionSummary
      .mockResolvedValueOnce({
        enteredCount: 1,
        totalLeveledCount: 2,
        isComplete: false,
      })
      .mockResolvedValueOnce({
        enteredCount: 2,
        totalLeveledCount: 2,
        isComplete: true,
      });

    const html = renderToStaticMarkup(await DictationsPage());

    expect(html).toContain("Dictée récente");
    expect(html).toContain("Dictée ancienne");
    expect(html).toContain(
      'href="/dictations/880e8400-e29b-41d4-a716-446655440003/mobile"'
    );
    expect(html).toContain(
      'href="/dictations/770e8400-e29b-41d4-a716-446655440002/mobile"'
    );
    expect(mockGetDictationCompletionSummary).toHaveBeenCalledTimes(2);
  });

  it("shows the mobile hub completion badge when a dictation is complete", async () => {
    mockAuthenticatedClass({
      dictations: [
        {
          id: "880e8400-e29b-41d4-a716-446655440003",
          label: "Dictée 2",
          dictationLabelKey: "dictée 2",
          dictationDate: "2026-08-27",
        },
      ],
      matrixRows: [
        {
          dictationLabelKey: "Dictée 2",
          wordsYellow: 10,
          wordsGreen: 12,
          wordsViolet: 14,
          wordsGold: 16,
        },
      ],
    });
    mockGetYearStartWizardStatus.mockResolvedValueOnce({
      completed: true,
      step: 3,
      activeStudentCount: 2,
      leveledActiveStudentCount: 2,
      unassignedCount: 0,
      matrixRowCount: 1,
    });
    mockGetDictationCompletionSummary.mockResolvedValueOnce({
      enteredCount: 2,
      totalLeveledCount: 2,
      isComplete: true,
    });

    const html = renderToStaticMarkup(await DictationsPage());

    expect(html).toContain("Dictée complète");
    expect(mockGetDictationCompletionSummary).toHaveBeenCalledWith(
      classId,
      "880e8400-e29b-41d4-a716-446655440003"
    );
  });

  it("renders the mobile hub empty state when the class is ready but has no dictations", async () => {
    mockGetDictationCompletionSummary.mockClear();
    mockAuthenticatedClass();
    mockGetYearStartWizardStatus.mockResolvedValueOnce({
      completed: true,
      step: 3,
      activeStudentCount: 2,
      leveledActiveStudentCount: 2,
      unassignedCount: 0,
      matrixRowCount: 1,
    });

    const html = renderToStaticMarkup(await DictationsPage());

    expect(html).toContain(
      "Créez votre première dictée depuis un ordinateur ou une tablette."
    );
    expect(html).toContain('aria-label="Hub dictée mobile"');
    expect(html).not.toContain("Saisir");
    expect(html).not.toContain("Voir");
    expect(mockGetDictationCompletionSummary).not.toHaveBeenCalled();
  });

  it("renders mobile class setup guidance when the roster is empty", async () => {
    mockAuthenticatedClass();
    mockGetYearStartWizardStatus.mockResolvedValueOnce({
      completed: false,
      step: 1,
      activeStudentCount: 0,
      leveledActiveStudentCount: 0,
      unassignedCount: 0,
      matrixRowCount: 0,
    });

    const html = renderToStaticMarkup(await DictationsPage());

    expect(html).toContain(
      "Utilisez un ordinateur ou une tablette pour configurer votre classe."
    );
    expect(html).toContain("<main");
    expect(html).not.toContain("Saisir");
    expect(html).not.toContain("Voir");
  });
});
