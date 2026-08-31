/** @vitest-environment happy-dom */

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MobileErrorField } from "./mobile-error-field";

describe("MobileErrorField", () => {
  let container: HTMLDivElement;
  let root: Root;
  const onChange = vi.fn();

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    onChange.mockReset();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.clearAllMocks();
  });

  function renderField(value: number) {
    act(() => {
      root.render(
        <MobileErrorField
          categoryLetter="C"
          categoryName="Conjugaison"
          firstName="Marie"
          value={value}
          onChange={onChange}
        />
      );
    });
  }

  function getCycleButton() {
    return container.querySelector("button");
  }

  it("cycles values from 0 through 3 and back to 0", () => {
    renderField(0);

    act(() => {
      getCycleButton()!.click();
    });
    expect(onChange).toHaveBeenCalledWith("C", 1);

    onChange.mockReset();
    renderField(3);

    act(() => {
      getCycleButton()!.click();
    });
    expect(onChange).toHaveBeenCalledWith("C", 0);
  });

  it("exposes an accessible label for the current value", () => {
    renderField(2);

    expect(getCycleButton()?.getAttribute("aria-label")).toBe(
      "Marie, Conjugaison, 2 erreurs"
    );
  });

  it("opens manual numeric input from the dedicated affordance", () => {
    renderField(1);

    const manualButton = [...container.querySelectorAll("button")].find(
      (button) => button.textContent === "Saisir un nombre"
    );

    act(() => {
      manualButton!.click();
    });

    expect(container.querySelector('input[inputmode="numeric"]')).not.toBeNull();
  });
});
