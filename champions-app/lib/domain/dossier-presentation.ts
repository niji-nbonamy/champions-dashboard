import type { StudentDictationHistoryEntry } from "@/lib/services/get-student-dictation-history";

export function getLastDictationPercent(
  history: StudentDictationHistoryEntry[]
): number | null {
  if (history.length === 0) {
    return null;
  }

  return history[0].globalPercent;
}

export function getPresentationTrendDelta(
  history: StudentDictationHistoryEntry[]
): number | null {
  if (history.length < 2) {
    return null;
  }

  return history[0].globalPercent - history[1].globalPercent;
}
