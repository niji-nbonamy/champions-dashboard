import { and, eq, isNotNull } from "drizzle-orm";

import { isChampionsLevel } from "@/lib/domain/champions-level";
import { getDb } from "@/lib/db";
import { students } from "@/lib/db/schema";

export type LeveledActiveStudent = {
  id: string;
  displayName: string;
  level: string;
  hasSpeechTherapy: boolean;
};

export async function listLeveledActiveStudents(
  classId: string
): Promise<LeveledActiveStudent[]> {
  const db = getDb();

  return db
    .select({
      id: students.id,
      displayName: students.displayName,
      level: students.level,
      hasSpeechTherapy: students.hasSpeechTherapy,
    })
    .from(students)
    .where(
      and(
        eq(students.classId, classId),
        eq(students.archived, false),
        isNotNull(students.level)
      )
    )
    .then((rows) =>
      rows
        .filter(
          (row): row is LeveledActiveStudent =>
            row.level !== null && isChampionsLevel(row.level)
        )
        .sort((left, right) =>
          left.displayName.localeCompare(right.displayName, "fr")
        )
    );
}
