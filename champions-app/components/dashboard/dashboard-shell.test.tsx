import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const { usePathname } = vi.hoisted(() => ({
  usePathname: vi.fn(() => "/dictations"),
}));

vi.mock("next/navigation", () => ({
  usePathname,
}));

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    className,
    width,
    height,
  }: {
    src: string;
    alt: string;
    className?: string;
    width: number;
    height: number;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} width={width} height={height} />
  ),
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
});
