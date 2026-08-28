import { and, eq, inArray } from "drizzle-orm";

import { parseChampionsLevel } from "@/lib/domain/champions-level";
import type { ChampionsLevel } from "@/lib/design/tokens";
import { getDb } from "@/lib/db";
import { pendingPromotions, students } from "@/lib/db/schema";

export type PendingPromotionByStudent = {
  targetLevel: ChampionsLevel;
};

export async function listPendingPromotionsForStudents(
  classId: string,
  studentIds: string[]
): Promise<Record<string, PendingPromotionByStudent>> {
  if (studentIds.length === 0) {
    return {};
  }

  const db = getDb();

  const rows = await db
    .select({
      studentId: pendingPromotions.studentId,
      targetLevel: pendingPromotions.targetLevel,
    })
    .from(pendingPromotions)
    .innerJoin(students, eq(pendingPromotions.studentId, students.id))
    .where(
      and(
        eq(students.classId, classId),
        inArray(pendingPromotions.studentId, studentIds)
      )
    );

  return rows.reduce<Record<string, PendingPromotionByStudent>>(
    (byStudentId, row) => {
      const targetLevel = parseChampionsLevel(row.targetLevel);
      if (!targetLevel) {
        return byStudentId;
      }

      byStudentId[row.studentId] = { targetLevel };
      return byStudentId;
    },
    {}
  );
}
