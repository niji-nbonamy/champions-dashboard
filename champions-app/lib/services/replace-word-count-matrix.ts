import { eq } from "drizzle-orm";

import {
  validateWordCountMatrix,
  type WordCountMatrixRowInput,
} from "@/lib/domain/word-count-matrix";
import { getDb } from "@/lib/db";
import { wordCountMatrixRows } from "@/lib/db/schema";

export class WordCountMatrixValidationError extends Error {
  rowIndex?: number;
  field?: string;

  constructor(
    message: string,
    options?: { rowIndex?: number; field?: string }
  ) {
    super(message);
    this.name = "WordCountMatrixValidationError";
    this.rowIndex = options?.rowIndex;
    this.field = options?.field;
  }
}

export async function replaceWordCountMatrix(
  classId: string,
  rawRows: WordCountMatrixRowInput[]
): Promise<void> {
  const validation = validateWordCountMatrix(rawRows);
  if (!validation.ok) {
    throw new WordCountMatrixValidationError(validation.error, {
      rowIndex: validation.rowIndex,
      field: validation.field,
    });
  }

  const db = getDb();

  await db.transaction(async (tx) => {
    await tx
      .delete(wordCountMatrixRows)
      .where(eq(wordCountMatrixRows.classId, classId));

    if (validation.rows.length === 0) {
      return;
    }

    await tx.insert(wordCountMatrixRows).values(
      validation.rows.map((row) => ({
        classId,
        dictationLabelKey: row.dictationLabelKey,
        wordsYellow: row.wordsYellow,
        wordsGreen: row.wordsGreen,
        wordsViolet: row.wordsViolet,
        wordsGold: row.wordsGold,
      }))
    );
  });
}
