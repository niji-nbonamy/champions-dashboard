/** @vitest-environment happy-dom */

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { GlobalSuccessCurve } from "./global-success-curve";

const samplePoints = [
  {
    entryId: "1",
    date: "2026-08-13",
    label: "Dictée A",
    percent: 75,
  },
  {
    entryId: "2",
    date: "2026-08-20",
    label: "Dictée B",
    percent: 88,
  },
];

function getHitTargets(container: HTMLElement): SVGCircleElement[] {
  return [...container.querySelectorAll('circle[r="10"]')] as SVGCircleElement[];
}

describe("GlobalSuccessCurve interactions", () => {
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
      root.render(<GlobalSuccessCurve points={samplePoints} />);
    });

    const hitTarget = getHitTargets(container)[0];

    act(() => {
      hitTarget.focus();
    });

    const tooltip = container.querySelector(
      '[data-testid="global-success-curve-tooltip"]'
    );

    expect(tooltip).not.toBeNull();
    expect(tooltip?.textContent).toContain("Dictée A : 75 %");
  });

  it("shows a tooltip when a point hit target receives touch", () => {
    act(() => {
      root.render(<GlobalSuccessCurve points={samplePoints} />);
    });

    const hitTarget = getHitTargets(container)[1];

    act(() => {
      hitTarget.dispatchEvent(
        new TouchEvent("touchstart", { bubbles: true })
      );
    });

    const tooltip = container.querySelector(
      '[data-testid="global-success-curve-tooltip"]'
    );

    expect(tooltip).not.toBeNull();
    expect(tooltip?.textContent).toContain("Dictée B : 88 %");
  });

  it("clears the tooltip when points change", () => {
    act(() => {
      root.render(<GlobalSuccessCurve points={samplePoints} />);
    });

    const hitTarget = getHitTargets(container)[0];

    act(() => {
      hitTarget.focus();
    });

    expect(
      container.querySelector('[data-testid="global-success-curve-tooltip"]')
    ).not.toBeNull();

    const updatedPoints = [
      ...samplePoints,
      {
        entryId: "3",
        date: "2026-08-27",
        label: "Dictée C",
        percent: 92,
      },
    ];

    act(() => {
      root.render(<GlobalSuccessCurve points={updatedPoints} />);
    });

    expect(
      container.querySelector('[data-testid="global-success-curve-tooltip"]')
    ).toBeNull();
  });
});
