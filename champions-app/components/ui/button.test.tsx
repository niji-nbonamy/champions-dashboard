import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Button } from "./button";

describe("Button", () => {
  it("merges custom className with variant classes", () => {
    const html = renderToStaticMarkup(
      <Button className="custom-class">Click</Button>
    );

    expect(html).toContain("custom-class");
    expect(html).toContain("bg-primary");
  });

  it("applies accent outline variant classes", () => {
    const html = renderToStaticMarkup(
      <Button variant="accent">Accent</Button>
    );

    expect(html).toContain("border-accent");
    expect(html).toContain("text-accent");
    expect(html).toContain("bg-transparent");
  });
});
