import { and, asc, desc, eq, inArray } from "drizzle-orm";

import { parseChampionsLevel } from "@/lib/domain/champions-level";
import {
  categoryErrorsToDbColumns,
} from "@/lib/domain/error-categories";
import type { ChampionsErrorCategoryLetter } from "@/lib/domain/error-categories";
import { findMatchingMatrixRow } from "@/lib/domain/dictation";
import {
  sumCategoryErrors,
  validateGridRow,
  type CategoryErrorCounts,
} from "@/lib/domain/grid-validation";
import { evaluatePendingPromotion } from "@/lib/domain/promotion";
import { reevaluatePendingPromotionFromDictationHistory } from "@/lib/services/reevaluate-pending-promotion";
import { calculateGlobalPercent } from "@/lib/domain/scoring";
import {
  getWordCountForLevel,
  isCompleteMatrixRow,
} from "@/lib/domain/word-count-matrix";
import type { ChampionsLevel } from "@/lib/design/tokens";
import { getDb } from "@/lib/db";
import {
  dictationEntries,
  dictations,
  pendingPromotions,
} from "@/lib/db/schema";

import {
  DICTATION_SAVE_GENERIC_ERROR,
  DICTATION_SAVE_SUCCESS_MESSAGE,
} from "@/lib/domain/dictation-save-messages";

import { getDictationEntriesByDictationId } from "./get-dictation-entries";
import { listLeveledActiveStudents } from "./list-leveled-active-students";
import { getDictationById } from "./list-dictations";
import { listWordCountMatrixRows } from "./list-word-count-matrix-rows";

export { DICTATION_SAVE_GENERIC_ERROR, DICTATION_SAVE_SUCCESS_MESSAGE };

export class DictationSaveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DictationSaveError";
  }
}

export class DictationNotFoundError extends DictationSaveError {
  constructor() {
    super(DICTATION_SAVE_GENERIC_ERROR);
    this.name = "DictationNotFoundError";
  }
}

export class DictationAlreadySavedError extends DictationSaveError {
  constructor() {
    super(DICTATION_SAVE_GENERIC_ERROR);
    this.name = "DictationAlreadySavedError";
  }
}

export class InvalidGridSaveError extends DictationSaveError {
  constructor() {
    super(DICTATION_SAVE_GENERIC_ERROR);
    this.name = "InvalidGridSaveError";
  }
}

export type GridCountsInput = Record<
  string,
  Record<ChampionsErrorCategoryLetter, number>
>;

export type PreparedDictationEntry = {
  studentId: string;
  levelAtSave: ChampionsLevel;
  wordDenominator: number;
  globalPercent: number;
  errorColumns: ReturnType<typeof categoryErrorsToDbColumns>;
};

export type ExistingEntrySnapshot = {
  studentId: string;
  levelAtSave: ChampionsLevel;
  wordDenominator: number;
};

export type SaveDictationResult = {
  dictationId: string;
  entryCount: number;
};

function normalizeCategoryCounts(
  counts: Record<ChampionsErrorCategoryLetter, number> | undefined
): CategoryErrorCounts {
  return {
    C: counts?.C ?? 0,
    H: counts?.H ?? 0,
    A: counts?.A ?? 0,
    M: counts?.M ?? 0,
    P: counts?.P ?? 0,
    I: counts?.I ?? 0,
    O: counts?.O ?? 0,
    N: counts?.N ?? 0,
    S: counts?.S ?? 0,
  };
}

export function assertCountsMatchRoster(
  students: Array<{ id: string }>,
  countsByStudentId: GridCountsInput
): void {
  const rosterIds = new Set(students.map((student) => student.id));

  for (const student of students) {
    if (countsByStudentId[student.id] === undefined) {
      throw new InvalidGridSaveError();
    }
  }

  for (const studentId of Object.keys(countsByStudentId)) {
    if (!rosterIds.has(studentId)) {
      throw new InvalidGridSaveError();
    }
  }
}

