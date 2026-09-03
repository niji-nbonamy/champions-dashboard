/**
 * @vitest-environment happy-dom
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { PresentationChartsRow } from "./presentation-charts-row";
import type { StudentDictationHistoryEntry } from "@/lib/services/get-student-dictation-history";

function makeEntry(
  overrides: Partial<StudentDictationHistoryEntry> = {}
): StudentDictationHistoryEntry {
  return {
    entryId: "aa0e8400-e29b-41d4-a716-446655440010",
    dictationId: "880e8400-e29b-41d4-a716-446655440003",
    label: "Dictée A",
    dictationDate: "2026-08-20",
    levelAtSave: "yellow",
    globalPercent: 87,
    wordDenominator: 40,
    categoryErrors: {
      C: 1,
      H: 2,
      A: 0,
      M: 0,
      P: 0,
      I: 0,
      O: 0,
      N: 0,
      S: 0,
    },
    ...overrides,
  };
}

describe("PresentationChartsRow interactions", () => {
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

  it("adds a category series when a toggle is clicked", () => {
    const entry = makeEntry();

    act(() => {
      root.render(
        <PresentationChartsRow
          history={[entry]}
          curvePoints={[
            {
              entryId: entry.entryId,
              date: entry.dictationDate,
              label: entry.label,
              percent: entry.globalPercent,
            },
          ]}
          hasHistory
        />
      );
    });

    const hToggle = container.querySelector(
      '[data-testid="category-toggle-H"]'
    ) as HTMLButtonElement;

    act(() => {
      hToggle.click();
    });

    expect(hToggle.getAttribute("aria-pressed")).toBe("true");
    expect(
      container.querySelector('[data-testid="category-series-H"]')
    ).not.toBeNull();
  });

  it("removes the C series when the C toggle is deactivated", () => {
    const entry = makeEntry();

    act(() => {
      root.render(
        <PresentationChartsRow
          history={[entry]}
          curvePoints={[
            {
              entryId: entry.entryId,
              date: entry.dictationDate,
              label: entry.label,
              percent: entry.globalPercent,
            },
          ]}
          hasHistory
        />
      );
    });

    const cToggle = container.querySelector(
      '[data-testid="category-toggle-C"]'
    ) as HTMLButtonElement;

    act(() => {
      cToggle.click();
    });

    expect(cToggle.getAttribute("aria-pressed")).toBe("false");
    expect(
      container.querySelector('[data-testid="category-series-C"]')
    ).toBeNull();
  });

  it("resets to C-only when remounted with new history", () => {
    const entry = makeEntry();

    act(() => {
      root.render(
        <PresentationChartsRow
          history={[entry]}
          curvePoints={[
            {
              entryId: entry.entryId,
              date: entry.dictationDate,
              label: entry.label,
              percent: entry.globalPercent,
            },
          ]}
          hasHistory
        />
      );
    });

    const hToggle = container.querySelector(
      '[data-testid="category-toggle-H"]'
    ) as HTMLButtonElement;

    act(() => {
      hToggle.click();
    });

    act(() => {
      root.unmount();
    });

    root = createRoot(container);

    act(() => {
      root.render(
        <PresentationChartsRow
          history={[entry]}
          curvePoints={[
            {
              entryId: entry.entryId,
              date: entry.dictationDate,
              label: entry.label,
              percent: entry.globalPercent,
            },
          ]}
          hasHistory
        />
      );
    });

    expect(
      (container.querySelector('[data-testid="category-toggle-H"]') as HTMLButtonElement)
        .getAttribute("aria-pressed")
    ).toBe("false");
    expect(
      container.querySelector('[data-testid="category-series-H"]')
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="category-series-C"]')
    ).not.toBeNull();
  });
});
