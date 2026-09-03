import {
  buildHistoricalCompletionSummary,
  hasHistoricalRosterShape,
} from "@/lib/domain/dictation-roster";
import { countUniqueEnteredLeveledStudents } from "@/lib/domain/dictation-entry-completion";

import { getDictationEntriesByDictationId } from "./get-dictation-entries";
import { listLeveledActiveStudents } from "./list-leveled-active-students";

export type DictationCompletionSummary = {
  enteredCount: number;
  totalLeveledCount: number;
  isComplete: boolean;
};

export async function getDictationCompletionSummary(
  classId: string,
  dictationId: string
): Promise<DictationCompletionSummary> {
  const [students, entries] = await Promise.all([
    listLeveledActiveStudents(classId),
    getDictationEntriesByDictationId(classId, dictationId),
  ]);

  if (hasHistoricalRosterShape(entries, students)) {
    return buildHistoricalCompletionSummary(entries);
  }

  const leveledStudentIds = students.map((student) => student.id);
  const enteredCount = countUniqueEnteredLeveledStudents(
    leveledStudentIds,
    entries
  );
  const totalLeveledCount = students.length;
  const isComplete =
    totalLeveledCount > 0 && enteredCount === totalLeveledCount;

  return {
    enteredCount,
    totalLeveledCount,
    isComplete,
  };
}
