import { describe, expect, it } from "vitest";

import {
  countUniqueEnteredLeveledStudents,
  getUniqueEnteredLeveledStudentIds,
} from "./dictation-entry-completion";

const studentA = "770e8400-e29b-41d4-a716-446655440002";
const studentB = "990e8400-e29b-41d4-a716-446655440004";

describe("dictation-entry-completion", () => {
  it("returns unique leveled student ids with active entries", () => {
    const ids = getUniqueEnteredLeveledStudentIds([studentA, studentB], [
      { studentId: studentA, archived: false },
      { studentId: studentA, archived: false },
      { studentId: studentB, archived: true },
      { studentId: "aa0e8400-e29b-41d4-a716-446655440005", archived: false },
    ]);

    expect(ids).toEqual([studentA]);
    expect(countUniqueEnteredLeveledStudents([studentA, studentB], [
      { studentId: studentA, archived: false },
      { studentId: studentA, archived: false },
    ])).toBe(1);
  });
});
