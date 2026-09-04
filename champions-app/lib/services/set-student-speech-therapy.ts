import { and, eq } from "drizzle-orm";

import { SET_STUDENT_SPEECH_THERAPY_GENERIC_ERROR } from "@/lib/domain/student-speech-therapy";
import { getDb } from "@/lib/db";
import { students } from "@/lib/db/schema";

export class SetStudentSpeechTherapyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SetStudentSpeechTherapyError";
  }
}

export class StudentNotFoundError extends SetStudentSpeechTherapyError {
  constructor() {
    super("Élève introuvable.");
    this.name = "StudentNotFoundError";
  }
}

export class StudentArchivedError extends SetStudentSpeechTherapyError {
  constructor() {
    super("Élève archivé : modification impossible.");
    this.name = "StudentArchivedError";
  }
}

export type SetStudentSpeechTherapyResult = {
  studentId: string;
  hasSpeechTherapy: boolean;
  changed: boolean;
};

export async function setStudentSpeechTherapy(
  classId: string,
  studentId: string,
  hasSpeechTherapy: boolean
): Promise<SetStudentSpeechTherapyResult> {
  const db = getDb();

  const [student] = await db
    .select({
      id: students.id,
      hasSpeechTherapy: students.hasSpeechTherapy,
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

  if (student.hasSpeechTherapy === hasSpeechTherapy) {
    return {
      studentId,
      hasSpeechTherapy,
      changed: false,
    };
  }

  const [updatedStudent] = await db
    .update(students)
    .set({ hasSpeechTherapy })
    .where(
      and(
        eq(students.id, studentId),
        eq(students.classId, classId),
        eq(students.archived, false)
      )
    )
    .returning({
      id: students.id,
      hasSpeechTherapy: students.hasSpeechTherapy,
    });

  if (!updatedStudent) {
    throw new SetStudentSpeechTherapyError(
      SET_STUDENT_SPEECH_THERAPY_GENERIC_ERROR
    );
  }

  return {
    studentId,
    hasSpeechTherapy: updatedStudent.hasSpeechTherapy,
    changed: true,
  };
}
