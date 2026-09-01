import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { SPACING } from "@/lib/design/tokens";
import { nextImageMockModule } from "@/test-utils/next-mocks";

vi.mock("next/image", () => nextImageMockModule);

vi.mock("./sign-out-button", () => ({
  SignOutButton: () => <button type="submit">Se déconnecter</button>,
}));

import { AppBar } from "./app-bar";

describe("AppBar", () => {
  it("renders the CHAMPIONS wordmark with correct alt text and sizing classes", () => {
    const html = renderToStaticMarkup(<AppBar />);

    expect(html).toContain('alt="La méthode CHAMPIONS"');
    expect(html).toContain('src="/logo-champions-wordmark.jpg"');
    expect(html).toContain("object-contain");
    expect(html).toContain(
      `h-[var(--spacing-logo-app-bar-height-mobile)]`
    );
    expect(html).toContain(`lg:h-[var(--spacing-logo-app-bar-height)]`);
    expect(SPACING.logoAppBarHeight).toBe("52px");
    expect(SPACING.logoAppBarHeightMobile).toBe("40px");
  });

  it("does not render the Hermeland school logo or champions subtitle", () => {
    const html = renderToStaticMarkup(<AppBar />);

    expect(html).not.toContain("logo-ecole-saint-hermeland");
    expect(html).not.toContain("École Saint Hermeland");
    expect(html).not.toContain(">champions<");
  });

  it("uses the app bar minimum height token", () => {
    const html = renderToStaticMarkup(<AppBar />);

    expect(html).toContain("min-h-[var(--spacing-app-bar-min-height)]");
    expect(html).toContain("border-b");
    expect(SPACING.appBarMinHeight).toBe("64px");
  });

  it("does not render the logo as a clickable link", () => {
    const html = renderToStaticMarkup(<AppBar />);

    expect(html).not.toMatch(/<a\s/);
  });

  it("renders the sign-out control", () => {
    const html = renderToStaticMarkup(<AppBar />);

    expect(html).toContain("Se déconnecter");
    expect(html).toContain('type="submit"');
  });
});
