import { and, eq, isNull } from "drizzle-orm";

import {
  ASSIGN_STUDENT_LEVEL_GENERIC_ERROR,
  parseChampionsLevel,
} from "@/lib/domain/champions-level";
import type { ChampionsLevel } from "@/lib/design/tokens";
import { getDb } from "@/lib/db";
import { levelHistoryEntries, students } from "@/lib/db/schema";

export class AssignStudentLevelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssignStudentLevelError";
  }
}

export class StudentNotFoundError extends AssignStudentLevelError {
  constructor() {
    super("Élève introuvable.");
    this.name = "StudentNotFoundError";
  }
}

export class StudentAlreadyAssignedError extends AssignStudentLevelError {
  constructor() {
    super("Le niveau est déjà assigné.");
    this.name = "StudentAlreadyAssignedError";
  }
}

export type AssignStudentLevelResult = {
  studentId: string;
  level: ChampionsLevel;
};

export async function assignStudentLevel(
  classId: string,
  studentId: string,
  rawLevel: string
): Promise<AssignStudentLevelResult> {
  const level = parseChampionsLevel(rawLevel);
  if (!level) {
    throw new AssignStudentLevelError(ASSIGN_STUDENT_LEVEL_GENERIC_ERROR);
  }

  const db = getDb();

  const [student] = await db
    .select({
      id: students.id,
      level: students.level,
    })
    .from(students)
    .where(
      and(
        eq(students.id, studentId),
        eq(students.classId, classId),
        eq(students.archived, false)
      )
    )
    .limit(1);

  if (!student) {
    throw new StudentNotFoundError();
  }

  if (student.level !== null) {
    throw new StudentAlreadyAssignedError();
  }

  const [updatedStudent] = await db
    .update(students)
    .set({ level })
    .where(
      and(
        eq(students.id, studentId),
        eq(students.classId, classId),
        isNull(students.level)
      )
    )
    .returning({ id: students.id });

  if (!updatedStudent) {
    throw new StudentAlreadyAssignedError();
  }

  await db.insert(levelHistoryEntries).values({
    studentId,
    level,
    action: "assigned",
  });

  return { studentId, level };
}
