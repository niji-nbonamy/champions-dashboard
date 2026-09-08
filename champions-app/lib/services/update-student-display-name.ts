import { and, eq } from "drizzle-orm";

import {
  formatStudentDuplicateError,
  normalizeDuplicateKey,
  STUDENT_DISPLAY_NAME_UPDATE_GENERIC_ERROR,
  validateDisplayName,
} from "@/lib/domain/student-display-name";
import { getDb } from "@/lib/db";
import { students } from "@/lib/db/schema";

import { listActiveStudents } from "./list-active-students";

export class UpdateStudentDisplayNameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UpdateStudentDisplayNameError";
  }
}

export class StudentNotFoundError extends UpdateStudentDisplayNameError {
  constructor() {
    super("Élève introuvable.");
    this.name = "StudentNotFoundError";
  }
}

export class StudentArchivedError extends UpdateStudentDisplayNameError {
  constructor() {
    super("Élève archivé : modification impossible.");
    this.name = "StudentArchivedError";
  }
}

export class StudentDuplicateError extends UpdateStudentDisplayNameError {
  constructor(existingName: string) {
    super(formatStudentDuplicateError(existingName));
    this.name = "StudentDuplicateError";
  }
}

export type UpdateStudentDisplayNameResult = {
  studentId: string;
  displayName: string;
  changed: boolean;
};

export async function updateStudentDisplayName(
  classId: string,
  studentId: string,
  rawDisplayName: string
): Promise<UpdateStudentDisplayNameResult> {
  const validated = validateDisplayName(rawDisplayName);
  if (!validated.ok) {
    throw new UpdateStudentDisplayNameError(validated.error);
  }

  const db = getDb();

  const [student] = await db
    .select({
      id: students.id,
      displayName: students.displayName,
      archived: students.archived,
    })
    .from(students)
    .where(and(eq(students.id, studentId), eq(students.classId, classId)))
    .limit(1);

  if (!student) {
    throw new StudentNotFoundError();
  }

  if (student.archived) {
    throw new StudentArchivedError();
  }

  if (student.displayName === validated.displayName) {
    return {
      studentId,
      displayName: validated.displayName,
      changed: false,
    };
  }

  const duplicateKey = normalizeDuplicateKey(validated.displayName);
  const activeStudents = await listActiveStudents(classId);
  const existingStudent = activeStudents.find(
    (activeStudent) =>
      activeStudent.id !== studentId &&
      normalizeDuplicateKey(activeStudent.displayName) === duplicateKey
  );

  if (existingStudent) {
    throw new StudentDuplicateError(existingStudent.displayName);
  }

  const [updatedStudent] = await db
    .update(students)
    .set({ displayName: validated.displayName })
    .where(
      and(
        eq(students.id, studentId),
        eq(students.classId, classId),
        eq(students.archived, false)
      )
    )
    .returning({
      id: students.id,
      displayName: students.displayName,
    });

  if (!updatedStudent) {
    throw new UpdateStudentDisplayNameError(
      STUDENT_DISPLAY_NAME_UPDATE_GENERIC_ERROR
    );
  }

  return {
    studentId,
    displayName: updatedStudent.displayName,
    changed: true,
  };
}
