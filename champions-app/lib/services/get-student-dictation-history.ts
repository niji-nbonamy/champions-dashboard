import { and, asc, desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { dictationEntries, dictations } from "@/lib/db/schema";
import {
  dbColumnsToCategoryErrors,
  type ChampionsErrorCategoryLetter,
} from "@/lib/domain/error-categories";

export type StudentDictationHistoryEntry = {
  entryId: string;
  dictationId: string;
  label: string;
  dictationDate: string;
  levelAtSave: string;
  globalPercent: number;
  wordDenominator: number;
  categoryErrors: Record<ChampionsErrorCategoryLetter, number>;
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
    .where(
      and(eq(dictations.classId, classId), eq(dictationEntries.studentId, studentId))
    )
    .orderBy(desc(dictations.dictationDate), asc(dictations.label));

  return rows.map((row) => {
    const {
      errorsC,
      errorsH,
      errorsA,
      errorsM,
      errorsP,
      errorsI,
      errorsO,
      errorsN,
      errorsS,
      ...entry
    } = row;

    return {
      ...entry,
      dictationDate: String(entry.dictationDate),
      categoryErrors: dbColumnsToCategoryErrors({
        errorsC,
        errorsH,
        errorsA,
        errorsM,
        errorsP,
        errorsI,
        errorsO,
        errorsN,
        errorsS,
      }),
    };
  });
}
