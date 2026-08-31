import { and, asc, desc, eq, gt } from "drizzle-orm";

import { parseChampionsLevel } from "@/lib/domain/champions-level";
import { evaluatePendingPromotion } from "@/lib/domain/promotion";
import type { ChampionsLevel } from "@/lib/design/tokens";
import { getDb } from "@/lib/db";
import {
  dictationEntries,
  dictations,
  levelHistoryEntries,
  pendingPromotions,
} from "@/lib/db/schema";

type DbTransaction = Parameters<
  Parameters<ReturnType<typeof getDb>["transaction"]>[0]
>[0];

type RecentDictationSnapshot = {
  levelAtSave: string;
  globalPercent: number;
};

async function getLatestRefusalOccurredAt(
  tx: DbTransaction,
  studentId: string
): Promise<Date | null> {
  const [row] = await tx
    .select({ occurredAt: levelHistoryEntries.occurredAt })
    .from(levelHistoryEntries)
    .where(
      and(
        eq(levelHistoryEntries.studentId, studentId),
        eq(levelHistoryEntries.action, "refused")
      )
    )
    .orderBy(desc(levelHistoryEntries.occurredAt))
    .limit(1);

  return row?.occurredAt ?? null;
}

async function getRecentDictationSnapshotsForStudent(
  tx: DbTransaction,
  classId: string,
  studentId: string,
  refusalCutoff: Date | null
): Promise<RecentDictationSnapshot[]> {
  const conditions = [
    eq(dictations.classId, classId),
    eq(dictationEntries.studentId, studentId),
  ];

  if (refusalCutoff) {
    // FR31: only dictations saved strictly after the refusal count toward the streak.
    conditions.push(gt(dictationEntries.createdAt, refusalCutoff));
  }

  const recentEntries = await tx
    .select({
      levelAtSave: dictationEntries.levelAtSave,
      globalPercent: dictationEntries.globalPercent,
    })
    .from(dictationEntries)
    .innerJoin(dictations, eq(dictationEntries.dictationId, dictations.id))
    .where(and(...conditions))
    .orderBy(
      desc(dictations.dictationDate),
      desc(dictations.createdAt),
      asc(dictationEntries.createdAt)
    )
    .limit(2);

  return recentEntries;
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
  const refusalCutoff = await getLatestRefusalOccurredAt(tx, studentId);
  const recentEntries = await getRecentDictationSnapshotsForStudent(
    tx,
    classId,
    studentId,
    refusalCutoff
  );
  const recentPercents = recentEntries.map((entry) => entry.globalPercent);

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
  const refusalCutoff = await getLatestRefusalOccurredAt(tx, studentId);
  const recentEntries = await getRecentDictationSnapshotsForStudent(
    tx,
    classId,
    studentId,
    refusalCutoff
  );

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
