import { describe, expect, it } from "vitest";

import {
  canCreateDictation,
  CONFIG_FIRST_CTA_LABEL,
  CONFIG_FIRST_HINT_MESSAGE,
} from "./dictation-readiness";

describe("canCreateDictation", () => {
  it("returns false when no leveled students exist", () => {
    expect(
      canCreateDictation({ leveledActiveStudentCount: 0, matrixRowCount: 1 })
    ).toBe(false);
  });

  it("returns false when no complete matrix row exists", () => {
    expect(
      canCreateDictation({ leveledActiveStudentCount: 3, matrixRowCount: 0 })
    ).toBe(false);
  });

  it("returns false when leveled students and matrix are both empty", () => {
    expect(
      canCreateDictation({ leveledActiveStudentCount: 0, matrixRowCount: 0 })
    ).toBe(false);
  });

  it("returns true when leveled students and matrix are both configured", () => {
    expect(
      canCreateDictation({ leveledActiveStudentCount: 2, matrixRowCount: 1 })
    ).toBe(true);
  });
});

describe("config-first hint constants", () => {
  it("exports non-empty French microcopy for the create dialog", () => {
    expect(CONFIG_FIRST_HINT_MESSAGE.length).toBeGreaterThan(0);
    expect(CONFIG_FIRST_CTA_LABEL).toBe("Aller à Config");
  });
});
