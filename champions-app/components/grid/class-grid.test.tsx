/**
 * @vitest-environment happy-dom
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { CHAMPIONS_ERROR_CATEGORY_LETTERS } from "@/lib/domain/error-categories";
import type { LeveledActiveStudent } from "@/lib/services/list-leveled-active-students";

import { ClassGrid } from "./class-grid";

const sampleStudents: LeveledActiveStudent[] = [
  {
    id: "770e8400-e29b-41d4-a716-446655440002",
    displayName: "DUPONT Marie",
    level: "yellow",
  },
  {
    id: "770e8400-e29b-41d4-a716-446655440004",
    displayName: "MARTIN Paul",
    level: "green",
  },
];

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  )?.set;

  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

describe("ClassGrid", () => {
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

  function renderGrid(students: LeveledActiveStudent[] = sampleStudents) {
    act(() => {
      root.render(<ClassGrid students={students} />);
    });
  }

  function getCellInputs(): HTMLInputElement[] {
    return Array.from(container.querySelectorAll("tbody input"));
  }

  it("renders nine category headers and student rows", () => {
    renderGrid();

    for (const letter of CHAMPIONS_ERROR_CATEGORY_LETTERS) {
      expect(container.textContent).toContain(letter);
    }

    expect(container.textContent).toContain("DUPONT Marie");
    expect(container.textContent).toContain("MARTIN Paul");
    expect(container.textContent).toContain("jaune");
    expect(container.textContent).toContain("vert");
    expect(getCellInputs()).toHaveLength(18);
  });

  it("shows an empty-state message when no leveled students exist", () => {
    renderGrid([]);

    expect(container.textContent).toContain("Aucun élève nivelé");
    expect(container.textContent).toContain("Élèves");
    expect(container.querySelector("table")).toBeNull();
  });

  it("orders cell inputs row-major for Tab navigation", () => {
    renderGrid();

    const inputs = getCellInputs();
    expect(inputs[0]?.getAttribute("aria-label")).toContain(
      "Marie, Conjugaison, 0 erreurs"
    );
    expect(inputs[1]?.getAttribute("aria-label")).toContain(
      "Marie, Homophones, 0 erreurs"
    );
    expect(inputs[9]?.getAttribute("aria-label")).toContain(
      "Paul, Conjugaison, 0 erreurs"
    );
  });

  it("wraps focus from the last cell to the first on Tab", () => {
    renderGrid();

    const inputs = getCellInputs();
    const lastInput = inputs[inputs.length - 1];

    act(() => {
      lastInput?.focus();
      lastInput?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Tab", bubbles: true })
      );
    });

    expect(document.activeElement).toBe(inputs[0]);
  });

  it("moves focus backward with Shift+Tab wrap from the first cell", () => {
    renderGrid();

    const inputs = getCellInputs();
    const lastInput = inputs[inputs.length - 1];

    act(() => {
      inputs[0]?.focus();
      inputs[0]?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true })
      );
    });

    expect(document.activeElement).toBe(lastInput);
  });

  it("updates a cell value when digits are entered", () => {
    renderGrid();

    const firstInput = getCellInputs()[0];
    expect(firstInput).toBeDefined();

    act(() => {
      firstInput?.focus();
      setInputValue(firstInput!, "3");
    });

    expect(firstInput?.value).toBe("3");
    expect(firstInput?.getAttribute("aria-label")).toBe(
      "Marie, Conjugaison, 3 erreurs"
    );
  });

  it("replaces the existing value when a digit key is pressed", () => {
    renderGrid();

    const firstInput = getCellInputs()[0];
    expect(firstInput).toBeDefined();

    act(() => {
      firstInput?.focus();
      firstInput?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "5", bubbles: true })
      );
    });

    expect(firstInput?.value).toBe("5");

    act(() => {
      firstInput?.focus();
      firstInput?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "3", bubbles: true })
      );
    });

    expect(firstInput?.value).toBe("3");
    expect(firstInput?.getAttribute("aria-label")).toBe(
      "Marie, Conjugaison, 3 erreurs"
    );
  });

  it("replaces the existing value when a new digit is entered", () => {
    renderGrid();

    const firstInput = getCellInputs()[0];
    expect(firstInput).toBeDefined();

    act(() => {
      firstInput?.focus();
      setInputValue(firstInput!, "5");
      setInputValue(firstInput!, "3");
    });

    expect(firstInput?.value).toBe("3");
  });

  it("moves focus to the next column on ArrowRight", () => {
    renderGrid();

    const inputs = getCellInputs();
    const firstInput = inputs[0];
    const secondInput = inputs[1];

    act(() => {
      firstInput?.focus();
      firstInput?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })
      );
    });

    expect(document.activeElement).toBe(secondInput);
  });

  it("moves focus to the previous column on ArrowLeft", () => {
    renderGrid();

    const inputs = getCellInputs();

    act(() => {
      inputs[1]?.focus();
      inputs[1]?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true })
      );
    });

    expect(document.activeElement).toBe(inputs[0]);
  });

  it("moves focus to the next student on ArrowDown", () => {
    renderGrid();

    const inputs = getCellInputs();
    const firstInput = inputs[0];
    const tenthInput = inputs[9];

    act(() => {
      firstInput?.focus();
      firstInput?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true })
      );
    });

    expect(document.activeElement).toBe(tenthInput);
  });

  it("moves focus to the previous student on ArrowUp", () => {
    renderGrid();

    const inputs = getCellInputs();

    act(() => {
      inputs[9]?.focus();
      inputs[9]?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true })
      );
    });

    expect(document.activeElement).toBe(inputs[0]);
  });

  it("keeps focus on the last column when ArrowRight is pressed", () => {
    renderGrid();

    const inputs = getCellInputs();
    const lastColumnInput = inputs[8];

    act(() => {
      lastColumnInput?.focus();
      lastColumnInput?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })
      );
    });

    expect(document.activeElement).toBe(lastColumnInput);
  });

  it("ignores invalid characters in cell input", () => {
    renderGrid();

    const firstInput = getCellInputs()[0];
    expect(firstInput).toBeDefined();

    act(() => {
      firstInput?.focus();
      setInputValue(firstInput!, "abc");
    });

    expect(firstInput?.value).toBe("0");
  });

  it("ignores negative values in cell input", () => {
    renderGrid();

    const firstInput = getCellInputs()[0];
    expect(firstInput).toBeDefined();

    act(() => {
      firstInput?.focus();
      setInputValue(firstInput!, "-1");
    });

    expect(firstInput?.value).toBe("0");
  });

  it("ignores decimal values in cell input", () => {
    renderGrid();

    const firstInput = getCellInputs()[0];
    expect(firstInput).toBeDefined();

    act(() => {
      firstInput?.focus();
      setInputValue(firstInput!, "1.5");
    });

    expect(firstInput?.value).toBe("0");
  });

  it("applies minimum cell dimension classes to inputs", () => {
    renderGrid();

    const firstInput = getCellInputs()[0];
    expect(firstInput?.className).toContain(
      "min-w-[var(--spacing-grid-cell-min)]"
    );
    expect(firstInput?.className).toContain(
      "min-h-[var(--spacing-grid-row-height)]"
    );
  });

  it("keeps focus on the first column when ArrowLeft is pressed", () => {
    renderGrid();

    const inputs = getCellInputs();
    const firstInput = inputs[0];

    act(() => {
      firstInput?.focus();
      firstInput?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true })
      );
    });

    expect(document.activeElement).toBe(firstInput);
  });

  it("keeps focus on the first row when ArrowUp is pressed", () => {
    renderGrid();

    const inputs = getCellInputs();
    const firstInput = inputs[0];

    act(() => {
      firstInput?.focus();
      firstInput?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true })
      );
    });

    expect(document.activeElement).toBe(firstInput);
  });

  it("keeps focus on the last row when ArrowDown is pressed", () => {
    renderGrid();

    const inputs = getCellInputs();
    const lastInput = inputs[inputs.length - 1];

    act(() => {
      lastInput?.focus();
      lastInput?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true })
      );
    });

    expect(document.activeElement).toBe(lastInput);
  });

  it("renders a horizontally scrollable grid container", () => {
    renderGrid();

    const scrollContainer = container.querySelector(".overflow-x-auto");
    expect(scrollContainer).toBeTruthy();
    expect(scrollContainer?.querySelector("table")).toBeTruthy();
  });

  it("renders category headers with official colors and hover tooltips", () => {
    renderGrid();

    const conjugationHeader = container.querySelector(
      'th[data-category-letter="C"]'
    ) as HTMLTableCellElement | null;

    expect(conjugationHeader).toBeTruthy();
    expect(conjugationHeader?.style.backgroundColor).toBe("#E70A16");
    expect(conjugationHeader?.getAttribute("aria-label")).toContain(
      "Conjugaison"
    );
    expect(conjugationHeader?.getAttribute("title")).toContain("Conjugaison");
    expect(conjugationHeader?.textContent).toContain(
      "Les verbes sont-ils correctement conjugués ?"
    );
    expect(container.querySelectorAll('[role="tooltip"]')).toHaveLength(9);
  });

  it("shows category tooltip on header tap", () => {
    renderGrid();

    const conjugationHeader = container.querySelector(
      'th[data-category-letter="C"]'
    ) as HTMLTableCellElement | null;
    const tooltip = conjugationHeader?.querySelector(
      '[role="tooltip"]'
    ) as HTMLDivElement | null;

    expect(tooltip?.className).toContain("opacity-0");

    act(() => {
      conjugationHeader?.click();
    });

    expect(tooltip?.className).toContain("opacity-100");
    expect(conjugationHeader?.getAttribute("aria-expanded")).toBe("true");
  });

  it("dismisses category tooltip on Escape", () => {
    renderGrid();

    const conjugationHeader = container.querySelector(
      'th[data-category-letter="C"]'
    ) as HTMLTableCellElement | null;
    const tooltip = conjugationHeader?.querySelector(
      '[role="tooltip"]'
    ) as HTMLDivElement | null;

    act(() => {
      conjugationHeader?.click();
    });

    expect(tooltip?.className).toContain("opacity-100");

    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
      );
    });

    expect(tooltip?.className).toContain("opacity-0");
    expect(conjugationHeader?.getAttribute("aria-expanded")).toBe("false");
  });

  it("shows category tooltip on header hover", () => {
    renderGrid();

    const tooltip = container.querySelector(
      'th[data-category-letter="C"] [role="tooltip"]'
    ) as HTMLDivElement | null;

    expect(tooltip?.className).toContain("group-hover:opacity-100");
  });
});
