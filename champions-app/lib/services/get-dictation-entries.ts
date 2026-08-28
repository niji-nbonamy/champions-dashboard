import { and, asc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { dictationEntries, dictations, students } from "@/lib/db/schema";

export type DictationEntryWithStudent = {
  studentId: string;
  displayName: string;
  archived: boolean;
  levelAtSave: string;
  wordDenominator: number;
  globalPercent: number;
  errorsC: number;
  errorsH: number;
  errorsA: number;
  errorsM: number;
  errorsP: number;
  errorsI: number;
  errorsO: number;
  errorsN: number;
  errorsS: number;
};

export async function getDictationEntriesByDictationId(
  classId: string,
  dictationId: string
): Promise<DictationEntryWithStudent[]> {
  const db = getDb();

  return db
    .select({
      studentId: dictationEntries.studentId,
      displayName: students.displayName,
      archived: students.archived,
      levelAtSave: dictationEntries.levelAtSave,
      wordDenominator: dictationEntries.wordDenominator,
      globalPercent: dictationEntries.globalPercent,
      errorsC: dictationEntries.errorsC,
      errorsH: dictationEntries.errorsH,
      errorsA: dictationEntries.errorsA,
      errorsM: dictationEntries.errorsM,
      errorsP: dictationEntries.errorsP,
      errorsI: dictationEntries.errorsI,
      errorsO: dictationEntries.errorsO,
      errorsN: dictationEntries.errorsN,
      errorsS: dictationEntries.errorsS,
    })
    .from(dictationEntries)
    .innerJoin(dictations, eq(dictationEntries.dictationId, dictations.id))
    .innerJoin(students, eq(dictationEntries.studentId, students.id))
    .where(
      and(eq(dictations.classId, classId), eq(dictations.id, dictationId))
    )
    .orderBy(asc(students.displayName));
}
