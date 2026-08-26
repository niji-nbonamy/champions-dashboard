import {
  formatStudentDuplicateError,
  normalizeDuplicateKey,
  validateDisplayName,
} from "@/lib/domain/student-display-name";
import { getDb } from "@/lib/db";
import { students } from "@/lib/db/schema";

import { listActiveStudents } from "./list-active-students";

export class AddStudentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AddStudentError";
  }
}

export class StudentDuplicateError extends AddStudentError {
  constructor(existingName: string) {
    super(formatStudentDuplicateError(existingName));
    this.name = "StudentDuplicateError";
  }
}

export type AddStudentResult = {
  displayName: string;
};

export async function addStudent(
  classId: string,
  rawDisplayName: string
): Promise<AddStudentResult> {
  const validated = validateDisplayName(rawDisplayName);
  if (!validated.ok) {
    throw new AddStudentError(validated.error);
  }

  const activeStudents = await listActiveStudents(classId);
  const duplicateKey = normalizeDuplicateKey(validated.displayName);
  const existingStudent = activeStudents.find(
    (student) => normalizeDuplicateKey(student.displayName) === duplicateKey
  );

  if (existingStudent) {
    throw new StudentDuplicateError(existingStudent.displayName);
  }

  const db = getDb();
  await db.insert(students).values({
    classId,
    displayName: validated.displayName,
    archived: false,
  });

  return { displayName: validated.displayName };
}
