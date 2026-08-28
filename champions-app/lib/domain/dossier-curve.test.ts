import { describe, expect, it } from "vitest";

import { toCurvePoints } from "./dossier-curve";
import type { StudentDictationHistoryEntry } from "@/lib/services/get-student-dictation-history";

function makeEntry(
  overrides: Partial<StudentDictationHistoryEntry> & {
    dictationDate: string;
    label: string;
    globalPercent: number;
  }
): StudentDictationHistoryEntry {
  return {
    entryId: "aa0e8400-e29b-41d4-a716-446655440010",
    dictationId: "880e8400-e29b-41d4-a716-446655440003",
    levelAtSave: "yellow",
    wordDenominator: 40,
    categoryErrors: {
      C: 0,
      H: 0,
      A: 0,
      M: 0,
      P: 0,
      I: 0,
      O: 0,
      N: 0,
      S: 0,
    },
    ...overrides,
  };
}

describe("toCurvePoints", () => {
  it("sorts history ascending by dictation date for left-to-right progression", () => {
    const history = [
      makeEntry({
        dictationDate: "2026-08-27",
        label: "Dictée B",
        globalPercent: 92,
      }),
      makeEntry({
        dictationDate: "2026-08-20",
        label: "Dictée A",
        globalPercent: 88,
      }),
      makeEntry({
        dictationDate: "2026-08-13",
        label: "Dictée C",
        globalPercent: 75,
      }),
    ];

    expect(toCurvePoints(history)).toEqual([
      {
        entryId: "aa0e8400-e29b-41d4-a716-446655440010",
        date: "2026-08-13",
        label: "Dictée C",
        percent: 75,
      },
      {
        entryId: "aa0e8400-e29b-41d4-a716-446655440010",
        date: "2026-08-20",
        label: "Dictée A",
        percent: 88,
      },
      {
        entryId: "aa0e8400-e29b-41d4-a716-446655440010",
        date: "2026-08-27",
        label: "Dictée B",
        percent: 92,
      },
    ]);
  });

  it("maps a single dictation to one curve point", () => {
    const history = [
      makeEntry({
        dictationDate: "2026-08-20",
        label: "Dictée A",
        globalPercent: 88,
      }),
    ];

    expect(toCurvePoints(history)).toEqual([
      {
        entryId: "aa0e8400-e29b-41d4-a716-446655440010",
        date: "2026-08-20",
        label: "Dictée A",
        percent: 88,
      },
    ]);
  });

  it("breaks ties on the same dictation date using label ascending", () => {
    const history = [
      makeEntry({
        entryId: "bb0e8400-e29b-41d4-a716-446655440011",
        dictationDate: "2026-08-20",
        label: "Dictée B",
        globalPercent: 90,
      }),
      makeEntry({
        entryId: "cc0e8400-e29b-41d4-a716-446655440012",
        dictationDate: "2026-08-20",
        label: "Dictée A",
        globalPercent: 85,
      }),
    ];

    expect(toCurvePoints(history)).toEqual([
      {
        entryId: "cc0e8400-e29b-41d4-a716-446655440012",
        date: "2026-08-20",
        label: "Dictée A",
        percent: 85,
      },
      {
        entryId: "bb0e8400-e29b-41d4-a716-446655440011",
        date: "2026-08-20",
        label: "Dictée B",
        percent: 90,
      },
    ]);
  });

  it("breaks ties on identical date and label using entryId ascending", () => {
    const history = [
      makeEntry({
        entryId: "bb0e8400-e29b-41d4-a716-446655440011",
        dictationDate: "2026-08-20",
        label: "Dictée A",
        globalPercent: 90,
      }),
      makeEntry({
        entryId: "aa0e8400-e29b-41d4-a716-446655440010",
        dictationDate: "2026-08-20",
        label: "Dictée A",
        globalPercent: 85,
      }),
    ];

    expect(toCurvePoints(history)).toEqual([
      {
        entryId: "aa0e8400-e29b-41d4-a716-446655440010",
        date: "2026-08-20",
        label: "Dictée A",
        percent: 85,
      },
      {
        entryId: "bb0e8400-e29b-41d4-a716-446655440011",
        date: "2026-08-20",
        label: "Dictée A",
        percent: 90,
      },
    ]);
  });

  it("returns an empty array when history is empty", () => {
    expect(toCurvePoints([])).toEqual([]);
  });
});
