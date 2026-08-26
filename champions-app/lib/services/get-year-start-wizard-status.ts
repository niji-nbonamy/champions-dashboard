import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { classes } from "@/lib/db/schema";

import { countActiveStudents } from "./count-active-students";
import { countUnassignedActiveStudents } from "./count-unassigned-active-students";
import {
  listWordCountMatrixRows,
  type WordCountMatrixRowRecord,
} from "./list-word-count-matrix-rows";

export type YearStartWizardStep = 1 | 2 | 3;

export type YearStartWizardStatus = {
  completed: boolean;
  step: YearStartWizardStep;
  activeStudentCount: number;
  unassignedCount: number;
  matrixRowCount: number;
};

function isCompleteMatrixRow(row: WordCountMatrixRowRecord): boolean {
  return (
    row.wordsYellow > 0 &&
    row.wordsGreen > 0 &&
    row.wordsViolet > 0 &&
    row.wordsGold > 0
  );
}

export function resolveEarliestIncompleteWizardStep(
  activeStudentCount: number,
  unassignedCount: number,
  matrixRowCount: number,
  rosterConfirmed: boolean
): YearStartWizardStep {
  if (activeStudentCount === 0) {
    return 1;
  }

  if (!rosterConfirmed) {
    return 1;
  }

  if (unassignedCount > 0) {
    return 2;
  }

  if (matrixRowCount === 0) {
    return 3;
  }

  return 3;
}

export async function getYearStartWizardStatus(
  classId: string
): Promise<YearStartWizardStatus> {
  const db = getDb();

  const [classRow] = await db
    .select({
      yearStartRosterConfirmedAt: classes.yearStartRosterConfirmedAt,
      yearStartWizardCompletedAt: classes.yearStartWizardCompletedAt,
    })
    .from(classes)
    .where(eq(classes.id, classId))
    .limit(1);

  const activeStudentCount = await countActiveStudents(classId);
  const unassignedCount = await countUnassignedActiveStudents(classId);
  const matrixRows = await listWordCountMatrixRows(classId);
  const matrixRowCount = matrixRows.filter(isCompleteMatrixRow).length;
  const rosterConfirmed = classRow?.yearStartRosterConfirmedAt != null;
  const completed = classRow?.yearStartWizardCompletedAt != null;
  const step = resolveEarliestIncompleteWizardStep(
    activeStudentCount,
    unassignedCount,
    matrixRowCount,
    rosterConfirmed
  );

  return {
    completed,
    step,
    activeStudentCount,
    unassignedCount,
    matrixRowCount,
  };
}
