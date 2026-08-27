import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const { auth, redirect, mockGetTeacherClass, mockGetYearStartWizardStatus } = vi.hoisted(
  () => ({
    auth: vi.fn(),
    redirect: vi.fn((url: string): never => {
      throw new Error(`NEXT_REDIRECT:${url}`);
    }),
    mockGetTeacherClass: vi.fn(),
    mockGetYearStartWizardStatus: vi.fn(),
  })
);

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

import DictationsPage from "./page";

const teacherId = "550e8400-e29b-41d4-a716-446655440000";
const classId = "660e8400-e29b-41d4-a716-446655440001";

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
      unassignedCount: 0,
      matrixRowCount: 0,
    });

    const html = renderToStaticMarkup(await DictationsPage());

    expect(html).toContain("Importez votre liste d&#x27;élèves pour commencer.");
    expect(html).toContain('href="/config#liste-eleves"');
    expect(html).toContain("Importer la liste");
    expect(html).toContain("Nouvelle dictée");
    expect(html).toContain("disabled=\"\"");
    expect(html).not.toContain("Terminez la configuration de l");
  });

  it("renders a disabled create button when the matrix is missing", async () => {
    mockAuthenticatedClass();
    mockGetYearStartWizardStatus.mockResolvedValueOnce({
      completed: false,
      step: 2,
      activeStudentCount: 2,
      unassignedCount: 1,
      matrixRowCount: 0,
    });

    const html = renderToStaticMarkup(await DictationsPage());

    expect(html).toContain("Dictées");
    expect(html).toContain("Nouvelle dictée");
    expect(html).toContain("disabled=\"\"");
    expect(html).toContain("Configurez la matrice sur Config");
    expect(html).toContain('href="/config#matrice-mots"');
    expect(html).not.toContain("Importez votre liste d&#x27;élèves pour commencer.");
  });

  it("keeps the create button disabled when wizard is complete but roster is empty", async () => {
    mockAuthenticatedClass();
    mockGetYearStartWizardStatus.mockResolvedValueOnce({
      completed: true,
      step: 3,
      activeStudentCount: 0,
      unassignedCount: 0,
      matrixRowCount: 0,
    });

    const html = renderToStaticMarkup(await DictationsPage());

    expect(html).toContain("disabled=\"\"");
    expect(html).not.toContain("aria-disabled=\"false\"");
    expect(html).toContain("Importez votre liste d&#x27;élèves pour commencer.");
  });

  it("keeps the create button disabled when wizard is complete but matrix is missing", async () => {
    mockAuthenticatedClass();
    mockGetYearStartWizardStatus.mockResolvedValueOnce({
      completed: true,
      step: 3,
      activeStudentCount: 2,
      unassignedCount: 0,
      matrixRowCount: 0,
    });

    const html = renderToStaticMarkup(await DictationsPage());

    expect(html).toContain("disabled=\"\"");
    expect(html).not.toContain("aria-disabled=\"false\"");
    expect(html).toContain("Configurez la matrice sur Config");
  });

  it("renders an enabled create button when roster and matrix are ready", async () => {
    mockAuthenticatedClass();
    mockGetYearStartWizardStatus.mockResolvedValueOnce({
      completed: false,
      step: 2,
      activeStudentCount: 2,
      unassignedCount: 1,
      matrixRowCount: 1,
    });

    const html = renderToStaticMarkup(await DictationsPage());

    expect(html).toContain("Nouvelle dictée");
    expect(html).toContain("aria-disabled=\"false\"");
    expect(html).not.toContain("disabled=\"\"");
    expect(html).toContain("Création de dictée — bientôt disponible");
    expect(html).not.toContain("Configurez la matrice sur Config");
    expect(html).not.toContain("Importez votre liste d&#x27;élèves pour commencer.");
    expect(html).not.toContain('href="/config#liste-eleves"');
  });
});
