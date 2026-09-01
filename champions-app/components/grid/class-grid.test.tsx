/**
 * @vitest-environment happy-dom
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CHAMPIONS_ERROR_CATEGORY_LETTERS } from "@/lib/domain/error-categories";
import type { LeveledActiveStudent } from "@/lib/services/list-leveled-active-students";

import { ClassGrid } from "./class-grid";

const dictationId = "880e8400-e29b-41d4-a716-446655440003";

const mockSaveDictationAction = vi.fn();
const mockValidatePromotionAction = vi.fn();
const mockRefusePromotionAction = vi.fn();
const mockRouterRefresh = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock("@/app/(dashboard)/dictations/actions", () => ({
  saveDictationAction: (...args: unknown[]) => mockSaveDictationAction(...args),
  validatePromotionAction: (...args: unknown[]) =>
    mockValidatePromotionAction(...args),
  refusePromotionAction: (...args: unknown[]) =>
    mockRefusePromotionAction(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRouterRefresh,
  }),
}));


vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

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

const defaultWordTotalsByStudentId: Record<string, number> = {
  "770e8400-e29b-41d4-a716-446655440002": 50,
  "770e8400-e29b-41d4-a716-446655440004": 50,
};

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
    mockSaveDictationAction.mockReset();
    mockValidatePromotionAction.mockReset();
    mockRefusePromotionAction.mockReset();
    mockRouterRefresh.mockReset();
    mockToastSuccess.mockReset();
    mockToastError.mockReset();
    mockSaveDictationAction.mockResolvedValue({ error: null });
    mockValidatePromotionAction.mockResolvedValue({ error: null });
    mockRefusePromotionAction.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  function renderGrid(
    students: LeveledActiveStudent[] = sampleStudents,
    wordTotalsByStudentId: Record<string, number> = defaultWordTotalsByStudentId,
    options?: {
      initialCounts?: Record<
        string,
        Record<(typeof CHAMPIONS_ERROR_CATEGORY_LETTERS)[number], number>
      >;
      readOnlyStudentIds?: string[];
      pendingPromotionsByStudentId?: Record<
        string,
        { targetLevel: "yellow" | "green" | "violet" | "gold" }
      >;
    }
  ) {
    act(() => {
      root.render(
        <ClassGrid
          dictationId={dictationId}
          students={students}
          wordTotalsByStudentId={wordTotalsByStudentId}
          initialCounts={options?.initialCounts}
          readOnlyStudentIds={options?.readOnlyStudentIds}
          pendingPromotionsByStudentId={options?.pendingPromotionsByStudentId}
        />
      );
    });
  }

  function getSaveButton(): HTMLButtonElement | null {
    return container.querySelector('button[type="button"]');
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
    expect(getSaveButton()).toBeNull();
  });

  it("orders cell inputs row-major for Tab navigation", () => {
    renderGrid();

    const inputs = getCellInputs();
    expect(inputs[0]?.getAttribute("aria-label")).toContain(
      "DUPONT Marie, Conjugaison, 0 erreurs"
    );
    expect(inputs[1]?.getAttribute("aria-label")).toContain(
      "Marie, Homophones, 0 erreurs"
    );
    expect(inputs[9]?.getAttribute("aria-label")).toContain(
      "MARTIN Paul, Conjugaison, 0 erreurs"
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
      "DUPONT Marie, Conjugaison, 3 erreurs"
    );
  });

  it("replaces the existing value when a digit key is pressed", () => {
    renderGrid();

    const firstInput = getCellInputs()[0];
    expect(firstInput).toBeDefined();

    act(() => {
      firstInput?.focus();
      setInputValue(firstInput!, "5");
    });

    expect(firstInput?.value).toBe("5");

    act(() => {
      firstInput?.focus();
      setInputValue(firstInput!, "3");
    });

    expect(firstInput?.value).toBe("3");
    expect(firstInput?.getAttribute("aria-label")).toBe(
      "DUPONT Marie, Conjugaison, 3 erreurs"
    );
  });

  it("allows multi-digit values in a cell", () => {
    renderGrid();

    const firstInput = getCellInputs()[0];
    expect(firstInput).toBeDefined();

    act(() => {
      firstInput?.focus();
      setInputValue(firstInput!, "1");
      setInputValue(firstInput!, "12");
      setInputValue(firstInput!, "123");
    });

    expect(firstInput?.value).toBe("123");
    expect(firstInput?.getAttribute("aria-label")).toBe(
      "DUPONT Marie, Conjugaison, 123 erreurs"
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

  it("enables Enregistrer when all rows are valid", () => {
    renderGrid();

    const saveButton = getSaveButton();
    expect(saveButton?.textContent).toBe("Enregistrer");
    expect(saveButton?.disabled).toBe(false);
  });

  it("disables Enregistrer and shows validation message when sum exceeds word total", () => {
    renderGrid(sampleStudents, {
      [sampleStudents[0].id]: 5,
      [sampleStudents[1].id]: 50,
    });

    const firstInput = getCellInputs()[0];
    act(() => {
      firstInput?.focus();
      setInputValue(firstInput!, "6");
    });

    expect(container.textContent).toContain(
      "Σ erreurs (6) > total mots (5) pour DUPONT Marie"
    );
    expect(getSaveButton()?.disabled).toBe(true);
    expect(firstInput?.className).toContain("border-destructive");
    getCellInputs()
      .slice(0, 9)
      .forEach((input) => {
        expect(input.className).toContain("border-destructive");
      });
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      "Σ erreurs (6) > total mots (5) pour DUPONT Marie"
    );
  });

  it("disables Enregistrer when the second student row is invalid", () => {
    renderGrid(sampleStudents, {
      [sampleStudents[0].id]: 50,
      [sampleStudents[1].id]: 5,
    });

    const paulFirstCell = getCellInputs()[9];
    act(() => {
      paulFirstCell?.focus();
      setInputValue(paulFirstCell!, "6");
    });

    expect(container.textContent).toContain(
      "Σ erreurs (6) > total mots (5) pour MARTIN Paul"
    );
    expect(getSaveButton()?.disabled).toBe(true);
  });

  it("disables Enregistrer when a single category exceeds word total", () => {
    renderGrid(sampleStudents.slice(0, 1), {
      [sampleStudents[0].id]: 5,
    });

    const firstInput = getCellInputs()[0];
    act(() => {
      firstInput?.focus();
      setInputValue(firstInput!, "6");
    });

    expect(container.textContent).toContain(
      "Σ erreurs (6) > total mots (5) pour DUPONT Marie"
    );
    expect(getSaveButton()?.disabled).toBe(true);
  });

  it("re-enables Enregistrer after fixing an invalid row", () => {
    renderGrid(sampleStudents.slice(0, 1), {
      [sampleStudents[0].id]: 5,
    });

    const firstInput = getCellInputs()[0];
    act(() => {
      firstInput?.focus();
      setInputValue(firstInput!, "6");
    });

    expect(getSaveButton()?.disabled).toBe(true);

    act(() => {
      setInputValue(firstInput!, "3");
    });

    expect(getSaveButton()?.disabled).toBe(false);
    expect(container.textContent).not.toContain("Σ erreurs");
    expect(firstInput?.className).not.toContain("border-destructive");
  });

  it("treats an all-zero grid as valid with Enregistrer enabled", () => {
    renderGrid(sampleStudents.slice(0, 1), {
      [sampleStudents[0].id]: 10,
    });

    expect(getSaveButton()?.disabled).toBe(false);
  });

  it("calls saveDictationAction and shows a success toast on Enregistrer", async () => {
    renderGrid();

    const saveButton = getSaveButton();
    expect(saveButton).toBeTruthy();

    await act(async () => {
      saveButton?.click();
      await Promise.resolve();
    });

    expect(mockSaveDictationAction).toHaveBeenCalledWith(
      dictationId,
      expect.any(Object)
    );
    expect(mockToastSuccess).toHaveBeenCalledWith("Dictée enregistrée.");
    expect(mockRouterRefresh).toHaveBeenCalled();
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it("shows a failure toast when save returns an error", async () => {
    mockSaveDictationAction.mockResolvedValueOnce({
      error: "Enregistrement impossible. Réessayez.",
    });
    renderGrid();

    const saveButton = getSaveButton();
    await act(async () => {
      saveButton?.click();
      await Promise.resolve();
    });

    expect(mockToastError).toHaveBeenCalledWith(
      "Enregistrement impossible. Réessayez."
    );
    expect(mockToastSuccess).not.toHaveBeenCalled();
  });

  it("locks cells and shows a spinner while save is pending", async () => {
    let resolveSave: ((value: { error: string | null }) => void) | undefined;
    mockSaveDictationAction.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        })
    );

    renderGrid();

    const saveButton = getSaveButton();
    await act(async () => {
      saveButton?.click();
      await Promise.resolve();
    });

    expect(saveButton?.textContent).toContain("Enregistrement");
    expect(saveButton?.disabled).toBe(true);
    getCellInputs().forEach((input) => {
      expect(input.disabled).toBe(true);
    });

    await act(async () => {
      resolveSave?.({ error: null });
      await Promise.resolve();
    });
  });

  it("triggers save on Enter when focus is on the grid container", async () => {
    renderGrid();

    const gridContainer = container.querySelector(
      '[tabindex="-1"]'
    ) as HTMLDivElement | null;
    expect(gridContainer).toBeTruthy();

    await act(async () => {
      gridContainer?.focus();
      gridContainer?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true })
      );
      await Promise.resolve();
    });

    expect(mockSaveDictationAction).toHaveBeenCalledWith(
      dictationId,
      expect.any(Object)
    );
  });

  it("pre-fills cells from initialCounts on reopen", () => {
    renderGrid(sampleStudents.slice(0, 1), { [sampleStudents[0].id]: 50 }, {
      initialCounts: {
        [sampleStudents[0].id]: {
          C: 3,
          H: 0,
          A: 0,
          M: 0,
          P: 0,
          I: 0,
          O: 0,
          N: 0,
          S: 0,
        },
      },
    });

    const firstInput = getCellInputs()[0];
    expect(firstInput?.value).toBe("3");
    expect(firstInput?.getAttribute("aria-label")).toBe(
      "DUPONT Marie, Conjugaison, 3 erreurs"
    );
  });

  it("validates editable rows against snapshot denominators on reopen", () => {
    renderGrid(sampleStudents.slice(0, 1), { [sampleStudents[0].id]: 10 }, {
      initialCounts: {
        [sampleStudents[0].id]: {
          C: 0,
          H: 0,
          A: 0,
          M: 0,
          P: 0,
          I: 0,
          O: 0,
          N: 0,
          S: 0,
        },
      },
    });

    const firstInput = getCellInputs()[0];
    act(() => {
      firstInput?.focus();
      setInputValue(firstInput!, "11");
    });

    expect(container.textContent).toContain(
      "Σ erreurs (11) > total mots (10) pour DUPONT Marie"
    );
    expect(getSaveButton()?.disabled).toBe(true);
  });

  it("renders archived student rows as read-only and excludes them from save", async () => {
    const archivedStudentId = "770e8400-e29b-41d4-a716-446655440099";
    renderGrid(
      [
        sampleStudents[0],
        {
          id: archivedStudentId,
          displayName: "ANCIEN Léa",
          level: "yellow",
        },
      ],
      {
        [sampleStudents[0].id]: 50,
        [archivedStudentId]: 40,
      },
      {
        initialCounts: {
          [sampleStudents[0].id]: { ...emptyCountsForTest() },
          [archivedStudentId]: {
            C: 4,
            H: 0,
            A: 0,
            M: 0,
            P: 0,
            I: 0,
            O: 0,
            N: 0,
            S: 0,
          },
        },
        readOnlyStudentIds: [archivedStudentId],
      }
    );

    const inputs = getCellInputs();
    const archivedFirstCell = inputs[9];
    expect(archivedFirstCell?.value).toBe("4");
    expect(archivedFirstCell?.disabled).toBe(true);

    act(() => {
      archivedFirstCell?.focus();
      setInputValue(archivedFirstCell!, "9");
    });
    expect(archivedFirstCell?.value).toBe("4");

    const saveButton = getSaveButton();
    await act(async () => {
      saveButton?.click();
      await Promise.resolve();
    });

    expect(mockSaveDictationAction).toHaveBeenCalledWith(dictationId, {
      [sampleStudents[0].id]: expect.any(Object),
    });
    expect(mockSaveDictationAction.mock.calls[0]?.[1]).not.toHaveProperty(
      archivedStudentId
    );
  });

  it("disables save when every row is read-only", () => {
    const archivedStudentId = "770e8400-e29b-41d4-a716-446655440099";
    renderGrid(
      [
        {
          id: archivedStudentId,
          displayName: "ANCIEN Léa",
          level: "yellow",
        },
      ],
      { [archivedStudentId]: 40 },
      {
        initialCounts: {
          [archivedStudentId]: {
            C: 4,
            H: 0,
            A: 0,
            M: 0,
            P: 0,
            I: 0,
            O: 0,
            N: 0,
            S: 0,
          },
        },
        readOnlyStudentIds: [archivedStudentId],
      }
    );

    expect(getSaveButton()?.disabled).toBe(true);
  });

  it("shows the promotion plus button when a pending promotion exists", () => {
    renderGrid(sampleStudents, defaultWordTotalsByStudentId, {
      pendingPromotionsByStudentId: {
        [sampleStudents[0].id]: { targetLevel: "green" },
      },
    });

    expect(container.textContent).not.toContain("⬆️");
    expect(
      container.querySelector(
        'button[aria-label="Ouvrir la promotion pour DUPONT Marie"]'
      )
    ).not.toBeNull();
  });

  it("hides the promotion plus button on read-only archived rows", () => {
    renderGrid(sampleStudents, defaultWordTotalsByStudentId, {
      readOnlyStudentIds: [sampleStudents[0].id],
      pendingPromotionsByStudentId: {
        [sampleStudents[0].id]: { targetLevel: "green" },
      },
    });

    expect(container.textContent).not.toContain("⬆️");
    expect(
      container.querySelector(
        'button[aria-label="Ouvrir la promotion pour DUPONT Marie"]'
      )
    ).toBeNull();
  });

  it("opens the promotion dialog when the plus button is clicked", async () => {
    renderGrid(sampleStudents, defaultWordTotalsByStudentId, {
      pendingPromotionsByStudentId: {
        [sampleStudents[0].id]: { targetLevel: "green" },
      },
    });

    const plusButton = container.querySelector(
      'button[aria-label="Ouvrir la promotion pour DUPONT Marie"]'
    );

    await act(async () => {
      plusButton?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true })
      );
      await Promise.resolve();
    });

    const dialog = container.querySelector("dialog");
    expect(dialog?.open).toBe(true);
    expect(container.textContent).toContain("Prêt à monter → vert");
    expect(container.textContent).toContain(
      "DUPONT Marie peut passer au niveau vert."
    );
  });

  it("validates promotion from the dialog and refreshes the grid", async () => {
    renderGrid(sampleStudents, defaultWordTotalsByStudentId, {
      pendingPromotionsByStudentId: {
        [sampleStudents[0].id]: { targetLevel: "green" },
      },
    });

    const plusButton = container.querySelector(
      'button[aria-label="Ouvrir la promotion pour DUPONT Marie"]'
    );

    await act(async () => {
      plusButton?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true })
      );
      await Promise.resolve();
    });

    const validateButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Valider"
    );

    await act(async () => {
      validateButton?.click();
      await Promise.resolve();
    });

    expect(mockValidatePromotionAction).toHaveBeenCalledWith(
      sampleStudents[0].id,
      dictationId
    );
    expect(mockToastSuccess).toHaveBeenCalledWith("Niveau mis à jour.");
    expect(mockRouterRefresh).toHaveBeenCalled();
  });

  it("refuses promotion from the dialog and refreshes the grid", async () => {
    renderGrid(sampleStudents, defaultWordTotalsByStudentId, {
      pendingPromotionsByStudentId: {
        [sampleStudents[0].id]: { targetLevel: "green" },
      },
    });

    const plusButton = container.querySelector(
      'button[aria-label="Ouvrir la promotion pour DUPONT Marie"]'
    );

    await act(async () => {
      plusButton?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true })
      );
      await Promise.resolve();
    });

    const refuseButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Refuser"
    );

    await act(async () => {
      refuseButton?.click();
      await Promise.resolve();
    });

    expect(mockRefusePromotionAction).toHaveBeenCalledWith(
      sampleStudents[0].id,
      dictationId
    );
    expect(mockToastSuccess).toHaveBeenCalledWith("Promotion refusée.");
    expect(mockRouterRefresh).toHaveBeenCalled();
  });

  it("disables save while the promotion dialog is open", async () => {
    renderGrid(sampleStudents, defaultWordTotalsByStudentId, {
      pendingPromotionsByStudentId: {
        [sampleStudents[0].id]: { targetLevel: "green" },
      },
    });

    const plusButton = container.querySelector(
      'button[aria-label="Ouvrir la promotion pour DUPONT Marie"]'
    );

    await act(async () => {
      plusButton?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true })
      );
      await Promise.resolve();
    });

    const saveButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Enregistrer"
    );

    expect(saveButton?.disabled).toBe(true);

    await act(async () => {
      saveButton?.click();
      await Promise.resolve();
    });

    expect(mockSaveDictationAction).not.toHaveBeenCalled();
  });

  it("keeps the promotion dialog open when validation returns an error", async () => {
    mockValidatePromotionAction.mockResolvedValueOnce({
      error: "Validation impossible. Réessayez.",
    });

    renderGrid(sampleStudents, defaultWordTotalsByStudentId, {
      pendingPromotionsByStudentId: {
        [sampleStudents[0].id]: { targetLevel: "green" },
      },
    });

    const plusButton = container.querySelector(
      'button[aria-label="Ouvrir la promotion pour DUPONT Marie"]'
    );

    await act(async () => {
      plusButton?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true })
      );
      await Promise.resolve();
    });

    const validateButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Valider"
    );

    await act(async () => {
      validateButton?.click();
      await Promise.resolve();
    });

    expect(mockToastError).toHaveBeenCalledWith(
      "Validation impossible. Réessayez."
    );
    expect(container.querySelector("dialog")?.open).toBe(true);
  });

  it("disables save while promotion validation is pending", async () => {
    let resolveValidate:
      | ((value: { error: string | null }) => void)
      | undefined;
    mockValidatePromotionAction.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveValidate = resolve;
        })
    );

    renderGrid(sampleStudents, defaultWordTotalsByStudentId, {
      pendingPromotionsByStudentId: {
        [sampleStudents[0].id]: { targetLevel: "green" },
      },
    });

    const plusButton = container.querySelector(
      'button[aria-label="Ouvrir la promotion pour DUPONT Marie"]'
    );

    await act(async () => {
      plusButton?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true })
      );
      await Promise.resolve();
    });

    const validateButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Valider"
    );

    await act(async () => {
      validateButton?.click();
      await Promise.resolve();
    });

    expect(getSaveButton()?.disabled).toBe(true);

    await act(async () => {
      getSaveButton()?.click();
      await Promise.resolve();
    });

    expect(mockSaveDictationAction).not.toHaveBeenCalled();

    await act(async () => {
      resolveValidate?.({ error: null });
      await Promise.resolve();
    });
  });
});

function emptyCountsForTest() {
  return {
    C: 0,
    H: 0,
    A: 0,
    M: 0,
    P: 0,
    I: 0,
    O: 0,
    N: 0,
    S: 0,
  };
}
