import { describe, expect, it } from "vitest";

import {
  buildDictationRosterState,
  buildHistoricalCompletionSummary,
} from "./dictation-roster";

const studentA = "770e8400-e29b-41d4-a716-446655440002";
const studentB = "770e8400-e29b-41d4-a716-446655440004";
const studentNew = "770e8400-e29b-41d4-a716-446655440008";
const studentArchived = "770e8400-e29b-41d4-a716-446655440099";

function entry(
  studentId: string,
  archived = false,
  displayName = "Élève"
) {
  return {
    studentId,
    displayName,
    archived,
    levelAtSave: "yellow",
    wordDenominator: 10,
    globalPercent: 90,
    errorsC: 0,
    errorsH: 0,
    errorsA: 0,
    errorsM: 0,
    errorsP: 0,
    errorsI: 0,
    errorsO: 0,
    errorsN: 0,
    errorsS: 0,
  };
}

describe("buildDictationRosterState", () => {
  it("lists current active students when no entries exist", () => {
    const state = buildDictationRosterState(
      [],
      [
        { id: studentA, displayName: "DUPONT Marie", level: "yellow" },
        { id: studentNew, displayName: "PETIT Lucas", level: null },
      ],
      [{ id: studentA, displayName: "DUPONT Marie", level: "yellow" }]
    );

    expect(state.students.map((student) => student.id)).toEqual([
      studentA,
      studentNew,
    ]);
    expect(state.isHistoricalRoster).toBe(false);
    expect(state.remainingCount).toBe(1);
  });

  it("extends partial capture with current leveled students missing entries", () => {
    const state = buildDictationRosterState(
      [entry(studentA)],
      [
        { id: studentA, displayName: "DUPONT Marie", level: "yellow" },
        { id: studentB, displayName: "MARTIN Paul", level: "green" },
      ],
      [
        { id: studentA, displayName: "DUPONT Marie", level: "yellow" },
        { id: studentB, displayName: "MARTIN Paul", level: "green" },
      ]
    );

    expect(state.students.map((student) => student.id)).toEqual([
      studentA,
      studentB,
    ]);
    expect(state.isHistoricalRoster).toBe(false);
    expect(state.remainingCount).toBe(1);
    expect(state.enteredStudentIds).toEqual([studentA]);
  });

  it("freezes the roster from entries when archived participants exist", () => {
    const state = buildDictationRosterState(
      [entry(studentA), entry(studentArchived, true, "ANCIEN Élève")],
      [{ id: studentB, displayName: "MARTIN Paul", level: "green" }],
      [{ id: studentB, displayName: "MARTIN Paul", level: "green" }]
    );

    expect(state.isHistoricalRoster).toBe(true);
    expect(state.students.map((student) => student.id)).toEqual([
      studentA,
      studentArchived,
    ]);
    expect(
      state.students.find((student) => student.id === studentArchived)?.readOnly
    ).toBe(true);
    expect(state.students.some((student) => student.id === studentB)).toBe(
      false
    );
    expect(state.remainingCount).toBe(0);
  });

  it("freezes the roster when departed participants remain in entries", () => {
    const state = buildDictationRosterState(
      [entry(studentArchived, true, "ANCIEN Élève")],
      [{ id: studentB, displayName: "MARTIN Paul", level: "green" }],
      [{ id: studentB, displayName: "MARTIN Paul", level: "green" }]
    );

    expect(state.isHistoricalRoster).toBe(true);
    expect(state.students.map((student) => student.id)).toEqual([
      studentArchived,
    ]);
    expect(state.students[0]?.readOnly).toBe(true);
  });
});

describe("buildHistoricalCompletionSummary", () => {
  it("counts editable entries only and marks complete when entries exist", () => {
    expect(
      buildHistoricalCompletionSummary([
        entry(studentA),
        entry(studentArchived, true),
      ])
    ).toEqual({
      enteredCount: 1,
      totalLeveledCount: 1,
      isComplete: true,
    });
  });
});
