export type YearStartReadinessInput = {
  completed: boolean;
  activeStudentCount: number;
  unassignedCount: number;
  matrixRowCount: number;
};

/**
 * True when the class can leave wizard-only hard-delete and use mid-year archive.
 * Covers teachers who configured roster, levels, and matrix without clicking wizard « Terminer ».
 */
export function canArchiveStudents(status: YearStartReadinessInput): boolean {
  if (status.completed) {
    return true;
  }

  return (
    status.activeStudentCount > 0 &&
    status.unassignedCount === 0 &&
    status.matrixRowCount > 0
  );
}
