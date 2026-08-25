import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import DictationsPage from "./page";

describe("DictationsPage", () => {
  it("renders French heading and placeholder copy", () => {
    const html = renderToStaticMarkup(<DictationsPage />);

    expect(html).toContain("Dictées");
    expect(html).toContain(
      "Les dictées seront disponibles dans une prochaine version."
    );
    expect(html).not.toContain("Dashboard");
  });
});
