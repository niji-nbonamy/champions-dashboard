import { describe, expect, it } from "vitest";

import { prepareDictationEntries } from "./dictation-save";

const matrixRow = {
  wordsYellow: 50,
  wordsGreen: 60,
  wordsViolet: 70,
  wordsGold: 80,
};

const students = [
  {
    id: "770e8400-e29b-41d4-a716-446655440002",
    level: "yellow",
  },
  {
    id: "770e8400-e29b-41d4-a716-446655440004",
    level: "green",
  },
];

const emptyCounts = {
  C: 0,
  H: 0,
  A: 0,
  M: 0,
  P: 0,
  I: 0,
  O: 0,
  N: 0,
  S: 0,
};

describe("prepareDictationEntries", () => {
  it("builds snapshots with matrix-derived denominators per level", () => {
    const entries = prepareDictationEntries(
      students,
      {
        [students[0].id]: { ...emptyCounts, C: 5 },
        [students[1].id]: { ...emptyCounts, H: 6 },
      },
      matrixRow
    );

    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      studentId: students[0].id,
      levelAtSave: "yellow",
      wordDenominator: 50,
      globalPercent: 90,
      errorColumns: expect.objectContaining({ errorsC: 5 }),
    });
    expect(entries[1]).toMatchObject({
      studentId: students[1].id,
      levelAtSave: "green",
      wordDenominator: 60,
      globalPercent: 90,
      errorColumns: expect.objectContaining({ errorsH: 6 }),
    });
  });

  it("rejects rows whose error sum exceeds the word total", () => {
    expect(() =>
      prepareDictationEntries(
        students.slice(0, 1),
        {
          [students[0].id]: { ...emptyCounts, C: 51 },
        },
        matrixRow
      )
    ).toThrow();
  });

  it("rejects rows with a single category above the word total", () => {
    expect(() =>
      prepareDictationEntries(
        students.slice(0, 1),
        {
          [students[0].id]: { ...emptyCounts, C: 50, H: 1 },
        },
        matrixRow
      )
    ).toThrow();
  });
});
