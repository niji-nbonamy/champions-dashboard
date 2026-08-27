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

export class CreateDictationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CreateDictationError";
  }
}

export type CreateDictationInput = {
  label: string;
  dictationDate?: string | null;
};

export type CreateDictationResult = {
  id: string;
  label: string;
  dictationDate: string;
};

export async function createDictation(
  classId: string,
  input: CreateDictationInput
): Promise<CreateDictationResult> {
  const labelResult = validateDictationLabel(input.label);
  if (!labelResult.ok) {
    throw new CreateDictationError(labelResult.error);
  }

  const dateResult = parseDictationDate(input.dictationDate);
  if (!dateResult.ok) {
    throw new CreateDictationError(dateResult.error);
  }

  const matrixRows = (await listWordCountMatrixRows(classId)).filter(
    isCompleteMatrixRow
  );
  const matchingRow = findMatchingMatrixRow(matrixRows, input.label);
  if (!matchingRow) {
    throw new CreateDictationError(DICTATION_MATRIX_ROW_MISSING_ERROR);
  }

  const db = getDb();
  const [inserted] = await db
    .insert(dictations)
    .values({
      classId,
      label: labelResult.value.label,
      dictationLabelKey: labelResult.value.dictationLabelKey,
      dictationDate: dateResult.date,
    })
    .returning({
      id: dictations.id,
      label: dictations.label,
      dictationDate: dictations.dictationDate,
    });

  if (!inserted) {
    throw new CreateDictationError("Création impossible. Réessayez.");
  }

  return {
    id: inserted.id,
    label: inserted.label,
    dictationDate: String(inserted.dictationDate),
  };
}
