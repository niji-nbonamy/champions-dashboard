import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import StudentDossierLoading from "./loading";

describe("StudentDossierLoading", () => {
  it("renders a dossier layout skeleton during cold load", () => {
    const html = renderToStaticMarkup(<StudentDossierLoading />);

    expect(html).toContain('data-testid="dossier-skeleton"');
    expect(html).toContain("animate-pulse");
    expect(html).toContain("max-w-4xl");
    expect(html).toContain("lg:grid-cols-2");
  });
});
