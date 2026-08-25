import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LevelBadge } from "./level-badge";

describe("LevelBadge", () => {
  it("renders yellow variant with level color classes", () => {
    const html = renderToStaticMarkup(<LevelBadge level="yellow" />);
    expect(html).toContain("bg-level-yellow");
    expect(html).toContain("text-level-yellow-foreground");
  });

  it("renders green variant with level color classes", () => {
    const html = renderToStaticMarkup(<LevelBadge level="green" />);
    expect(html).toContain("bg-level-green");
    expect(html).toContain("text-level-green-foreground");
  });

  it("renders violet variant with level color classes", () => {
    const html = renderToStaticMarkup(<LevelBadge level="violet" />);
    expect(html).toContain("bg-level-violet");
    expect(html).toContain("text-level-violet-foreground");
  });

  it("renders gold variant with level color classes", () => {
    const html = renderToStaticMarkup(<LevelBadge level="gold" />);
    expect(html).toContain("bg-level-gold");
    expect(html).toContain("text-level-gold-foreground");
  });
});
