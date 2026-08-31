import { and, eq, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { pendingPromotions, students } from "@/lib/db/schema";

export async function countPendingPromotionsForClass(
  classId: string
): Promise<number> {
  const db = getDb();

  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(pendingPromotions)
    .innerJoin(students, eq(pendingPromotions.studentId, students.id))
    .where(
      and(eq(students.classId, classId), eq(students.archived, false))
    );

  return row?.count ?? 0;
}
