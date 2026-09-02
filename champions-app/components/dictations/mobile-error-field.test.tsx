/** @vitest-environment happy-dom */

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MobileErrorField } from "./mobile-error-field";
import { getChampionsErrorCategory } from "@/lib/domain/error-categories";

describe("MobileErrorField", () => {
  let container: HTMLDivElement;
  let root: Root;
  const onChange = vi.fn();
  const conjugationCategory = getChampionsErrorCategory("C");

  beforeEach(() => {
    vi.useFakeTimers();
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
    vi.useRealTimers();
  });

  function renderField(value: number) {
    act(() => {
      root.render(
        <MobileErrorField
          category={conjugationCategory}
          displayName="DUPONT Marie"
          value={value}
          onChange={onChange}
        />
      );
    });
  }

  function getCycleButton() {
    return container.querySelector("button");
  }

  it("increments the value on each tap without a 0–3 cap", () => {
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
    expect(onChange).toHaveBeenCalledWith("C", 4);

    onChange.mockReset();
    renderField(7);

    act(() => {
      getCycleButton()!.click();
    });
    expect(onChange).toHaveBeenCalledWith("C", 8);
  });

  it("renders a category color stripe matching the official CHAMPIONS palette", () => {
    renderField(0);

    const stripe = container.querySelector('[aria-hidden="true"]');

    expect(stripe).not.toBeNull();
    expect(stripe?.style.backgroundColor).toBe(conjugationCategory.headerBackground);
  });

  it("exposes an accessible label for the current value", () => {
    renderField(2);

    expect(getCycleButton()?.getAttribute("aria-label")).toBe(
      "DUPONT Marie, Conjugaison, 2 erreurs"
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

  it("opens manual numeric input after a long press", () => {
    renderField(1);

    act(() => {
      getCycleButton()!.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true })
      );
      vi.advanceTimersByTime(500);
    });

    expect(container.querySelector('input[inputmode="numeric"]')).not.toBeNull();
  });

  it("propagates manual numeric values of four or greater", () => {
    renderField(1);

    const manualButton = [...container.querySelectorAll("button")].find(
      (button) => button.textContent === "Saisir un nombre"
    );

    act(() => {
      manualButton!.click();
    });

    const input = container.querySelector(
      'input[inputmode="numeric"]'
    ) as HTMLInputElement;
    const setNativeValue = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value"
    )?.set;

    act(() => {
      setNativeValue?.call(input, "7");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });

    expect(onChange).toHaveBeenCalledWith("C", 7);
  });
});
