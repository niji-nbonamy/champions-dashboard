import { and, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { classes, levelHistoryEntries, students } from "@/lib/db/schema";

export class RemoveActiveStudentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RemoveActiveStudentError";
  }
}

export class StudentNotFoundError extends RemoveActiveStudentError {
  constructor() {
    super("Élève introuvable.");
    this.name = "StudentNotFoundError";
  }
}

export class StudentRemovalBlockedError extends RemoveActiveStudentError {
  constructor(message: string) {
    super(message);
    this.name = "StudentRemovalBlockedError";
  }
}

export type RemoveActiveStudentResult = {
  studentId: string;
};

export async function removeActiveStudent(
  classId: string,
  studentId: string
): Promise<RemoveActiveStudentResult> {
  const db = getDb();

  const [classRow] = await db
    .select({
      yearStartWizardCompletedAt: classes.yearStartWizardCompletedAt,
    })
    .from(classes)
    .where(eq(classes.id, classId))
    .limit(1);

  if (!classRow) {
    throw new StudentNotFoundError();
  }

  if (classRow.yearStartWizardCompletedAt != null) {
    throw new StudentRemovalBlockedError(
      "La liste d'élèves ne peut plus être modifiée depuis cet assistant."
    );
  }

  const [student] = await db
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

  if (!student) {
    throw new StudentNotFoundError();
  }

  if (student.level != null) {
    throw new StudentRemovalBlockedError(
      "Cet élève ne peut pas être retiré car un niveau a déjà été assigné."
    );
  }

  const [historyEntry] = await db
    .select({ id: levelHistoryEntries.id })
    .from(levelHistoryEntries)
    .where(eq(levelHistoryEntries.studentId, studentId))
    .limit(1);

  if (historyEntry) {
    throw new StudentRemovalBlockedError(
      "Cet élève ne peut pas être retiré car un niveau a déjà été assigné."
    );
  }

  const [deletedStudent] = await db
    .delete(students)
    .where(
      and(
        eq(students.id, studentId),
        eq(students.classId, classId),
        eq(students.archived, false)
      )
    )
    .returning({ id: students.id });

  if (!deletedStudent) {
    throw new StudentNotFoundError();
  }

  return { studentId: deletedStudent.id };
}
