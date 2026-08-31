import { describe, expect, it } from "vitest";

import {
  getLastDictationPercent,
  getPresentationTrendDelta,
} from "./dossier-presentation";
import type { StudentDictationHistoryEntry } from "@/lib/services/get-student-dictation-history";

function makeEntry(
  overrides: Partial<StudentDictationHistoryEntry> & {
    globalPercent: number;
  }
): StudentDictationHistoryEntry {
  return {
    entryId: "aa0e8400-e29b-41d4-a716-446655440010",
    dictationId: "880e8400-e29b-41d4-a716-446655440003",
    label: "Dictée A",
    dictationDate: "2026-08-20",
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

describe("getLastDictationPercent", () => {
  it("returns null when history is empty", () => {
    expect(getLastDictationPercent([])).toBeNull();
  });

  it("returns the newest global percent from newest-first history", () => {
    const history = [
      makeEntry({ globalPercent: 87 }),
      makeEntry({
        entryId: "bb0e8400-e29b-41d4-a716-446655440011",
        globalPercent: 75,
      }),
    ];

    expect(getLastDictationPercent(history)).toBe(87);
  });
});

describe("getPresentationTrendDelta", () => {
  it("returns null when history is empty", () => {
    expect(getPresentationTrendDelta([])).toBeNull();
  });

  it("returns null when only one dictation exists", () => {
    expect(getPresentationTrendDelta([makeEntry({ globalPercent: 87 })])).toBeNull();
  });

  it("returns the delta between the two most recent dictations", () => {
    const history = [
      makeEntry({ globalPercent: 87 }),
      makeEntry({
        entryId: "bb0e8400-e29b-41d4-a716-446655440011",
        globalPercent: 83,
      }),
    ];

    expect(getPresentationTrendDelta(history)).toBe(4);
  });

  it("returns a negative delta when the newest percent is lower", () => {
    const history = [
      makeEntry({ globalPercent: 80 }),
      makeEntry({
        entryId: "bb0e8400-e29b-41d4-a716-446655440011",
        globalPercent: 92,
      }),
    ];

    expect(getPresentationTrendDelta(history)).toBe(-12);
  });

  it("returns zero when the two most recent percents are equal", () => {
    const history = [
      makeEntry({ globalPercent: 88 }),
      makeEntry({
        entryId: "bb0e8400-e29b-41d4-a716-446655440011",
        globalPercent: 88,
      }),
    ];

    expect(getPresentationTrendDelta(history)).toBe(0);
  });
});
