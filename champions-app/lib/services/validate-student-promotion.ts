import { and, eq } from "drizzle-orm";

import { parseChampionsLevel } from "@/lib/domain/champions-level";
import { getNextLevel } from "@/lib/domain/promotion";
import { PROMOTION_VALIDATE_GENERIC_ERROR } from "@/lib/domain/promotion-messages";
import type { ChampionsLevel } from "@/lib/design/tokens";
import { getDb } from "@/lib/db";
import {
  levelHistoryEntries,
  pendingPromotions,
  students,
} from "@/lib/db/schema";

export { PROMOTION_VALIDATE_GENERIC_ERROR } from "@/lib/domain/promotion-messages";

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
  let validatedLevel: ChampionsLevel | null = null;

  await db.transaction(async (tx) => {
    const [pendingRow] = await tx
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

    if (!pendingRow) {
      throw new PendingPromotionNotFoundError();
    }

    const targetLevel = parseChampionsLevel(pendingRow.targetLevel);
    if (!targetLevel) {
      throw new StudentPromotionError(PROMOTION_VALIDATE_GENERIC_ERROR);
    }

    const [student] = await tx
      .select({ level: students.level })
      .from(students)
      .where(
        and(
          eq(students.id, studentId),
          eq(students.classId, classId),
          eq(students.archived, false)
        )
      )
      .limit(1);

    if (!student) {
      throw new StudentNotFoundForPromotionError();
    }

    const currentLevel = student.level
      ? parseChampionsLevel(student.level)
      : null;
    if (!currentLevel || getNextLevel(currentLevel) !== targetLevel) {
      throw new StudentPromotionError(PROMOTION_VALIDATE_GENERIC_ERROR);
    }

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

    validatedLevel = targetLevel;
  });

  return { studentId, level: validatedLevel! };
}
