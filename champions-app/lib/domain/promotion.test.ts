import { describe, expect, it } from "vitest";

import {
  evaluatePendingPromotion,
  getNextLevel,
  getPromotionThreshold,
} from "./promotion";

describe("getPromotionThreshold", () => {
  it("returns 90 for yellow and green", () => {
    expect(getPromotionThreshold("yellow")).toBe(90);
    expect(getPromotionThreshold("green")).toBe(90);
  });

  it("returns 95 for violet", () => {
    expect(getPromotionThreshold("violet")).toBe(95);
  });

  it("returns null for gold", () => {
    expect(getPromotionThreshold("gold")).toBeNull();
  });
});

describe("getNextLevel", () => {
  it("returns the next color in ascending order", () => {
    expect(getNextLevel("yellow")).toBe("green");
    expect(getNextLevel("green")).toBe("violet");
    expect(getNextLevel("violet")).toBe("gold");
  });

  it("returns null for gold", () => {
    expect(getNextLevel("gold")).toBeNull();
  });
});

describe("evaluatePendingPromotion", () => {
  it("requires two consecutive dictations above the threshold", () => {
    expect(evaluatePendingPromotion("yellow", [91, 91])).toEqual({
      eligible: true,
      targetLevel: "green",
    });
  });

  it("rejects when only one dictation exists", () => {
    expect(evaluatePendingPromotion("yellow", [100])).toEqual({
      eligible: false,
      targetLevel: null,
    });
  });

  it("rejects when the most recent score is at the threshold boundary", () => {
    expect(evaluatePendingPromotion("yellow", [90, 91])).toEqual({
      eligible: false,
      targetLevel: null,
    });
    expect(evaluatePendingPromotion("yellow", [91, 90])).toEqual({
      eligible: false,
      targetLevel: null,
    });
  });

  it("applies the 95% threshold for violet to gold", () => {
    expect(evaluatePendingPromotion("violet", [96, 96])).toEqual({
      eligible: true,
      targetLevel: "gold",
    });
    expect(evaluatePendingPromotion("violet", [95, 96])).toEqual({
      eligible: false,
      targetLevel: null,
    });
  });

  it("never promotes gold students", () => {
    expect(evaluatePendingPromotion("gold", [100, 100])).toEqual({
      eligible: false,
      targetLevel: null,
    });
  });
});
