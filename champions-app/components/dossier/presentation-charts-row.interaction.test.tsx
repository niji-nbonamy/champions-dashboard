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

  it("removes the C series when another category is active", () => {
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
    const cToggle = container.querySelector(
      '[data-testid="category-toggle-C"]'
    ) as HTMLButtonElement;

    act(() => {
      hToggle.click();
    });

    act(() => {
      cToggle.click();
    });

    expect(cToggle.getAttribute("aria-pressed")).toBe("false");
    expect(
      container.querySelector('[data-testid="category-series-C"]')
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="category-series-H"]')
    ).not.toBeNull();
  });

  it("keeps the last active category when its toggle is clicked", () => {
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

    expect(cToggle.getAttribute("aria-pressed")).toBe("true");
    expect(
      container.querySelector('[data-testid="category-series-C"]')
    ).not.toBeNull();
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

  it("resets to C-only when history changes via a new row key", () => {
    const entry = makeEntry();
    const secondEntry = makeEntry({
      entryId: "bb0e8400-e29b-41d4-a716-446655440011",
      label: "Dictée B",
      dictationDate: "2026-08-27",
    });

    act(() => {
      root.render(
        <PresentationChartsRow
          key={entry.entryId}
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
      root.render(
        <PresentationChartsRow
          key={`${entry.entryId},${secondEntry.entryId}`}
          history={[entry, secondEntry]}
          curvePoints={[
            {
              entryId: entry.entryId,
              date: entry.dictationDate,
              label: entry.label,
              percent: entry.globalPercent,
            },
            {
              entryId: secondEntry.entryId,
              date: secondEntry.dictationDate,
              label: secondEntry.label,
              percent: secondEntry.globalPercent,
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

  it("aligns chart point x positions between global and category panels", () => {
    const firstEntry = makeEntry({
      entryId: "entry-1",
      label: "Dictée A",
      dictationDate: "2026-08-01",
    });
    const secondEntry = makeEntry({
      entryId: "entry-2",
      label: "Dictée B",
      dictationDate: "2026-08-08",
    });

    act(() => {
      root.render(
        <PresentationChartsRow
          history={[firstEntry, secondEntry]}
          curvePoints={[
            {
              entryId: firstEntry.entryId,
              date: firstEntry.dictationDate,
              label: firstEntry.label,
              percent: firstEntry.globalPercent,
            },
            {
              entryId: secondEntry.entryId,
              date: secondEntry.dictationDate,
              label: secondEntry.label,
              percent: secondEntry.globalPercent,
            },
          ]}
          hasHistory
        />
      );
    });

    const globalPoints = [
      ...container.querySelectorAll(
        '[data-testid="global-success-curve"] circle[r="4"]'
      ),
    ] as SVGCircleElement[];
    const categoryPoints = [
      ...container.querySelectorAll(
        '[data-testid="category-error-curves"] circle[r="4"]'
      ),
    ] as SVGCircleElement[];

    expect(globalPoints).toHaveLength(2);
    expect(categoryPoints).toHaveLength(2);
    expect(globalPoints[0].getAttribute("cx")).toBe(
      categoryPoints[0].getAttribute("cx")
    );
    expect(globalPoints[1].getAttribute("cx")).toBe(
      categoryPoints[1].getAttribute("cx")
    );
  });
});
