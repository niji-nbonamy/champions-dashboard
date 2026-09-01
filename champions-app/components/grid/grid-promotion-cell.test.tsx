/**
 * @vitest-environment happy-dom
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { GridPromotionCell } from "./grid-promotion-cell";

describe("GridPromotionCell", () => {
  it("renders the promotion plus button when a pending promotion exists", () => {
    const html = renderToStaticMarkup(
      <GridPromotionCell
        studentId="student-1"
        displayName="DUPONT Marie"
        pendingPromotion={{ targetLevel: "green" }}
        isReadOnlyRow={false}
        onOpen={vi.fn()}
      />
    );

    expect(html).toContain('aria-label="Ouvrir la promotion pour DUPONT Marie"');
    expect(html).toContain("bg-promotion-ready");
  });

  it("renders nothing for read-only rows", () => {
    const html = renderToStaticMarkup(
      <GridPromotionCell
        studentId="student-1"
        displayName="DUPONT Marie"
        pendingPromotion={{ targetLevel: "green" }}
        isReadOnlyRow
        onOpen={vi.fn()}
      />
    );

    expect(html).toBe("");
  });
});
