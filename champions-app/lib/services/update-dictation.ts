import { and, eq } from "drizzle-orm";

import {
  DICTATION_MATRIX_ROW_MISSING_ERROR,
  findMatchingMatrixRow,
  parseDictationDate,
  validateDictationLabel,
} from "@/lib/domain/dictation";
import { isCompleteMatrixRow } from "@/lib/domain/word-count-matrix";
import { getDb } from "@/lib/db";
import { dictations } from "@/lib/db/schema";

import { listWordCountMatrixRows } from "./list-word-count-matrix-rows";

export const UPDATE_DICTATION_GENERIC_ERROR =
  "Modification impossible. Réessayez.";

export class UpdateDictationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UpdateDictationError";
  }
}

export type UpdateDictationInput = {
  label: string;
  dictationDate?: string | null;
};

export type UpdateDictationResult = {
  id: string;
  label: string;
  dictationDate: string;
};

export async function updateDictation(
  classId: string,
  dictationId: string,
  input: UpdateDictationInput
): Promise<UpdateDictationResult> {
  const labelResult = validateDictationLabel(input.label);
  if (!labelResult.ok) {
    throw new UpdateDictationError(labelResult.error);
  }

  const dateResult = parseDictationDate(input.dictationDate);
  if (!dateResult.ok) {
    throw new UpdateDictationError(dateResult.error);
  }

  const matrixRows = (await listWordCountMatrixRows(classId)).filter(
    isCompleteMatrixRow
  );
  const matchingRow = findMatchingMatrixRow(matrixRows, input.label);
  if (!matchingRow) {
    throw new UpdateDictationError(DICTATION_MATRIX_ROW_MISSING_ERROR);
  }

  const db = getDb();
  const [updated] = await db
    .update(dictations)
    .set({
      label: labelResult.value.label,
      dictationLabelKey: labelResult.value.dictationLabelKey,
      dictationDate: dateResult.date,
    })
    .where(and(eq(dictations.id, dictationId), eq(dictations.classId, classId)))
    .returning({
      id: dictations.id,
      label: dictations.label,
      dictationDate: dictations.dictationDate,
    });

  if (!updated) {
    throw new UpdateDictationError(UPDATE_DICTATION_GENERIC_ERROR);
  }

  return {
    id: updated.id,
    label: updated.label,
    dictationDate: String(updated.dictationDate),
  };
}
