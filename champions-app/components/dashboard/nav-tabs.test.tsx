import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const { usePathname } = vi.hoisted(() => ({
  usePathname: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    "aria-current": ariaCurrent,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    "aria-current"?: "page";
  }) => (
    <a href={href} className={className} aria-current={ariaCurrent}>
      {children}
    </a>
  ),
}));

import { NavTabs } from "./nav-tabs";

describe("NavTabs", () => {
  it("renders four French tab links with correct hrefs", () => {
    usePathname.mockReturnValue("/dictations");

    const html = renderToStaticMarkup(<NavTabs />);

    expect(html).toContain('href="/dictations"');
    expect(html).toContain('href="/students"');
    expect(html).toContain('href="/config"');
    expect(html).toContain('href="/alerts"');
    expect(html).toContain("Dictées");
    expect(html).toContain("Élèves");
    expect(html).toContain("Config");
    expect(html).toContain("Alertes");
    expect(html).toContain("flex-wrap");
    expect(html).toContain("overflow-x-auto");
    expect(html).toContain("md:gap-2");
    expect(html).toContain("focus-visible:ring-2");
  });

  it("highlights the active tab with primary mint styling", () => {
    usePathname.mockReturnValue("/students");

    const html = renderToStaticMarkup(<NavTabs />);

    expect(html).toContain('href="/students"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain("text-primary");
    expect(html).toContain("border-primary");
  });

  it("does not mark inactive tabs as current", () => {
    usePathname.mockReturnValue("/config");

    const html = renderToStaticMarkup(<NavTabs />);

    expect(html).toContain('href="/config"');
    expect(html).toMatch(/href="\/config"[^>]*aria-current="page"/);
    expect(html).not.toMatch(/href="\/dictations"[^>]*aria-current="page"/);
    expect(html).not.toMatch(/href="\/students"[^>]*aria-current="page"/);
    expect(html).not.toMatch(/href="\/alerts"[^>]*aria-current="page"/);
  });

  it("marks dictations active for nested paths", () => {
    usePathname.mockReturnValue("/dictations/123");

    const html = renderToStaticMarkup(<NavTabs />);

    expect(html).toMatch(/href="\/dictations"[^>]*aria-current="page"/);
    expect(html).not.toMatch(/href="\/students"[^>]*aria-current="page"/);
    expect(html).not.toMatch(/href="\/config"[^>]*aria-current="page"/);
    expect(html).not.toMatch(/href="\/alerts"[^>]*aria-current="page"/);
  });

  it("shows a warning count on the Élèves tab when unassigned students exist", () => {
    usePathname.mockReturnValue("/dictations");

    const html = renderToStaticMarkup(<NavTabs unassignedStudentCount={3} />);

    expect(html).toContain("3");
    expect(html).toContain("3 élèves sans niveau");
  });

  it("hides the warning count when every student has a level", () => {
    usePathname.mockReturnValue("/dictations");

    const html = renderToStaticMarkup(<NavTabs unassignedStudentCount={0} />);

    expect(html).not.toContain("élève sans niveau");
    expect(html).not.toContain("élèves sans niveau");
  });

  it("uses singular French copy for one unassigned student", () => {
    usePathname.mockReturnValue("/dictations");

    const html = renderToStaticMarkup(<NavTabs unassignedStudentCount={1} />);

    expect(html).toContain("1 élève sans niveau");
    expect(html).not.toContain("1 élèves sans niveau");
  });

  it("does not show the warning badge on other tabs", () => {
    usePathname.mockReturnValue("/dictations");

    const html = renderToStaticMarkup(<NavTabs unassignedStudentCount={2} />);

    expect(html).toContain('href="/students"');
    expect(html).toContain("2 élèves sans niveau");
    expect(html).not.toMatch(/href="\/dictations"[^>]*2 élèves sans niveau/);
    expect(html).not.toMatch(/href="\/config"[^>]*2 élèves sans niveau/);
    expect(html).not.toMatch(/href="\/alerts"[^>]*2 élèves sans niveau/);
  });

  it("shows a promotion-ready count on the Alertes tab when pending promotions exist", () => {
    usePathname.mockReturnValue("/dictations");

    const html = renderToStaticMarkup(<NavTabs pendingPromotionCount={3} />);

    expect(html).toContain("3");
    expect(html).toContain("3 élèves prêts");
    expect(html).toContain("bg-promotion-ready");
  });

  it("hides the promotion badge when no pending promotions exist", () => {
    usePathname.mockReturnValue("/dictations");

    const html = renderToStaticMarkup(<NavTabs pendingPromotionCount={0} />);

    expect(html).not.toContain("élève prêt");
    expect(html).not.toContain("élèves prêts");
  });

  it("uses singular French copy for one pending promotion", () => {
    usePathname.mockReturnValue("/dictations");

    const html = renderToStaticMarkup(<NavTabs pendingPromotionCount={1} />);

    expect(html).toContain("1 élève prêt");
    expect(html).not.toContain("1 élèves prêts");
  });

  it("does not show the promotion badge on other tabs", () => {
    usePathname.mockReturnValue("/dictations");

    const html = renderToStaticMarkup(<NavTabs pendingPromotionCount={2} />);

    expect(html).toContain('href="/alerts"');
    expect(html).toContain("2 élèves prêts");
    expect(html).not.toMatch(/href="\/dictations"[^>]*2 élèves prêts/);
    expect(html).not.toMatch(/href="\/students"[^>]*2 élèves prêts/);
    expect(html).not.toMatch(/href="\/config"[^>]*2 élèves prêts/);
  });
});
