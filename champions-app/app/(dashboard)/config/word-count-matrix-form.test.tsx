import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CHAMPIONS_LEVELS,
  getChampionsLevelFrenchLabel,
} from "@/lib/domain/champions-level";
import {
  WORD_COUNT_CELL_INVALID_ERROR,
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

describe("WordCountMatrixForm", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders column headers for four color levels", () => {
    mockUseActionState.mockReturnValueOnce([
      { error: null, success: null },
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
      { error: null, success: null },
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
  });

  it("shows an empty-state message when no rows exist", () => {
    mockUseActionState.mockReturnValueOnce([
      { error: null, success: null },
      vi.fn(),
      false,
    ]);

    const html = renderToStaticMarkup(<WordCountMatrixForm initialRows={[]} />);

    expect(html).toContain("Aucune dictée configurée");
    expect(html).toContain("Ajouter une dictée");
  });

  it("renders validation errors from the action state", () => {
    mockUseActionState.mockReturnValueOnce([
      { error: WORD_COUNT_CELL_INVALID_ERROR, success: null },
      vi.fn(),
      false,
    ]);

    const html = renderToStaticMarkup(
      <WordCountMatrixForm initialRows={[sampleRow]} />
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain(WORD_COUNT_CELL_INVALID_ERROR);
  });

  it("renders success feedback from the action state", () => {
    mockUseActionState.mockReturnValueOnce([
      { error: null, success: WORD_COUNT_MATRIX_SAVE_SUCCESS_MESSAGE },
      vi.fn(),
      false,
    ]);

    const html = renderToStaticMarkup(
      <WordCountMatrixForm initialRows={[sampleRow]} />
    );

    expect(html).toContain('role="status"');
    expect(html).toContain(WORD_COUNT_MATRIX_SAVE_SUCCESS_MESSAGE);
  });
});
