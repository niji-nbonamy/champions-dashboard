import { and, asc, eq } from "drizzle-orm";

import { parseChampionsLevel } from "@/lib/domain/champions-level";
import type { ChampionsLevel } from "@/lib/design/tokens";
import { getDb } from "@/lib/db";
import { pendingPromotions, students } from "@/lib/db/schema";

export type PendingPromotionQueueItem = {
  studentId: string;
  displayName: string;
  targetLevel: ChampionsLevel;
};

export async function listPendingPromotionQueueForClass(
  classId: string
): Promise<PendingPromotionQueueItem[]> {
  const db = getDb();

  const rows = await db
    .select({
      studentId: pendingPromotions.studentId,
      displayName: students.displayName,
      targetLevel: pendingPromotions.targetLevel,
    })
    .from(pendingPromotions)
    .innerJoin(students, eq(pendingPromotions.studentId, students.id))
    .where(
      and(eq(students.classId, classId), eq(students.archived, false))
    )
    .orderBy(asc(students.displayName));

  return rows.reduce<PendingPromotionQueueItem[]>((queue, row) => {
    const targetLevel = parseChampionsLevel(row.targetLevel);
    if (!targetLevel) {
      return queue;
    }

    queue.push({
      studentId: row.studentId,
      displayName: row.displayName,
      targetLevel,
    });
    return queue;
  }, []);
}
