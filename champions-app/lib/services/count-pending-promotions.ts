import { and, eq } from "drizzle-orm";

import { parseChampionsLevel } from "@/lib/domain/champions-level";
import { getDb } from "@/lib/db";
import { pendingPromotions, students } from "@/lib/db/schema";

export async function countPendingPromotionsForClass(
  classId: string
): Promise<number> {
  const db = getDb();

  const rows = await db
    .select({ targetLevel: pendingPromotions.targetLevel })
    .from(pendingPromotions)
    .innerJoin(students, eq(pendingPromotions.studentId, students.id))
    .where(
      and(eq(students.classId, classId), eq(students.archived, false))
    );

  return rows.reduce((count, row) => {
    return parseChampionsLevel(row.targetLevel) ? count + 1 : count;
  }, 0);
}
