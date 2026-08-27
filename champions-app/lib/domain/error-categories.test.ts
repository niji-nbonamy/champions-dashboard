import { describe, expect, it } from "vitest";

import {
  CHAMPIONS_ERROR_CATEGORIES,
  CHAMPIONS_ERROR_CATEGORY_LETTERS,
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
