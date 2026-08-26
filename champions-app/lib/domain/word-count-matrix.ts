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

export type WordCountMatrixFieldName =
  | "label"
  | "wordsYellow"
  | "wordsGreen"
  | "wordsViolet"
  | "wordsGold"
  | "duplicate";

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
  rowIndex?: number;
  field?: WordCountMatrixFieldName;
};

export type ValidateWordCountMatrixResult =
  | ValidateWordCountMatrixSuccess
  | ValidateWordCountMatrixFailure;

const ROW_LABEL_KEY_PATTERN = /^rows\[(\d+)\]\.label$/;

export function normalizeDictationLabel(label: string): string {
  return label.trim();
}

export function normalizeDictationLabelKey(label: string): string {
  return normalizeDictationLabel(label).toLowerCase();
}

export function formatWordCountMatrixRowError(
  rowNumber: number,
  label: string,
  message: string
): string {
  const trimmed = label.trim();
  const rowRef = trimmed ? `« ${trimmed} »` : `Ligne ${rowNumber}`;
  return `${rowRef} : ${message}`;
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
  rawRow: WordCountMatrixRowInput,
  rowNumber = 1
): ValidateWordCountMatrixResult {
  const dictationLabelKey = normalizeDictationLabel(rawRow.label);

  if (!dictationLabelKey) {
    return {
      ok: false,
      error: formatWordCountMatrixRowError(
        rowNumber,
        rawRow.label,
        DICTATION_LABEL_REQUIRED_ERROR
      ),
      rowIndex: rowNumber - 1,
      field: "label",
    };
  }

  if (dictationLabelKey.length > DICTATION_LABEL_MAX_LENGTH) {
    return {
      ok: false,
      error: formatWordCountMatrixRowError(
        rowNumber,
        rawRow.label,
        DICTATION_LABEL_TOO_LONG_ERROR
      ),
      rowIndex: rowNumber - 1,
      field: "label",
    };
  }

  const cellFields: Array<{
    field: WordCountMatrixFieldName;
    value: string;
  }> = [
    { field: "wordsYellow", value: rawRow.wordsYellow },
    { field: "wordsGreen", value: rawRow.wordsGreen },
    { field: "wordsViolet", value: rawRow.wordsViolet },
    { field: "wordsGold", value: rawRow.wordsGold },
  ];

  const parsedCells: ValidatedWordCountMatrixRow = {
    dictationLabelKey,
    wordsYellow: 0,
    wordsGreen: 0,
    wordsViolet: 0,
    wordsGold: 0,
  };

  for (const { field, value } of cellFields) {
    const parsed = parseWordCountCell(value);
    if (parsed === null) {
      return {
        ok: false,
        error: formatWordCountMatrixRowError(
          rowNumber,
          rawRow.label,
          WORD_COUNT_CELL_INVALID_ERROR
        ),
        rowIndex: rowNumber - 1,
        field,
      };
    }
    parsedCells[field] = parsed;
  }

  return {
    ok: true,
    rows: [parsedCells],
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

  for (const [index, rawRow] of rawRows.entries()) {
    const rowResult = validateWordCountMatrixRow(rawRow, index + 1);
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
        field: "duplicate",
      };
    }

    seenKeys.set(duplicateKey, validatedRow.dictationLabelKey);
    validatedRows.push(validatedRow);
  }

  return { ok: true, rows: validatedRows };
}

export function extractWordCountMatrixRowIndices(formData: FormData): number[] {
  const indices = new Set<number>();

  for (const key of formData.keys()) {
    const match = ROW_LABEL_KEY_PATTERN.exec(key);
    if (match) {
      indices.add(Number.parseInt(match[1], 10));
    }
  }

  return [...indices].sort((a, b) => a - b);
}

export function parseWordCountMatrixRowsFromFormData(
  formData: FormData
): WordCountMatrixRowInput[] {
  return extractWordCountMatrixRowIndices(formData).map((index) => ({
    label: String(formData.get(`rows[${index}].label`) ?? ""),
    wordsYellow: String(formData.get(`rows[${index}].words_yellow`) ?? ""),
    wordsGreen: String(formData.get(`rows[${index}].words_green`) ?? ""),
    wordsViolet: String(formData.get(`rows[${index}].words_violet`) ?? ""),
    wordsGold: String(formData.get(`rows[${index}].words_gold`) ?? ""),
  }));
}
