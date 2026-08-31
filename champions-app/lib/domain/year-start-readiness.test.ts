import { describe, expect, it } from "vitest";

import { canArchiveStudents } from "./year-start-readiness";

describe("canArchiveStudents", () => {
  it("returns true when the wizard completion timestamp is set", () => {
    expect(
      canArchiveStudents({
        completed: true,
        activeStudentCount: 0,
        unassignedCount: 0,
        matrixRowCount: 0,
      })
    ).toBe(true);
  });

  it("returns true when setup is functionally complete without wizard timestamp", () => {
    expect(
      canArchiveStudents({
        completed: false,
        activeStudentCount: 8,
        unassignedCount: 0,
        matrixRowCount: 5,
      })
    ).toBe(true);
  });

  it("returns false during early year-start setup", () => {
    expect(
      canArchiveStudents({
        completed: false,
        activeStudentCount: 1,
        unassignedCount: 1,
        matrixRowCount: 0,
      })
    ).toBe(false);
  });
});
