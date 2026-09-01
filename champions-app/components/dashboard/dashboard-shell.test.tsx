import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import {
  nextImageMockModule,
  nextLinkMockModule,
} from "@/test-utils/next-mocks";

const { usePathname } = vi.hoisted(() => ({
  usePathname: vi.fn(() => "/dictations"),
}));

vi.mock("next/navigation", () => ({
  usePathname,
}));

vi.mock("next/image", () => nextImageMockModule);

vi.mock("next/link", () => nextLinkMockModule);

vi.mock("./sign-out-button", () => ({
  SignOutButton: () => <button type="submit">Se déconnecter</button>,
}));

import { DashboardShell } from "./dashboard-shell";

describe("DashboardShell", () => {
  it("renders app bar, navigation tabs, and page content together", () => {
    const html = renderToStaticMarkup(
      <DashboardShell>
        <main>page content</main>
      </DashboardShell>
    );

    expect(html).toContain('alt="La méthode CHAMPIONS"');
    expect(html).toContain('src="/logo-champions-wordmark.jpg"');
    expect(html).toContain('href="/dictations"');
    expect(html).toContain('href="/students"');
    expect(html).toContain('href="/config"');
    expect(html).toContain('href="/alerts"');
    expect(html).toContain("Dictées");
    expect(html).toContain("Élèves");
    expect(html).toContain("page content");
  });

  it("forwards the unassigned student count to the Élèves tab badge", () => {
    const html = renderToStaticMarkup(
      <DashboardShell unassignedStudentCount={3}>
        <main>page content</main>
      </DashboardShell>
    );

    expect(html).toContain("3 élèves sans niveau");
  });

  it("forwards the pending promotion count to the Alertes tab badge", () => {
    const html = renderToStaticMarkup(
      <DashboardShell pendingPromotionCount={2}>
        <main>page content</main>
      </DashboardShell>
    );

    expect(html).toContain("2 élèves prêts");
  });

  it("hides app bar and navigation tabs on presentation routes", () => {
    usePathname.mockReturnValueOnce(
      "/students/770e8400-e29b-41d4-a716-446655440002/present"
    );

    const html = renderToStaticMarkup(
      <DashboardShell>
        <main>presentation content</main>
      </DashboardShell>
    );

    expect(html).toContain("presentation content");
    expect(html).toContain("min-h-screen");
    expect(html).not.toContain('href="/dictations"');
    expect(html).not.toContain('alt="La méthode CHAMPIONS"');
  });

  it("keeps app bar and navigation tabs visible on non-presentation routes", () => {
    usePathname.mockReturnValueOnce("/students/770e8400-e29b-41d4-a716-446655440002");

    const html = renderToStaticMarkup(
      <DashboardShell>
        <main>dossier content</main>
      </DashboardShell>
    );

    expect(html).toContain('alt="La méthode CHAMPIONS"');
    expect(html).toContain('href="/dictations"');
    expect(html).toContain("dossier content");
  });
});
