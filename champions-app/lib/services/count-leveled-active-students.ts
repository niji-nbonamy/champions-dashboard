import { and, eq, isNotNull } from "drizzle-orm";

import { isChampionsLevel } from "@/lib/domain/champions-level";
import { getDb } from "@/lib/db";
import { students } from "@/lib/db/schema";

export async function countLeveledActiveStudents(
  classId: string
): Promise<number> {
  const db = getDb();

  const rows = await db
    .select({
      level: students.level,
    })
    .from(students)
    .where(
      and(
        eq(students.classId, classId),
        eq(students.archived, false),
        isNotNull(students.level)
      )
    );

  return rows.filter(
    (row): row is { level: string } =>
      row.level !== null && isChampionsLevel(row.level)
  ).length;
}
