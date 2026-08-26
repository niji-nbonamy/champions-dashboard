import { asc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { wordCountMatrixRows } from "@/lib/db/schema";

export type WordCountMatrixRowRecord = {
  dictationLabelKey: string;
  wordsYellow: number;
  wordsGreen: number;
  wordsViolet: number;
  wordsGold: number;
};

export async function listWordCountMatrixRows(
  classId: string
): Promise<WordCountMatrixRowRecord[]> {
  const db = getDb();

  const rows = await db
    .select({
      dictationLabelKey: wordCountMatrixRows.dictationLabelKey,
      wordsYellow: wordCountMatrixRows.wordsYellow,
      wordsGreen: wordCountMatrixRows.wordsGreen,
      wordsViolet: wordCountMatrixRows.wordsViolet,
      wordsGold: wordCountMatrixRows.wordsGold,
    })
    .from(wordCountMatrixRows)
    .where(eq(wordCountMatrixRows.classId, classId))
    .orderBy(asc(wordCountMatrixRows.dictationLabelKey));

  return rows;
}
