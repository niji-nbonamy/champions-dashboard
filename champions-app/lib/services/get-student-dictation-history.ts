import { and, asc, desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { dictationEntries, dictations } from "@/lib/db/schema";

export type StudentDictationHistoryEntry = {
  entryId: string;
  dictationId: string;
  label: string;
  dictationDate: string;
  levelAtSave: string;
  globalPercent: number;
  wordDenominator: number;
};

export async function getStudentDictationHistory(
  classId: string,
  studentId: string
): Promise<StudentDictationHistoryEntry[]> {
  const db = getDb();

  const rows = await db
    .select({
      entryId: dictationEntries.id,
      dictationId: dictations.id,
      label: dictations.label,
      dictationDate: dictations.dictationDate,
      levelAtSave: dictationEntries.levelAtSave,
      globalPercent: dictationEntries.globalPercent,
      wordDenominator: dictationEntries.wordDenominator,
    })
    .from(dictationEntries)
    .innerJoin(dictations, eq(dictationEntries.dictationId, dictations.id))
    .where(
      and(eq(dictations.classId, classId), eq(dictationEntries.studentId, studentId))
    )
    .orderBy(desc(dictations.dictationDate), asc(dictations.label));

  return rows.map((row) => ({
    ...row,
    dictationDate: String(row.dictationDate),
  }));
}
