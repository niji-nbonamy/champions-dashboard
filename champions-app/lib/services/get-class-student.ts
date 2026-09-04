import { and, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { students } from "@/lib/db/schema";

export type ClassStudentRecord = {
  id: string;
  displayName: string;
  level: string | null;
  hasSpeechTherapy: boolean;
  archived: boolean;
};

export async function getClassStudent(
  classId: string,
  studentId: string
): Promise<ClassStudentRecord | null> {
  const db = getDb();

  const [student] = await db
    .select({
      id: students.id,
      displayName: students.displayName,
      level: students.level,
      hasSpeechTherapy: students.hasSpeechTherapy,
      archived: students.archived,
    })
    .from(students)
    .where(and(eq(students.id, studentId), eq(students.classId, classId)))
    .limit(1);

  if (!student) {
    return null;
  }

  return student;
}
