import { and, desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { levelHistoryEntries, students } from "@/lib/db/schema";

export type StudentLevelHistoryEntry = {
  id: string;
  level: string;
  action: string;
  occurredAt: Date;
};

export async function getStudentLevelHistory(
  classId: string,
  studentId: string
): Promise<StudentLevelHistoryEntry[]> {
  const db = getDb();

  const rows = await db
    .select({
      id: levelHistoryEntries.id,
      level: levelHistoryEntries.level,
      action: levelHistoryEntries.action,
      occurredAt: levelHistoryEntries.occurredAt,
    })
    .from(levelHistoryEntries)
    .innerJoin(students, eq(levelHistoryEntries.studentId, students.id))
    .where(
      and(eq(students.id, studentId), eq(students.classId, classId))
    )
    .orderBy(
      desc(levelHistoryEntries.occurredAt),
      desc(levelHistoryEntries.id)
    );

  return rows;
}
