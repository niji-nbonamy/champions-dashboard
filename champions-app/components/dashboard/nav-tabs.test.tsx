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
});
