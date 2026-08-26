import { and, eq, isNull, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { students } from "@/lib/db/schema";

export async function countUnassignedActiveStudents(
  classId: string
): Promise<number> {
  const db = getDb();

  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(students)
    .where(
      and(
        eq(students.classId, classId),
        eq(students.archived, false),
        isNull(students.level)
      )
    );

  return row?.count ?? 0;
}
