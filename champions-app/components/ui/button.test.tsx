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
});
