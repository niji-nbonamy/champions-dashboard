import { describe, expect, it } from "vitest";

import { calculateGlobalPercent } from "./scoring";

describe("calculateGlobalPercent", () => {
  it("returns 100 when there are zero errors", () => {
    expect(calculateGlobalPercent(50, 0)).toBe(100);
  });

  it("computes the correct percentage for partial errors", () => {
    expect(calculateGlobalPercent(100, 10)).toBe(90);
    expect(calculateGlobalPercent(50, 5)).toBe(90);
  });

  it("clamps overflow errors to zero percent", () => {
    expect(calculateGlobalPercent(10, 15)).toBe(0);
    expect(calculateGlobalPercent(10, 100)).toBe(0);
  });

  it("returns zero when the word denominator is zero", () => {
    expect(calculateGlobalPercent(0, 0)).toBe(0);
    expect(calculateGlobalPercent(0, 5)).toBe(0);
  });

  it("returns zero for negative or non-finite denominators", () => {
    expect(calculateGlobalPercent(-10, 0)).toBe(0);
    expect(calculateGlobalPercent(Number.NaN, 0)).toBe(0);
  });

  it("treats negative error sums as zero errors", () => {
    expect(calculateGlobalPercent(50, -5)).toBe(100);
  });

  it("rounds to the nearest integer", () => {
    expect(calculateGlobalPercent(3, 1)).toBe(67);
  });
});