export function prepareDictationEntries(
  students: Array<{ id: string; level: string }>,
  countsByStudentId: GridCountsInput,
  matrixRow: {
    wordsYellow: number;
    wordsGreen: number;
    wordsViolet: number;
    wordsGold: number;
  }
): PreparedDictationEntry[] {
  const prepared: PreparedDictationEntry[] = [];

  for (const student of students) {
    const level = parseChampionsLevel(student.level);
    if (!level) {
      throw new InvalidGridSaveError();
    }

    const studentCounts = normalizeCategoryCounts(countsByStudentId[student.id]);
    const wordDenominator = getWordCountForLevel(matrixRow, level);
    const validation = validateGridRow(studentCounts, wordDenominator);

    if (!validation.valid) {
      throw new InvalidGridSaveError();
    }

    const globalPercent = calculateGlobalPercent(
      wordDenominator,
      sumCategoryErrors(studentCounts)
    );

    prepared.push({
      studentId: student.id,
      levelAtSave: level,
      wordDenominator,
      globalPercent,
      errorColumns: categoryErrorsToDbColumns(studentCounts),
    });
  }

  return prepared;
}

export function prepareDictationEntryUpdates(
  existingSnapshots: ExistingEntrySnapshot[],
  countsByStudentId: GridCountsInput
): PreparedDictationEntry[] {
  const prepared: PreparedDictationEntry[] = [];

  for (const snapshot of existingSnapshots) {
    const studentCounts = normalizeCategoryCounts(
      countsByStudentId[snapshot.studentId]
    );
    const validation = validateGridRow(
      studentCounts,
      snapshot.wordDenominator
    );

    if (!validation.valid) {
      throw new InvalidGridSaveError();
    }

    const globalPercent = calculateGlobalPercent(
      snapshot.wordDenominator,
      sumCategoryErrors(studentCounts)
    );

    prepared.push({
      studentId: snapshot.studentId,
      levelAtSave: snapshot.levelAtSave,
      wordDenominator: snapshot.wordDenominator,
      globalPercent,
      errorColumns: categoryErrorsToDbColumns(studentCounts),
    });
  }

  return prepared;
}

type DbTransaction = Parameters<
  Parameters<ReturnType<typeof getDb>["transaction"]>[0]
>[0];

async function cascadePromotionReevaluation(
  tx: DbTransaction,
  classId: string,
  studentIds: string[]
): Promise<void> {
  for (const studentId of studentIds) {
    await reevaluatePendingPromotionFromDictationHistory(
      tx,
      classId,
      studentId
    );
  }
}

