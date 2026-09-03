import type { StudentDictationHistoryEntry } from "@/lib/services/get-student-dictation-history";

export type CurvePoint = {
  entryId: string;
  date: string;
  label: string;
  percent: number;
};

export function toCurvePoints(
  history: StudentDictationHistoryEntry[]
): CurvePoint[] {
  return [...history]
    .sort(
      (a, b) =>
        a.dictationDate.localeCompare(b.dictationDate) ||
        a.label.localeCompare(b.label) ||
        a.entryId.localeCompare(b.entryId)
    )
    .map((entry) => ({
      entryId: entry.entryId,
      date: entry.dictationDate,
      label: entry.label,
      percent: entry.globalPercent,
    }));
}
