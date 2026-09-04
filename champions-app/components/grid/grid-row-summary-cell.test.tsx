/**
 * @vitest-environment happy-dom
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  formatGridRowSummaryAriaLabel,
  formatGridRowSummaryErrorsTooltip,
  formatGridRowSummaryWordsTooltip,
  GridRowSummaryCell,
} from "./grid-row-summary-cell";

describe("formatGridRowSummaryAriaLabel", () => {
  it("formats the accessibility label for a row summary", () => {
    expect(formatGridRowSummaryAriaLabel(88, 6, 50)).toBe(
      "Bilan : 88 % de réussite, 6 fautes sur 50 mots"
    );
  });
});

describe("GridRowSummaryCell", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  function renderSummary(props: {
    sumErrors: number;
    wordTotal: number;
    isReadOnlyRow: boolean;
  }) {
    act(() => {
      root.render(
        <table>
          <tbody>
            <tr>
              <GridRowSummaryCell {...props} />
            </tr>
          </tbody>
        </table>
      );
    });
  }

  it("renders success percent and fault ratio for editable rows", () => {
    renderSummary({ sumErrors: 6, wordTotal: 50, isReadOnlyRow: false });

    const summary = container.querySelector('[data-testid="grid-row-summary"]');

    expect(summary?.textContent).toContain("88 %");
    expect(summary?.textContent).toContain("6");
    expect(summary?.textContent).toContain("50");
    expect(summary?.getAttribute("aria-live")).toBe("polite");
  });

  it("renders custom tooltips for errors and word totals on the bottom line", () => {
    renderSummary({ sumErrors: 6, wordTotal: 50, isReadOnlyRow: false });

    const tooltips = container.querySelectorAll('[role="tooltip"]');

    expect(tooltips).toHaveLength(2);
    expect(tooltips[0]?.textContent).toBe(formatGridRowSummaryErrorsTooltip());
    expect(tooltips[1]?.textContent).toBe(formatGridRowSummaryWordsTooltip());
    expect(tooltips[1]?.className).toContain("right-0");
    expect(tooltips[1]?.className).toContain("whitespace-normal");
  });

  it("shows a summary tooltip on tap", () => {
    renderSummary({ sumErrors: 6, wordTotal: 50, isReadOnlyRow: false });

    const errorsTrigger = container.querySelector(
      '[aria-label="Nombre total de fautes"]'
    ) as HTMLSpanElement | null;
    const errorsTooltip = errorsTrigger?.querySelector(
      '[role="tooltip"]'
    ) as HTMLSpanElement | null;

    expect(errorsTooltip?.className).toContain("opacity-0");

    act(() => {
      errorsTrigger?.click();
    });

    expect(errorsTooltip?.className).toContain("opacity-100");
    expect(errorsTrigger?.getAttribute("aria-expanded")).toBe("true");
  });

  it("renders an empty cell for archived rows", () => {
    renderSummary({ sumErrors: 6, wordTotal: 50, isReadOnlyRow: true });

    const summary = container.querySelector(
      '[data-testid="grid-row-summary-empty"]'
    );

    expect(summary?.textContent).toBe("");
  });
});
