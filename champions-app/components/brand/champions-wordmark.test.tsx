import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

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

import { ChampionsWordmark } from "./champions-wordmark";

describe("ChampionsWordmark", () => {
  it("renders the app bar variant with sizing tokens", () => {
    const html = renderToStaticMarkup(<ChampionsWordmark variant="appBar" />);

    expect(html).toContain('src="/logo-champions-wordmark.jpg"');
    expect(html).toContain('alt="La méthode CHAMPIONS"');
    expect(html).toContain("h-[var(--spacing-logo-app-bar-height-mobile)]");
    expect(html).toContain("lg:h-[var(--spacing-logo-app-bar-height)]");
  });

  it("renders the presentation variant with presentation height and opacity", () => {
    const html = renderToStaticMarkup(<ChampionsWordmark variant="presentation" />);

    expect(html).toContain('src="/logo-champions-wordmark.jpg"');
    expect(html).toContain("h-[var(--spacing-logo-presentation-height)]");
    expect(html).toContain("opacity-[0.85]");
  });
});
