import { and, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { students } from "@/lib/db/schema";

export type ClassStudentFilter = "active" | "archived" | "all";

export type ClassStudent = {
  id: string;
  displayName: string;
  level: string | null;
  archived: boolean;
};

function buildFilterWhere(classId: string, filter: ClassStudentFilter) {
  if (filter === "archived") {
    return and(eq(students.classId, classId), eq(students.archived, true));
  }

  if (filter === "all") {
    return eq(students.classId, classId);
  }

  return and(eq(students.classId, classId), eq(students.archived, false));
}

export async function listClassStudents(
  classId: string,
  filter: ClassStudentFilter = "active"
): Promise<ClassStudent[]> {
  const db = getDb();

  return db
    .select({
      id: students.id,
      displayName: students.displayName,
      level: students.level,
      archived: students.archived,
    })
    .from(students)
    .where(buildFilterWhere(classId, filter))
    .then((rows) =>
      [...rows].sort((left, right) =>
        left.displayName.localeCompare(right.displayName, "fr")
      )
    );
}
