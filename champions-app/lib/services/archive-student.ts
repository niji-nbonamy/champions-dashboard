import { and, eq } from "drizzle-orm";

import { STUDENT_ARCHIVE_NOT_FOUND_ERROR } from "@/lib/domain/student-display-name";
import { getDb } from "@/lib/db";
import { students } from "@/lib/db/schema";

export class ArchiveStudentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ArchiveStudentError";
  }
}

export class StudentNotFoundError extends ArchiveStudentError {
  constructor() {
    super(STUDENT_ARCHIVE_NOT_FOUND_ERROR);
    this.name = "StudentNotFoundError";
  }
}

export type ArchiveStudentResult = {
  studentId: string;
};

export async function archiveStudent(
  classId: string,
  studentId: string
): Promise<ArchiveStudentResult> {
  const db = getDb();

  const [student] = await db
    .select({ id: students.id, archived: students.archived })
    .from(students)
    .where(and(eq(students.id, studentId), eq(students.classId, classId)))
    .limit(1);

  if (!student || student.archived) {
    throw new StudentNotFoundError();
  }

  const [updatedStudent] = await db
    .update(students)
    .set({ archived: true })
    .where(
      and(
        eq(students.id, studentId),
        eq(students.classId, classId),
        eq(students.archived, false)
      )
    )
    .returning({ id: students.id });

  if (!updatedStudent) {
    throw new StudentNotFoundError();
  }

  return { studentId: updatedStudent.id };
}
