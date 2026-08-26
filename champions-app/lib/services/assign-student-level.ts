import { and, eq, inArray, isNull, not, or } from "drizzle-orm";

import {
  ASSIGN_STUDENT_LEVEL_GENERIC_ERROR,
  CHAMPIONS_LEVELS,
  isChampionsLevel,
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

function canAssignLevel(currentLevel: string | null): boolean {
  return currentLevel === null || !isChampionsLevel(currentLevel);
}

function assignableLevelWhere() {
  return or(
    isNull(students.level),
    not(inArray(students.level, [...CHAMPIONS_LEVELS]))
  );
}

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

  if (!canAssignLevel(student.level)) {
    throw new StudentAlreadyAssignedError();
  }

  await db.transaction(async (tx) => {
    const [updatedStudent] = await tx
      .update(students)
      .set({ level })
      .where(
        and(
          eq(students.id, studentId),
          eq(students.classId, classId),
          eq(students.archived, false),
          assignableLevelWhere()
        )
      )
      .returning({ id: students.id });

    if (!updatedStudent) {
      const [stillExists] = await tx
        .select({ id: students.id, level: students.level })
        .from(students)
        .where(
          and(
            eq(students.id, studentId),
            eq(students.classId, classId),
            eq(students.archived, false)
          )
        )
        .limit(1);

      if (!stillExists) {
        throw new StudentNotFoundError();
      }

      throw new StudentAlreadyAssignedError();
    }

    await tx.insert(levelHistoryEntries).values({
      studentId,
      level,
      action: "assigned",
    });
  });

  return { studentId, level };
}
