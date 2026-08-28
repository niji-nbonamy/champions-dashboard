import { and, eq } from "drizzle-orm";

import { parseChampionsLevel } from "@/lib/domain/champions-level";
import type { ChampionsLevel } from "@/lib/design/tokens";
import { getDb } from "@/lib/db";
import {
  levelHistoryEntries,
  pendingPromotions,
  students,
} from "@/lib/db/schema";

export const PROMOTION_VALIDATE_GENERIC_ERROR =
  "Validation impossible. Réessayez.";

export class StudentPromotionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StudentPromotionError";
  }
}

export class PendingPromotionNotFoundError extends StudentPromotionError {
  constructor() {
    super("Aucune promotion en attente.");
    this.name = "PendingPromotionNotFoundError";
  }
}

export class StudentNotFoundForPromotionError extends StudentPromotionError {
  constructor() {
    super("Élève introuvable.");
    this.name = "StudentNotFoundForPromotionError";
  }
}

export type ValidateStudentPromotionResult = {
  studentId: string;
  level: ChampionsLevel;
};

export async function validateStudentPromotion(
  classId: string,
  studentId: string
): Promise<ValidateStudentPromotionResult> {
  const db = getDb();

  const [pending] = await db
    .select({
      targetLevel: pendingPromotions.targetLevel,
    })
    .from(pendingPromotions)
    .innerJoin(students, eq(pendingPromotions.studentId, students.id))
    .where(
      and(
        eq(pendingPromotions.studentId, studentId),
        eq(students.classId, classId),
        eq(students.archived, false)
      )
    )
    .limit(1);

  if (!pending) {
    throw new PendingPromotionNotFoundError();
  }

  const targetLevel = parseChampionsLevel(pending.targetLevel);
  if (!targetLevel) {
    throw new StudentPromotionError(PROMOTION_VALIDATE_GENERIC_ERROR);
  }

  await db.transaction(async (tx) => {
    const [updatedStudent] = await tx
      .update(students)
      .set({ level: targetLevel })
      .where(
        and(
          eq(students.id, studentId),
          eq(students.classId, classId),
          eq(students.archived, false)
        )
      )
      .returning({ id: students.id });

    if (!updatedStudent) {
      throw new StudentNotFoundForPromotionError();
    }

    const [deletedPending] = await tx
      .delete(pendingPromotions)
      .where(eq(pendingPromotions.studentId, studentId))
      .returning({ id: pendingPromotions.id });

    if (!deletedPending) {
      throw new PendingPromotionNotFoundError();
    }

    await tx.insert(levelHistoryEntries).values({
      studentId,
      level: targetLevel,
      action: "promoted",
    });
  });

  return { studentId, level: targetLevel };
}
