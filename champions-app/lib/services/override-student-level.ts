import { and, eq } from "drizzle-orm";

import {
  isChampionsLevel,
  parseChampionsLevel,
} from "@/lib/domain/champions-level";
import type { ChampionsLevel } from "@/lib/design/tokens";
import { getDb } from "@/lib/db";
import {
  levelHistoryEntries,
  pendingPromotions,
  students,
} from "@/lib/db/schema";

export const OVERRIDE_STUDENT_LEVEL_GENERIC_ERROR =
  "Modification impossible. Réessayez.";

export class OverrideStudentLevelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OverrideStudentLevelError";
  }
}

export class StudentNotFoundForOverrideError extends OverrideStudentLevelError {
  constructor() {
    super("Élève introuvable.");
    this.name = "StudentNotFoundForOverrideError";
  }
}

export class StudentNotLeveledForOverrideError extends OverrideStudentLevelError {
  constructor() {
    super("Le niveau n'est pas encore assigné.");
    this.name = "StudentNotLeveledForOverrideError";
  }
}

export type OverrideStudentLevelResult = {
  studentId: string;
  level: ChampionsLevel;
  changed: boolean;
};

export async function overrideStudentLevel(
  classId: string,
  studentId: string,
  rawLevel: string
): Promise<OverrideStudentLevelResult> {
  const level = parseChampionsLevel(rawLevel);
  if (!level) {
    throw new OverrideStudentLevelError(OVERRIDE_STUDENT_LEVEL_GENERIC_ERROR);
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
    throw new StudentNotFoundForOverrideError();
  }

  if (!student.level || !isChampionsLevel(student.level)) {
    throw new StudentNotLeveledForOverrideError();
  }

  if (student.level === level) {
    return { studentId, level, changed: false };
  }

  await db.transaction(async (tx) => {
    const [updatedStudent] = await tx
      .update(students)
      .set({ level })
      .where(
        and(
          eq(students.id, studentId),
          eq(students.classId, classId),
          eq(students.archived, false)
        )
      )
      .returning({ id: students.id });

    if (!updatedStudent) {
      throw new StudentNotFoundForOverrideError();
    }

    await tx
      .delete(pendingPromotions)
      .where(eq(pendingPromotions.studentId, studentId));

    await tx.insert(levelHistoryEntries).values({
      studentId,
      level,
      action: "manual",
    });
  });

  return { studentId, level, changed: true };
}
