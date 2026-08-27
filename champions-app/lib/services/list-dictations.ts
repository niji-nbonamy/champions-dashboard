import { and, asc, desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { dictations } from "@/lib/db/schema";

export type DictationRecord = {
  id: string;
  label: string;
  dictationLabelKey: string;
  dictationDate: string;
};

export async function listDictations(classId: string): Promise<DictationRecord[]> {
  const db = getDb();

  const rows = await db
    .select({
      id: dictations.id,
      label: dictations.label,
      dictationLabelKey: dictations.dictationLabelKey,
      dictationDate: dictations.dictationDate,
    })
    .from(dictations)
    .where(eq(dictations.classId, classId))
    .orderBy(desc(dictations.dictationDate), asc(dictations.label));

  return rows.map((row) => ({
    ...row,
    dictationDate: String(row.dictationDate),
  }));
}

export async function getDictationById(
  classId: string,
  dictationId: string
): Promise<DictationRecord | null> {
  const db = getDb();

  const [row] = await db
    .select({
      id: dictations.id,
      label: dictations.label,
      dictationLabelKey: dictations.dictationLabelKey,
      dictationDate: dictations.dictationDate,
    })
    .from(dictations)
    .where(and(eq(dictations.classId, classId), eq(dictations.id, dictationId)))
    .limit(1);

  if (!row) {
    return null;
  }

  return {
    ...row,
    dictationDate: String(row.dictationDate),
  };
}
