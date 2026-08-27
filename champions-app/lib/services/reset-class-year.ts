import { eq, inArray } from "drizzle-orm";

import { getDb } from "@/lib/db";
import {
  classes,
  levelHistoryEntries,
  students,
  wordCountMatrixRows,
} from "@/lib/db/schema";

export class ResetClassYearError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResetClassYearError";
  }
}

export class ClassNotFoundError extends ResetClassYearError {
  constructor() {
    super("Classe introuvable.");
    this.name = "ClassNotFoundError";
  }
}

export const RESET_CLASS_YEAR_GENERIC_ERROR =
  "Réinitialisation impossible. Réessayez.";

export type ResetClassYearResult = {
  classId: string;
};

/**
 * Wipes all class-scoped data for a new school year inside one transaction.
 * Extension point (Epic 3): add deletes for `dictations`, `dictation_entries`,
 * and `pending_promotions` here when those tables exist.
 */
export async function resetClassYear(
  classId: string,
  newSchoolYearLabel: string | null
): Promise<ResetClassYearResult> {
  const db = getDb();

  const [classRow] = await db
    .select({ id: classes.id })
    .from(classes)
    .where(eq(classes.id, classId))
    .limit(1);

  if (!classRow) {
    throw new ClassNotFoundError();
  }

  await db.transaction(async (tx) => {
    const classStudents = await tx
      .select({ id: students.id })
      .from(students)
      .where(eq(students.classId, classId));

    if (classStudents.length > 0) {
      await tx
        .delete(levelHistoryEntries)
        .where(
          inArray(
            levelHistoryEntries.studentId,
            classStudents.map((student) => student.id)
          )
        );
    }

    await tx.delete(students).where(eq(students.classId, classId));

    await tx
      .delete(wordCountMatrixRows)
      .where(eq(wordCountMatrixRows.classId, classId));

    const classUpdate: {
      yearStartRosterConfirmedAt: null;
      yearStartWizardCompletedAt: null;
      schoolYearLabel?: string;
    } = {
      yearStartRosterConfirmedAt: null,
      yearStartWizardCompletedAt: null,
    };

    if (newSchoolYearLabel !== null) {
      classUpdate.schoolYearLabel = newSchoolYearLabel;
    }

    const [updatedClass] = await tx
      .update(classes)
      .set(classUpdate)
      .where(eq(classes.id, classId))
      .returning({ id: classes.id });

    if (!updatedClass) {
      throw new ClassNotFoundError();
    }
  });

  return { classId };
}
