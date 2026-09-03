import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SiteFooter } from "./site-footer";

describe("SiteFooter", () => {
  it("renders attribution and copyright", () => {
    const html = renderToStaticMarkup(<SiteFooter />);

    expect(html).toContain("Le code de correction CHAMPIONS a été créé par");
    expect(html).toContain('href="https://dezecolle.eklablog.com"');
    expect(html).toContain("Farfa Dezecolle");
    expect(html).toContain("Nicolas Bonamy");
    expect(html).not.toContain("Tous droits réservés");
  });
});
