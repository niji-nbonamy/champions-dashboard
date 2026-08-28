import { and, asc, desc, eq } from "drizzle-orm";

import { parseChampionsLevel } from "@/lib/domain/champions-level";
import { evaluatePendingPromotion } from "@/lib/domain/promotion";
import type { ChampionsLevel } from "@/lib/design/tokens";
import { getDb } from "@/lib/db";
import {
  dictationEntries,
  dictations,
  pendingPromotions,
} from "@/lib/db/schema";

type DbTransaction = Parameters<
  Parameters<ReturnType<typeof getDb>["transaction"]>[0]
>[0];

async function getRecentDictationPercentsForStudent(
  tx: DbTransaction,
  classId: string,
  studentId: string
): Promise<number[]> {
  const recentEntries = await tx
    .select({
      globalPercent: dictationEntries.globalPercent,
    })
    .from(dictationEntries)
    .innerJoin(dictations, eq(dictationEntries.dictationId, dictations.id))
    .where(
      and(
        eq(dictations.classId, classId),
        eq(dictationEntries.studentId, studentId)
      )
    )
    .orderBy(
      desc(dictations.dictationDate),
      desc(dictations.createdAt),
      asc(dictationEntries.createdAt)
    )
    .limit(2);

  return recentEntries.map((entry) => entry.globalPercent);
}

async function upsertPendingPromotionFromEvaluation(
  tx: DbTransaction,
  studentId: string,
  evaluationLevel: ChampionsLevel,
  recentPercents: number[]
): Promise<void> {
  await tx
    .delete(pendingPromotions)
    .where(eq(pendingPromotions.studentId, studentId));

  if (recentPercents.length < 2) {
    return;
  }

  const promotion = evaluatePendingPromotion(evaluationLevel, recentPercents);

  if (promotion.eligible && promotion.targetLevel) {
    await tx
      .insert(pendingPromotions)
      .values({
        studentId,
        targetLevel: promotion.targetLevel,
      })
      .onConflictDoNothing({ target: pendingPromotions.studentId });
  }
}

export async function reevaluatePendingPromotionForCurrentLevel(
  tx: DbTransaction,
  classId: string,
  studentId: string,
  evaluationLevel: ChampionsLevel
): Promise<void> {
  const recentPercents = await getRecentDictationPercentsForStudent(
    tx,
    classId,
    studentId
  );

  await upsertPendingPromotionFromEvaluation(
    tx,
    studentId,
    evaluationLevel,
    recentPercents
  );
}

export async function reevaluatePendingPromotionFromDictationHistory(
  tx: DbTransaction,
  classId: string,
  studentId: string
): Promise<void> {
  const recentEntries = await tx
    .select({
      levelAtSave: dictationEntries.levelAtSave,
      globalPercent: dictationEntries.globalPercent,
    })
    .from(dictationEntries)
    .innerJoin(dictations, eq(dictationEntries.dictationId, dictations.id))
    .where(
      and(
        eq(dictations.classId, classId),
        eq(dictationEntries.studentId, studentId)
      )
    )
    .orderBy(
      desc(dictations.dictationDate),
      desc(dictations.createdAt),
      asc(dictationEntries.createdAt)
    )
    .limit(2);

  if (recentEntries.length < 2) {
    await tx
      .delete(pendingPromotions)
      .where(eq(pendingPromotions.studentId, studentId));
    return;
  }

  const mostRecentLevel = parseChampionsLevel(recentEntries[0].levelAtSave);
  if (!mostRecentLevel) {
    await tx
      .delete(pendingPromotions)
      .where(eq(pendingPromotions.studentId, studentId));
    return;
  }

  const recentPercents = recentEntries.map((entry) => entry.globalPercent);

  await upsertPendingPromotionFromEvaluation(
    tx,
    studentId,
    mostRecentLevel,
    recentPercents
  );
}
