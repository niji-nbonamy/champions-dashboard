import { and, eq } from "drizzle-orm";

import { parseChampionsLevel } from "@/lib/domain/champions-level";
import { getDb } from "@/lib/db";
import {
  levelHistoryEntries,
  pendingPromotions,
  students,
} from "@/lib/db/schema";

import {
  PendingPromotionNotFoundError,
  StudentNotFoundForPromotionError,
  StudentPromotionError,
} from "./validate-student-promotion";

export const PROMOTION_REFUSE_GENERIC_ERROR = "Refus impossible. Réessayez.";

export type RefuseStudentPromotionResult = {
  studentId: string;
};

export async function refuseStudentPromotion(
  classId: string,
  studentId: string
): Promise<RefuseStudentPromotionResult> {
  const db = getDb();

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
      throw new StudentPromotionError(PROMOTION_REFUSE_GENERIC_ERROR);
    }

    const [student] = await tx
      .select({ id: students.id })
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
      action: "refused",
    });
  });

  return { studentId };
}
