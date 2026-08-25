import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { SPACING } from "@/lib/design/tokens";

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

import { AppBar } from "./app-bar";

describe("AppBar", () => {
  it("renders the school wordmark with correct alt text and sizing classes", () => {
    const html = renderToStaticMarkup(<AppBar />);

    expect(html).toContain('alt="École Saint Hermeland"');
    expect(html).toContain('src="/logo-ecole-saint-hermeland.png"');
    expect(html).toContain("object-contain");
    expect(html).toContain(
      `h-[var(--spacing-logo-app-bar-height-mobile)]`
    );
    expect(html).toContain(`lg:h-[var(--spacing-logo-app-bar-height)]`);
    expect(html).toContain("lg:flex-row");
    expect(html).toContain("lg:items-center");
    expect(SPACING.logoAppBarHeight).toBe("52px");
    expect(SPACING.logoAppBarHeightMobile).toBe("40px");
  });

  it("renders the muted champions subtitle", () => {
    const html = renderToStaticMarkup(<AppBar />);

    expect(html).toContain("champions");
    expect(html).toContain("text-muted-foreground");
  });

  it("uses the app bar minimum height token", () => {
    const html = renderToStaticMarkup(<AppBar />);

    expect(html).toContain("min-h-[var(--spacing-app-bar-min-height)]");
    expect(SPACING.appBarMinHeight).toBe("64px");
  });
});
