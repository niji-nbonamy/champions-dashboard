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

import { DashboardChrome } from "./dashboard-chrome";

describe("DashboardChrome", () => {
  it("hides navigation tabs below md while keeping the app bar visible", () => {
    const html = renderToStaticMarkup(
      <DashboardChrome>
        <main>page content</main>
      </DashboardChrome>
    );

    expect(html).toContain('alt="La méthode CHAMPIONS"');
    expect(html).toContain("hidden md:block");
    expect(html).toContain('href="/dictations"');
    expect(html).toContain("page content");
    expect(html).toContain("sticky top-0 z-20 bg-background");
    expect(html).toContain("pt-[var(--spacing-safe-area-top)]");
  });

  it("hides all chrome on presentation routes", () => {
    usePathname.mockReturnValueOnce(
      "/students/770e8400-e29b-41d4-a716-446655440002/present"
    );

    const html = renderToStaticMarkup(
      <DashboardChrome>
        <main>presentation content</main>
      </DashboardChrome>
    );

    expect(html).toContain("presentation content");
    expect(html).toContain("min-h-screen");
    expect(html).not.toContain('href="/dictations"');
    expect(html).not.toContain('alt="La méthode CHAMPIONS"');
    expect(html).not.toContain("hidden md:block");
    expect(html).not.toContain("sticky top-0 z-20");
  });
});
