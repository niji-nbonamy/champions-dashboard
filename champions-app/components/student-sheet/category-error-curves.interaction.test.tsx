/** @vitest-environment happy-dom */

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { CategoryErrorCurves } from "./category-error-curves";
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
      C: 2,
      H: 0,
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

function getHitTargets(container: HTMLElement): SVGCircleElement[] {
  return [...container.querySelectorAll('circle[r="10"]')] as SVGCircleElement[];
}

describe("CategoryErrorCurves interactions", () => {
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

  it("shows a tooltip when a point hit target receives focus", () => {
    act(() => {
      root.render(
        <CategoryErrorCurves
          history={[makeEntry()]}
          activeCategories={new Set(["C"])}
        />
      );
    });

    const hitTarget = getHitTargets(container)[0];

    act(() => {
      hitTarget.focus();
    });

    const tooltip = container.querySelector(
      '[data-testid="category-error-curves-tooltip"]'
    );

    expect(tooltip).not.toBeNull();
    expect(tooltip?.textContent).toContain("Dictée A — Conjugaison: 2 erreurs");
  });

  it("shows a tooltip when a point hit target receives touch", () => {
    act(() => {
      root.render(
        <CategoryErrorCurves
          history={[makeEntry()]}
          activeCategories={new Set(["C"])}
        />
      );
    });

    const hitTarget = getHitTargets(container)[0];

    act(() => {
      hitTarget.dispatchEvent(
        new TouchEvent("touchstart", { bubbles: true })
      );
    });

    const tooltip = container.querySelector(
      '[data-testid="category-error-curves-tooltip"]'
    );

    expect(tooltip).not.toBeNull();
    expect(tooltip?.textContent).toContain("Dictée A — Conjugaison: 2 erreurs");
  });

  it("clears the tooltip when history changes", () => {
    act(() => {
      root.render(
        <CategoryErrorCurves
          history={[makeEntry()]}
          activeCategories={new Set(["C"])}
        />
      );
    });

    const hitTarget = getHitTargets(container)[0];

    act(() => {
      hitTarget.focus();
    });

    expect(
      container.querySelector('[data-testid="category-error-curves-tooltip"]')
    ).not.toBeNull();

    act(() => {
      root.render(
        <CategoryErrorCurves
          history={[
            makeEntry({
              entryId: "bb0e8400-e29b-41d4-a716-446655440011",
              label: "Dictée B",
              dictationDate: "2026-08-27",
            }),
          ]}
          activeCategories={new Set(["C"])}
        />
      );
    });

    expect(
      container.querySelector('[data-testid="category-error-curves-tooltip"]')
    ).toBeNull();
  });
});
