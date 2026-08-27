import { describe, expect, it } from "vitest";

import { canCreateDictation } from "./dictation-readiness";

describe("canCreateDictation", () => {
  it("returns false when the roster is empty", () => {
    expect(
      canCreateDictation({ activeStudentCount: 0, matrixRowCount: 1 })
    ).toBe(false);
  });

  it("returns false when no complete matrix row exists", () => {
    expect(
      canCreateDictation({ activeStudentCount: 3, matrixRowCount: 0 })
    ).toBe(false);
  });

  it("returns false when roster and matrix are both empty", () => {
    expect(
      canCreateDictation({ activeStudentCount: 0, matrixRowCount: 0 })
    ).toBe(false);
  });

  it("returns true when roster and matrix are both configured", () => {
    expect(
      canCreateDictation({ activeStudentCount: 2, matrixRowCount: 1 })
    ).toBe(true);
  });
});
