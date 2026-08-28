import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LevelBadge } from "./level-badge";

describe("LevelBadge", () => {
  it("renders yellow variant with level color classes", () => {
    const html = renderToStaticMarkup(<LevelBadge level="yellow" />);
    expect(html).toContain("bg-level-yellow");
    expect(html).toContain("text-level-yellow-foreground");
    expect(html).toContain("jaune");
  });

  it("renders green variant with French label", () => {
    const html = renderToStaticMarkup(<LevelBadge level="green" />);
    expect(html).toContain("bg-level-green");
    expect(html).toContain("text-level-green-foreground");
    expect(html).toContain("vert");
  });

  it("renders violet variant with French label", () => {
    const html = renderToStaticMarkup(<LevelBadge level="violet" />);
    expect(html).toContain("bg-level-violet");
    expect(html).toContain("text-level-violet-foreground");
    expect(html).toContain("violet");
  });

  it("renders gold variant with French label", () => {
    const html = renderToStaticMarkup(<LevelBadge level="gold" />);
    expect(html).toContain("bg-level-gold");
    expect(html).toContain("text-level-gold-foreground");
    expect(html).toContain(">or<");
  });

  it("uses a fixed width so roster pills align in a column", () => {
    const html = renderToStaticMarkup(<LevelBadge level="gold" />);
    expect(html).toContain("w-[4.5rem]");
    expect(html).toContain("justify-center");
  });

  it("renders a color dot when showDot is enabled", () => {
    const html = renderToStaticMarkup(<LevelBadge level="green" showDot />);
    expect(html).toContain("rounded-full bg-current");
    expect(html).toContain("vert");
    expect(html).not.toContain("w-[4.5rem]");
  });
});
