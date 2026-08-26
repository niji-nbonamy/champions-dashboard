import { describe, expect, it } from "vitest";

import {
  CHAMPIONS_LEVELS,
  getChampionsLevelFrenchLabel,
  isChampionsLevel,
  parseChampionsLevel,
} from "./champions-level";

describe("champions-level", () => {
  it("accepts the four CHAMPIONS levels", () => {
    for (const level of CHAMPIONS_LEVELS) {
      expect(isChampionsLevel(level)).toBe(true);
      expect(parseChampionsLevel(level)).toBe(level);
    }
  });

  it("rejects invalid level values", () => {
    expect(isChampionsLevel("red")).toBe(false);
    expect(parseChampionsLevel("red")).toBeNull();
    expect(parseChampionsLevel("")).toBeNull();
  });

  it("returns French labels for each level", () => {
    expect(getChampionsLevelFrenchLabel("yellow")).toBe("jaune");
    expect(getChampionsLevelFrenchLabel("green")).toBe("vert");
    expect(getChampionsLevelFrenchLabel("violet")).toBe("violet");
    expect(getChampionsLevelFrenchLabel("gold")).toBe("or");
  });
});
