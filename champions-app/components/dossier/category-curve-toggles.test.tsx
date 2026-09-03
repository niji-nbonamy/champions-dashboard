/**
 * @vitest-environment happy-dom
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { CategoryCurveToggles } from "./category-curve-toggles";

describe("CategoryCurveToggles", () => {
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

  it("marks C as active by default", () => {
    act(() => {
      root.render(
        <CategoryCurveToggles
          activeCategories={new Set(["C"])}
          onToggle={() => undefined}
        />
      );
    });

    const cToggle = container.querySelector(
      '[data-testid="category-toggle-C"]'
    ) as HTMLButtonElement;

    expect(cToggle.getAttribute("aria-pressed")).toBe("true");
    expect(cToggle.getAttribute("aria-label")).toContain("affichée");
  });

  it("calls onToggle when a button is clicked", () => {
    let toggledLetter: string | null = null;

    act(() => {
      root.render(
        <CategoryCurveToggles
          activeCategories={new Set(["C"])}
          onToggle={(letter) => {
            toggledLetter = letter;
          }}
        />
      );
    });

    const hToggle = container.querySelector(
      '[data-testid="category-toggle-H"]'
    ) as HTMLButtonElement;

    act(() => {
      hToggle.click();
    });

    expect(toggledLetter).toBe("H");
  });

  it("updates aria-pressed for inactive toggles", () => {
    act(() => {
      root.render(
        <CategoryCurveToggles
          activeCategories={new Set(["C"])}
          onToggle={() => undefined}
        />
      );
    });

    const hToggle = container.querySelector(
      '[data-testid="category-toggle-H"]'
    ) as HTMLButtonElement;

    expect(hToggle.getAttribute("aria-pressed")).toBe("false");
    expect(hToggle.getAttribute("aria-label")).toContain("masquée");
  });

  it("toggles on Space key via button click semantics", () => {
    const toggledLetters: string[] = [];

    act(() => {
      root.render(
        <CategoryCurveToggles
          activeCategories={new Set(["C"])}
          onToggle={(letter) => {
            toggledLetters.push(letter);
          }}
        />
      );
    });

    const hToggle = container.querySelector(
      '[data-testid="category-toggle-H"]'
    ) as HTMLButtonElement;

    act(() => {
      hToggle.focus();
      hToggle.dispatchEvent(
        new KeyboardEvent("keydown", { key: " ", bubbles: true })
      );
      hToggle.click();
    });

    expect(toggledLetters).toContain("H");
  });
});
