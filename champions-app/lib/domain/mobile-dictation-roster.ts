import type { DictationEntryWithStudent } from "@/lib/services/get-dictation-entries";
import type { ActiveStudent } from "@/lib/services/list-active-students";
import type { LeveledActiveStudent } from "@/lib/services/list-leveled-active-students";

import {
  getUniqueEnteredLeveledStudentIds,
} from "./dictation-entry-completion";

export type MobileDictationPickerStudent = {
  id: string;
  displayName: string;
  level: string | null;
  readOnly?: boolean;
};

export type MobileDictationRosterState = {
  students: MobileDictationPickerStudent[];
  enteredStudentIds: string[];
  remainingCount: number;
  leveledStudentCount: number;
  orderedEditableStudentIds: string[];
  isHistoricalRoster: boolean;
};

function uniqueEntriesByStudentId(
  entries: ReadonlyArray<DictationEntryWithStudent>
): DictationEntryWithStudent[] {
  const seen = new Set<string>();

  return entries.filter((entry) => {
    if (seen.has(entry.studentId)) {
      return false;
    }

    seen.add(entry.studentId);
    return true;
  });
}

export function hasHistoricalRosterShape(
  entries: ReadonlyArray<DictationEntryWithStudent>,
  leveledStudents: ReadonlyArray<LeveledActiveStudent>
): boolean {
  if (entries.length === 0) {
    return false;
  }

  const leveledIds = new Set(leveledStudents.map((student) => student.id));

  return (
    entries.some((entry) => entry.archived) ||
    entries.some((entry) => !leveledIds.has(entry.studentId))
  );
}

export function buildMobileDictationRosterState(
  entries: ReadonlyArray<DictationEntryWithStudent>,
  activeStudents: ReadonlyArray<ActiveStudent>,
  leveledStudents: ReadonlyArray<LeveledActiveStudent>
): MobileDictationRosterState {
  const leveledStudentIds = leveledStudents.map((student) => student.id);
  const isHistoricalRoster = hasHistoricalRosterShape(entries, leveledStudents);

  if (entries.length === 0) {
    const enteredStudentIds = getUniqueEnteredLeveledStudentIds(
      leveledStudentIds,
      entries
    );
    const leveledStudentCount = leveledStudents.length;

    return {
      students: activeStudents.map((student) => ({
        id: student.id,
        displayName: student.displayName,
        level: student.level,
      })),
      enteredStudentIds,
      remainingCount: leveledStudentCount - enteredStudentIds.length,
      leveledStudentCount,
      orderedEditableStudentIds: leveledStudentIds,
      isHistoricalRoster: false,
    };
  }

  const activeStudentsById = new Map(
    activeStudents.map((student) => [student.id, student])
  );
  const uniqueEntries = uniqueEntriesByStudentId(entries);
  const entryIds = new Set(uniqueEntries.map((entry) => entry.studentId));

  const studentsFromEntries: MobileDictationPickerStudent[] = uniqueEntries.map(
    (entry) => ({
      id: entry.studentId,
      displayName:
        activeStudentsById.get(entry.studentId)?.displayName ??
        entry.displayName,
      level: entry.levelAtSave,
      readOnly: entry.archived,
    })
  );

  let students: MobileDictationPickerStudent[];

  if (isHistoricalRoster) {
    students = studentsFromEntries;
  } else {
    const additionalLeveled = leveledStudents
      .filter((student) => !entryIds.has(student.id))
      .map((student) => ({
        id: student.id,
        displayName: student.displayName,
        level: student.level,
        readOnly: false,
      }));
    const additionalUnleveled = activeStudents
      .filter((student) => student.level == null && !entryIds.has(student.id))
      .map((student) => ({
        id: student.id,
        displayName: student.displayName,
        level: student.level,
        readOnly: false,
      }));

    students = [
      ...studentsFromEntries,
      ...additionalLeveled,
      ...additionalUnleveled,
    ];
  }

  const editableLeveledIds = students
    .filter((student) => student.level != null && !student.readOnly)
    .map((student) => student.id);
  const enteredStudentIds = getUniqueEnteredLeveledStudentIds(
    editableLeveledIds,
    entries
  );
  const leveledStudentCount = editableLeveledIds.length;

  return {
    students,
    enteredStudentIds,
    remainingCount: leveledStudentCount - enteredStudentIds.length,
    leveledStudentCount,
    orderedEditableStudentIds: isHistoricalRoster
      ? editableLeveledIds
      : leveledStudentIds,
    isHistoricalRoster,
  };
}

export function buildHistoricalCompletionSummary(
  entries: ReadonlyArray<DictationEntryWithStudent>
): {
  enteredCount: number;
  totalLeveledCount: number;
  isComplete: boolean;
} {
  const editableEntries = entries.filter((entry) => !entry.archived);
  const totalLeveledCount = editableEntries.length;

  return {
    enteredCount: totalLeveledCount,
    totalLeveledCount,
    isComplete: totalLeveledCount > 0,
  };
}
