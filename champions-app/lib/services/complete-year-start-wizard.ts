import { and, eq, isNull } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { classes } from "@/lib/db/schema";

import { getYearStartWizardStatus } from "./get-year-start-wizard-status";

export class CompleteYearStartWizardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CompleteYearStartWizardError";
  }
}

export class ClassNotFoundError extends CompleteYearStartWizardError {
  constructor() {
    super("Classe introuvable.");
    this.name = "ClassNotFoundError";
  }
}

export type CompleteYearStartWizardResult = {
  completedAt: Date;
  alreadyComplete: boolean;
};

export async function completeYearStartWizard(
  classId: string
): Promise<CompleteYearStartWizardResult> {
  const db = getDb();

  const [existingClass] = await db
    .select({
      yearStartWizardCompletedAt: classes.yearStartWizardCompletedAt,
    })
    .from(classes)
    .where(eq(classes.id, classId))
    .limit(1);

  if (!existingClass) {
    throw new ClassNotFoundError();
  }

  if (existingClass.yearStartWizardCompletedAt != null) {
    return {
      completedAt: existingClass.yearStartWizardCompletedAt,
      alreadyComplete: true,
    };
  }

  const status = await getYearStartWizardStatus(classId);

  if (status.activeStudentCount === 0) {
    throw new CompleteYearStartWizardError(
      "Ajoutez au moins un élève avant de terminer la configuration."
    );
  }

  if (status.unassignedCount > 0) {
    throw new CompleteYearStartWizardError(
      "Assignez un niveau à chaque élève avant de terminer la configuration."
    );
  }

  if (status.matrixRowCount === 0) {
    throw new CompleteYearStartWizardError(
      "Enregistrez au moins une dictée complète dans la matrice."
    );
  }

  const completedAt = new Date();

  const [updatedClass] = await db
    .update(classes)
    .set({ yearStartWizardCompletedAt: completedAt })
    .where(
      and(eq(classes.id, classId), isNull(classes.yearStartWizardCompletedAt))
    )
    .returning({ yearStartWizardCompletedAt: classes.yearStartWizardCompletedAt });

  if (!updatedClass?.yearStartWizardCompletedAt) {
    const [classAfterRace] = await db
      .select({
        yearStartWizardCompletedAt: classes.yearStartWizardCompletedAt,
      })
      .from(classes)
      .where(eq(classes.id, classId))
      .limit(1);

    if (!classAfterRace?.yearStartWizardCompletedAt) {
      throw new ClassNotFoundError();
    }

    return {
      completedAt: classAfterRace.yearStartWizardCompletedAt,
      alreadyComplete: true,
    };
  }

  return {
    completedAt: updatedClass.yearStartWizardCompletedAt,
    alreadyComplete: false,
  };
}
