import { and, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { students } from "@/lib/db/schema";

export type ActiveStudent = {
  id: string;
  displayName: string;
  level: string | null;
};

export async function listActiveStudents(
  classId: string
): Promise<ActiveStudent[]> {
  const db = getDb();

  return db
    .select({
      id: students.id,
      displayName: students.displayName,
      level: students.level,
    })
    .from(students)
    .where(and(eq(students.classId, classId), eq(students.archived, false)))
    .then((rows) =>
      [...rows].sort((left, right) =>
        left.displayName.localeCompare(right.displayName, "fr")
      )
    );
}
