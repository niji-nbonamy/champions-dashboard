export const DICTATION_LABEL_MAX_LENGTH = 80;
export const WORD_COUNT_MATRIX_MAX_ROWS = 20;
export const WORD_COUNT_MATRIX_MAX_WORD_COUNT = 2147483647;

export const DICTATION_LABEL_REQUIRED_ERROR =
  "Le label de dictée est requis.";

export const DICTATION_LABEL_TOO_LONG_ERROR =
  "Label de dictée trop long (max 80 caractères).";

export const WORD_COUNT_CELL_INVALID_ERROR =
  "Chaque cellule doit être un entier supérieur à 0.";

export const WORD_COUNT_MATRIX_TOO_MANY_ROWS_ERROR =
  "Maximum 20 dictées dans la matrice.";

export const WORD_COUNT_MATRIX_SAVE_SUCCESS_MESSAGE =
  "Matrice enregistrée.";

export const WORD_COUNT_MATRIX_GENERIC_ERROR =
  "Enregistrement impossible. Réessayez.";

export type WordCountMatrixRowInput = {
  label: string;
  wordsYellow: string;
  wordsGreen: string;
  wordsViolet: string;
  wordsGold: string;
};

export type ValidatedWordCountMatrixRow = {
  dictationLabelKey: string;
  wordsYellow: number;
  wordsGreen: number;
  wordsViolet: number;
  wordsGold: number;
};

export type ValidateWordCountMatrixSuccess = {
  ok: true;
  rows: ValidatedWordCountMatrixRow[];
};

export type ValidateWordCountMatrixFailure = {
  ok: false;
  error: string;
};

export type ValidateWordCountMatrixResult =
  | ValidateWordCountMatrixSuccess
  | ValidateWordCountMatrixFailure;

export function normalizeDictationLabel(label: string): string {
  return label.trim();
}

export function normalizeDictationLabelKey(label: string): string {
  return normalizeDictationLabel(label).toLowerCase();
}

export function formatDuplicateDictationLabelsError(labels: string[]): string {
  return `Labels de dictée en double : ${labels.join(", ")}.`;
}

export function parseWordCountCell(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  if (parsed <= 0 || parsed > WORD_COUNT_MATRIX_MAX_WORD_COUNT) {
    return null;
  }

  if (!Number.isSafeInteger(parsed)) {
    return null;
  }

  return parsed;
}

export function validateWordCountMatrixRow(
  rawRow: WordCountMatrixRowInput
): ValidateWordCountMatrixResult {
  const dictationLabelKey = normalizeDictationLabel(rawRow.label);

  if (!dictationLabelKey) {
    return { ok: false, error: DICTATION_LABEL_REQUIRED_ERROR };
  }

  if (dictationLabelKey.length > DICTATION_LABEL_MAX_LENGTH) {
    return { ok: false, error: DICTATION_LABEL_TOO_LONG_ERROR };
  }

  const wordsYellow = parseWordCountCell(rawRow.wordsYellow);
  const wordsGreen = parseWordCountCell(rawRow.wordsGreen);
  const wordsViolet = parseWordCountCell(rawRow.wordsViolet);
  const wordsGold = parseWordCountCell(rawRow.wordsGold);

  if (
    wordsYellow === null ||
    wordsGreen === null ||
    wordsViolet === null ||
    wordsGold === null
  ) {
    return { ok: false, error: WORD_COUNT_CELL_INVALID_ERROR };
  }

  return {
    ok: true,
    rows: [
      {
        dictationLabelKey,
        wordsYellow,
        wordsGreen,
        wordsViolet,
        wordsGold,
      },
    ],
  };
}

export function validateWordCountMatrix(
  rawRows: WordCountMatrixRowInput[]
): ValidateWordCountMatrixResult {
  if (rawRows.length > WORD_COUNT_MATRIX_MAX_ROWS) {
    return { ok: false, error: WORD_COUNT_MATRIX_TOO_MANY_ROWS_ERROR };
  }

  const validatedRows: ValidatedWordCountMatrixRow[] = [];
  const seenKeys = new Map<string, string>();

  for (const rawRow of rawRows) {
    const rowResult = validateWordCountMatrixRow(rawRow);
    if (!rowResult.ok) {
      return rowResult;
    }

    const validatedRow = rowResult.rows[0];
    const duplicateKey = normalizeDictationLabelKey(validatedRow.dictationLabelKey);

    if (seenKeys.has(duplicateKey)) {
      const labels = [
        seenKeys.get(duplicateKey)!,
        validatedRow.dictationLabelKey,
      ];
      return {
        ok: false,
        error: formatDuplicateDictationLabelsError(labels),
      };
    }

    seenKeys.set(duplicateKey, validatedRow.dictationLabelKey);
    validatedRows.push(validatedRow);
  }

  return { ok: true, rows: validatedRows };
}

export function parseWordCountMatrixRowsFromFormData(
  formData: FormData
): WordCountMatrixRowInput[] {
  const rows: WordCountMatrixRowInput[] = [];
  let index = 0;

  while (formData.has(`rows[${index}].label`)) {
    rows.push({
      label: String(formData.get(`rows[${index}].label`) ?? ""),
      wordsYellow: String(formData.get(`rows[${index}].words_yellow`) ?? ""),
      wordsGreen: String(formData.get(`rows[${index}].words_green`) ?? ""),
      wordsViolet: String(formData.get(`rows[${index}].words_violet`) ?? ""),
      wordsGold: String(formData.get(`rows[${index}].words_gold`) ?? ""),
    });
    index += 1;
  }

  return rows;
}
