import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetDictationEntriesByDictationId,
  mockListLeveledActiveStudents,
} = vi.hoisted(() => ({
  mockGetDictationEntriesByDictationId: vi.fn(),
  mockListLeveledActiveStudents: vi.fn(),
}));

vi.mock("./get-dictation-entries", () => ({
  getDictationEntriesByDictationId: mockGetDictationEntriesByDictationId,
}));

vi.mock("./list-leveled-active-students", () => ({
  listLeveledActiveStudents: mockListLeveledActiveStudents,
}));

import { getDictationCompletionSummary } from "./get-dictation-completion-summary";

const classId = "660e8400-e29b-41d4-a716-446655440001";
const dictationId = "880e8400-e29b-41d4-a716-446655440003";
const studentA = "770e8400-e29b-41d4-a716-446655440002";
const studentB = "990e8400-e29b-41d4-a716-446655440004";

describe("getDictationCompletionSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("counts entries only for leveled active students", async () => {
    mockListLeveledActiveStudents.mockResolvedValueOnce([
      { id: studentA, displayName: "ÉLÈVE A", level: "yellow" },
      { id: studentB, displayName: "ÉLÈVE B", level: "green" },
    ]);
    mockGetDictationEntriesByDictationId.mockResolvedValueOnce([
      {
        studentId: studentA,
        displayName: "ÉLÈVE A",
        archived: false,
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
      },
      {
        studentId: "aa0e8400-e29b-41d4-a716-446655440005",
        displayName: "ARCHIVED Student",
        archived: true,
        levelAtSave: "yellow",
        wordDenominator: 10,
        globalPercent: 80,
        errorsC: 0,
        errorsH: 0,
        errorsA: 0,
        errorsM: 0,
        errorsP: 0,
        errorsI: 0,
        errorsO: 0,
        errorsN: 0,
        errorsS: 0,
      },
    ]);

    const result = await getDictationCompletionSummary(classId, dictationId);

    expect(result).toEqual({
      enteredCount: 1,
      totalLeveledCount: 2,
      isComplete: false,
    });
  });

  it("returns zero counts when no leveled students exist", async () => {
    mockListLeveledActiveStudents.mockResolvedValueOnce([]);
    mockGetDictationEntriesByDictationId.mockResolvedValueOnce([
      {
        studentId: studentA,
        displayName: "ÉLÈVE A",
        archived: false,
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
      },
    ]);

    const result = await getDictationCompletionSummary(classId, dictationId);

    expect(result).toEqual({
      enteredCount: 0,
      totalLeveledCount: 0,
      isComplete: false,
    });
  });

  it("marks the dictation complete when every leveled student has an entry", async () => {
    mockListLeveledActiveStudents.mockResolvedValueOnce([
      { id: studentA, displayName: "ÉLÈVE A", level: "yellow" },
      { id: studentB, displayName: "ÉLÈVE B", level: "green" },
    ]);
    mockGetDictationEntriesByDictationId.mockResolvedValueOnce([
      {
        studentId: studentA,
        displayName: "ÉLÈVE A",
        archived: false,
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
      },
      {
        studentId: studentB,
        displayName: "ÉLÈVE B",
        archived: false,
        levelAtSave: "green",
        wordDenominator: 12,
        globalPercent: 85,
        errorsC: 0,
        errorsH: 0,
        errorsA: 0,
        errorsM: 0,
        errorsP: 0,
        errorsI: 0,
        errorsO: 0,
        errorsN: 0,
        errorsS: 0,
      },
    ]);

    const result = await getDictationCompletionSummary(classId, dictationId);

    expect(result).toEqual({
      enteredCount: 2,
      totalLeveledCount: 2,
      isComplete: true,
    });
  });

  it("counts duplicate active entries for the same student once", async () => {
    mockListLeveledActiveStudents.mockResolvedValueOnce([
      { id: studentA, displayName: "ÉLÈVE A", level: "yellow" },
      { id: studentB, displayName: "ÉLÈVE B", level: "green" },
    ]);
    mockGetDictationEntriesByDictationId.mockResolvedValueOnce([
      {
        studentId: studentA,
        displayName: "ÉLÈVE A",
        archived: false,
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
      },
      {
        studentId: studentA,
        displayName: "ÉLÈVE A",
        archived: false,
        levelAtSave: "yellow",
        wordDenominator: 10,
        globalPercent: 88,
        errorsC: 0,
        errorsH: 0,
        errorsA: 0,
        errorsM: 0,
        errorsP: 0,
        errorsI: 0,
        errorsO: 0,
        errorsN: 0,
        errorsS: 0,
      },
      {
        studentId: studentB,
        displayName: "ÉLÈVE B",
        archived: false,
        levelAtSave: "green",
        wordDenominator: 12,
        globalPercent: 85,
        errorsC: 0,
        errorsH: 0,
        errorsA: 0,
        errorsM: 0,
        errorsP: 0,
        errorsI: 0,
        errorsO: 0,
        errorsN: 0,
        errorsS: 0,
      },
    ]);

    const result = await getDictationCompletionSummary(classId, dictationId);

    expect(result).toEqual({
      enteredCount: 2,
      totalLeveledCount: 2,
      isComplete: true,
    });
  });
});
