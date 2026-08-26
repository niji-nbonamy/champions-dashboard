import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CHAMPIONS_LEVELS,
  getChampionsLevelFrenchLabel,
} from "@/lib/domain/champions-level";
import {
  formatWordCountMatrixRowError,
  WORD_COUNT_CELL_INVALID_ERROR,
  WORD_COUNT_MATRIX_MAX_ROWS,
  WORD_COUNT_MATRIX_SAVE_SUCCESS_MESSAGE,
} from "@/lib/domain/word-count-matrix";

const mockUseActionState = vi.fn();

vi.mock("./actions", () => ({
  saveWordCountMatrixAction: vi.fn(),
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useActionState: (...args: unknown[]) => mockUseActionState(...args),
  };
});

import { WordCountMatrixForm } from "./word-count-matrix-form";

const sampleRow = {
  label: "Dictée 1",
  wordsYellow: "10",
  wordsGreen: "12",
  wordsViolet: "14",
  wordsGold: "16",
};

function makeMaxRows() {
  return Array.from({ length: WORD_COUNT_MATRIX_MAX_ROWS }, (_, index) => ({
    label: `Dictée ${index + 1}`,
    wordsYellow: "10",
    wordsGreen: "12",
    wordsViolet: "14",
    wordsGold: "16",
  }));
}

describe("WordCountMatrixForm", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders column headers for four color levels", () => {
    mockUseActionState.mockReturnValueOnce([
      { error: null, success: null, errorRowIndex: null, errorField: null },
      vi.fn(),
      false,
    ]);

    const html = renderToStaticMarkup(
      <WordCountMatrixForm initialRows={[sampleRow]} />
    );

    for (const level of CHAMPIONS_LEVELS) {
      expect(html).toContain(getChampionsLevelFrenchLabel(level));
    }
  });

  it("renders persisted rows and save controls", () => {
    mockUseActionState.mockReturnValueOnce([
      { error: null, success: null, errorRowIndex: null, errorField: null },
      vi.fn(),
      false,
    ]);

    const html = renderToStaticMarkup(
      <WordCountMatrixForm initialRows={[sampleRow]} />
    );

    expect(html).toContain("Dictée 1");
    expect(html).toContain("rows[0].label");
    expect(html).toContain("rows[0].words_yellow");
    expect(html).toContain("Enregistrer la matrice");
    expect(html).toContain("Ajouter une dictée");
    expect(html).toContain("Supprimer");
    expect(html).toContain('aria-label="Supprimer la dictée 1"');
  });

  it("shows an empty-state message when no rows exist", () => {
    mockUseActionState.mockReturnValueOnce([
      { error: null, success: null, errorRowIndex: null, errorField: null },
      vi.fn(),
      false,
    ]);

    const html = renderToStaticMarkup(<WordCountMatrixForm initialRows={[]} />);

    expect(html).toContain("Aucune dictée configurée");
    expect(html).toContain("Ajouter une dictée");
  });

  it("renders validation errors from the action state", () => {
    const validationError = formatWordCountMatrixRowError(
      1,
      "Dictée 1",
      WORD_COUNT_CELL_INVALID_ERROR
    );

    mockUseActionState.mockReturnValueOnce([
      {
        error: validationError,
        success: null,
        errorRowIndex: 0,
        errorField: "wordsYellow",
      },
      vi.fn(),
      false,
    ]);

    const html = renderToStaticMarkup(
      <WordCountMatrixForm initialRows={[sampleRow]} />
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain(validationError);
    expect(html).toContain('aria-invalid="true"');
    expect(html.match(/aria-invalid="true"/g)?.length).toBe(1);
  });

  it("renders success feedback from the action state", () => {
    mockUseActionState.mockReturnValueOnce([
      {
        error: null,
        success: WORD_COUNT_MATRIX_SAVE_SUCCESS_MESSAGE,
        errorRowIndex: null,
        errorField: null,
      },
      vi.fn(),
      false,
    ]);

    const html = renderToStaticMarkup(
      <WordCountMatrixForm initialRows={[sampleRow]} />
    );

    expect(html).toContain('role="status"');
    expect(html).toContain(WORD_COUNT_MATRIX_SAVE_SUCCESS_MESSAGE);
  });

  it("disables add-row and shows feedback when the maximum row count is reached", () => {
    mockUseActionState.mockReturnValueOnce([
      { error: null, success: null, errorRowIndex: null, errorField: null },
      vi.fn(),
      false,
    ]);

    const html = renderToStaticMarkup(
      <WordCountMatrixForm initialRows={makeMaxRows()} />
    );

    expect(html).toContain(`Maximum ${WORD_COUNT_MATRIX_MAX_ROWS} dictées atteint.`);
    expect(html).toContain('disabled=""');
    expect(html).toContain(`rows[${WORD_COUNT_MATRIX_MAX_ROWS - 1}].label`);
    expect(html).not.toContain(`rows[${WORD_COUNT_MATRIX_MAX_ROWS}].label`);
  });

  it("disables the matrix fieldset while a save is pending", () => {
    mockUseActionState.mockReturnValueOnce([
      { error: null, success: null, errorRowIndex: null, errorField: null },
      vi.fn(),
      true,
    ]);

    const html = renderToStaticMarkup(
      <WordCountMatrixForm initialRows={[sampleRow]} />
    );

    expect(html).toContain('fieldset disabled=""');
    expect(html).toContain("Enregistrement…");
  });
});
