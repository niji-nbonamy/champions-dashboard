import { describe, expect, it } from "vitest";

import {
  CHAMPIONS_ERROR_CATEGORIES,
  CHAMPIONS_ERROR_CATEGORY_LETTERS,
  categoryErrorsToDbColumns,
  dbColumnsToCategoryErrors,
  formatGridCellAriaLabel,
  getChampionsErrorCategory,
} from "./error-categories";

describe("CHAMPIONS_ERROR_CATEGORIES", () => {
  it("defines exactly nine categories in C through S order", () => {
    expect(CHAMPIONS_ERROR_CATEGORIES).toHaveLength(9);
    expect(CHAMPIONS_ERROR_CATEGORY_LETTERS).toEqual([
      "C",
      "H",
      "A",
      "M",
      "P",
      "I",
      "O",
      "N",
      "S",
    ]);
  });

  it("maps known letters to French names and official header colors", () => {
    expect(getChampionsErrorCategory("C")).toMatchObject({
      name: "Conjugaison",
      headerBackground: "#E70A16",
      headerForeground: "#FFFFFF",
    });
    expect(getChampionsErrorCategory("A").headerBackground).toBe("#F98801");
    expect(getChampionsErrorCategory("S")).toMatchObject({
      name: "Son",
      headerBackground: "#7E44AC",
    });
  });
});

describe("formatGridCellAriaLabel", () => {
  it("formats the accessibility label for a grid cell", () => {
    expect(formatGridCellAriaLabel("Marie", "Conjugaison", 3)).toBe(
      "Marie, Conjugaison, 3 erreurs"
    );
  });
});

describe("dbColumnsToCategoryErrors", () => {
  it("maps DB error columns back to grid category counts", () => {
    const columns = categoryErrorsToDbColumns({
      C: 2,
      H: 0,
      A: 1,
      M: 0,
      P: 0,
      I: 0,
      O: 3,
      N: 0,
      S: 0,
    });

    expect(dbColumnsToCategoryErrors(columns)).toEqual({
      C: 2,
      H: 0,
      A: 1,
      M: 0,
      P: 0,
      I: 0,
      O: 3,
      N: 0,
      S: 0,
    });
  });

  it("round-trips with categoryErrorsToDbColumns", () => {
    const counts = {
      C: 4,
      H: 1,
      A: 0,
      M: 2,
      P: 0,
      I: 0,
      O: 0,
      N: 0,
      S: 3,
    };

    expect(
      dbColumnsToCategoryErrors(categoryErrorsToDbColumns(counts))
    ).toEqual(counts);
  });
});
