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

import { PresentationBrandLogo } from "./presentation-brand-logo";

describe("PresentationBrandLogo", () => {
  it("renders the CHAMPIONS wordmark fixed bottom-right for presentation mode", () => {
    const html = renderToStaticMarkup(<PresentationBrandLogo />);

    expect(html).toContain('src="/logo-champions-wordmark.jpg"');
    expect(html).toContain('alt="La méthode CHAMPIONS"');
    expect(html).toContain("fixed right-6 bottom-6");
    expect(html).toContain("h-[var(--spacing-logo-presentation-height)]");
    expect(html).toContain("opacity-[0.85]");
    expect(html).not.toContain("logo-ecole-saint-hermeland");
  });
});
