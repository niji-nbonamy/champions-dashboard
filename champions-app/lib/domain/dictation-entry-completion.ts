export type DictationEntryStudentRef = {
  studentId: string;
  archived: boolean;
};

export function getUniqueEnteredLeveledStudentIds(
  leveledStudentIds: Iterable<string>,
  entries: ReadonlyArray<DictationEntryStudentRef>
): string[] {
  const leveledSet = new Set(leveledStudentIds);
  const entered = new Set<string>();

  for (const entry of entries) {
    if (!entry.archived && leveledSet.has(entry.studentId)) {
      entered.add(entry.studentId);
    }
  }

  return [...entered];
}

export function countUniqueEnteredLeveledStudents(
  leveledStudentIds: Iterable<string>,
  entries: ReadonlyArray<DictationEntryStudentRef>
): number {
  return getUniqueEnteredLeveledStudentIds(leveledStudentIds, entries).length;
}
