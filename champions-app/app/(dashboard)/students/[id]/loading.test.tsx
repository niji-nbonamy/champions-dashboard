import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import StudentSheetLoading from "./loading";

describe("StudentSheetLoading", () => {
  it("renders a student sheet layout skeleton during cold load", () => {
    const html = renderToStaticMarkup(<StudentSheetLoading />);

    expect(html).toContain('data-testid="student-sheet-skeleton"');
    expect(html).toContain("animate-pulse");
    expect(html).toContain("max-w-4xl");
    expect(html).toContain("flex flex-col gap-6");
    expect(html).toContain("2xl:grid-cols-2");
  });
});