export async function saveDictation(
  classId: string,
  dictationId: string,
  countsByStudentId: GridCountsInput
): Promise<SaveDictationResult> {
  const dictation = await getDictationById(classId, dictationId);
  if (!dictation) {
    throw new DictationNotFoundError();
  }

  const db = getDb();
  const existingEntries = await getDictationEntriesByDictationId(
    classId,
    dictationId
  );

  if (existingEntries.length > 0) {
    const editableSnapshots: ExistingEntrySnapshot[] = [];

    for (const entry of existingEntries) {
      if (entry.archived) {
        continue;
      }

      const levelAtSave = parseChampionsLevel(entry.levelAtSave);
      if (!levelAtSave) {
        throw new InvalidGridSaveError();
      }

      editableSnapshots.push({
        studentId: entry.studentId,
        levelAtSave,
        wordDenominator: entry.wordDenominator,
      });
    }

    assertCountsMatchRoster(
      editableSnapshots.map((snapshot) => ({ id: snapshot.studentId })),
      countsByStudentId
    );

    if (editableSnapshots.length === 0) {
      throw new InvalidGridSaveError();
    }

    const preparedUpdates = prepareDictationEntryUpdates(
      editableSnapshots,
      countsByStudentId
    );
    const affectedStudentIds = existingEntries
      .filter((entry) => !entry.archived)
      .map((entry) => entry.studentId);

    await db.transaction(async (tx) => {
      for (const entry of preparedUpdates) {
        const updatedRows = await tx
          .update(dictationEntries)
          .set({
            globalPercent: entry.globalPercent,
            ...entry.errorColumns,
          })
          .where(
            and(
              eq(dictationEntries.dictationId, dictationId),
              eq(dictationEntries.studentId, entry.studentId)
            )
          )
          .returning({ id: dictationEntries.id });

        if (updatedRows.length === 0) {
          throw new InvalidGridSaveError();
        }
      }

      await cascadePromotionReevaluation(tx, classId, affectedStudentIds);
    });

    return {
      dictationId,
      entryCount: preparedUpdates.length,
    };
  }

  const students = await listLeveledActiveStudents(classId);
  if (students.length === 0) {
    throw new InvalidGridSaveError();
  }

  const matrixRows = (await listWordCountMatrixRows(classId)).filter(
    isCompleteMatrixRow
  );
  const matchingMatrixRow = findMatchingMatrixRow(
    matrixRows,
    dictation.dictationLabelKey
  );

  if (!matchingMatrixRow) {
    throw new InvalidGridSaveError();
  }

  assertCountsMatchRoster(students, countsByStudentId);

  const preparedEntries = prepareDictationEntries(
    students,
    countsByStudentId,
    matchingMatrixRow
  );

  const studentIds = students.map((student) => student.id);

  const existingPendingRows =
    studentIds.length > 0
      ? await db
          .select({
            studentId: pendingPromotions.studentId,
          })
          .from(pendingPromotions)
          .where(inArray(pendingPromotions.studentId, studentIds))
      : [];

  const studentsWithPendingPromotion = new Set(
    existingPendingRows.map((row) => row.studentId)
  );

  const recentPercentsByStudentId = new Map<string, number[]>();

  if (studentIds.length > 0) {
    const priorEntries = await db
      .select({
        studentId: dictationEntries.studentId,
        globalPercent: dictationEntries.globalPercent,
        dictationDate: dictations.dictationDate,
        createdAt: dictations.createdAt,
      })
      .from(dictationEntries)
      .innerJoin(dictations, eq(dictationEntries.dictationId, dictations.id))
      .where(
        and(
          eq(dictations.classId, classId),
          inArray(dictationEntries.studentId, studentIds)
        )
      )
      .orderBy(
        desc(dictations.dictationDate),
        desc(dictations.createdAt),
        asc(dictationEntries.createdAt)
      );

    for (const row of priorEntries) {
      const existing = recentPercentsByStudentId.get(row.studentId) ?? [];
      if (existing.length < 1) {
        existing.push(row.globalPercent);
        recentPercentsByStudentId.set(row.studentId, existing);
      }
    }
  }

  await db.transaction(async (tx) => {
    const [existingEntry] = await tx
      .select({ id: dictationEntries.id })
      .from(dictationEntries)
      .where(eq(dictationEntries.dictationId, dictationId))
      .limit(1);

    if (existingEntry) {
      throw new DictationAlreadySavedError();
    }

    for (const entry of preparedEntries) {
      await tx.insert(dictationEntries).values({
        dictationId,
        studentId: entry.studentId,
        levelAtSave: entry.levelAtSave,
        wordDenominator: entry.wordDenominator,
        globalPercent: entry.globalPercent,
        ...entry.errorColumns,
      });

      const recentPercents = [
        entry.globalPercent,
        ...(recentPercentsByStudentId.get(entry.studentId) ?? []),
      ];

      const promotion = evaluatePendingPromotion(
        entry.levelAtSave,
        recentPercents
      );

      if (
        promotion.eligible &&
        promotion.targetLevel &&
        !studentsWithPendingPromotion.has(entry.studentId)
      ) {
        await tx
          .insert(pendingPromotions)
          .values({
            studentId: entry.studentId,
            targetLevel: promotion.targetLevel,
          })
          .onConflictDoNothing({ target: pendingPromotions.studentId });
        studentsWithPendingPromotion.add(entry.studentId);
      }
    }
  });

  return {
    dictationId,
    entryCount: preparedEntries.length,
  };
}
