import {
  DICTATION_LABEL_REQUIRED_ERROR,
  DICTATION_LABEL_TOO_LONG_ERROR,
  normalizeDictationLabel,
  normalizeDictationLabelKey,
} from "@/lib/domain/word-count-matrix";

export const DICTATION_MATRIX_ROW_MISSING_ERROR =
  "Aucune ligne de matrice pour cette dictée. Configurez la matrice sur Config.";

export const DICTATION_DATE_INVALID_ERROR = "Date de dictée invalide.";

const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type ValidatedDictationLabel = {
  label: string;
  dictationLabelKey: string;
};

export type ValidateDictationLabelResult =
  | { ok: true; value: ValidatedDictationLabel }
  | { ok: false; error: string };

export type ParseDictationDateResult =
  | { ok: true; date: string }
  | { ok: false; error: string };

export type MatrixLabelRow = {
  dictationLabelKey: string;
};

export function getTodayUtcDateString(referenceDate = new Date()): string {
  return referenceDate.toISOString().slice(0, 10);
}

export function validateDictationLabel(
  rawLabel: string
): ValidateDictationLabelResult {
  const label = normalizeDictationLabel(rawLabel);

  if (!label) {
    return { ok: false, error: DICTATION_LABEL_REQUIRED_ERROR };
  }

  if (label.length > 80) {
    return { ok: false, error: DICTATION_LABEL_TOO_LONG_ERROR };
  }

  return {
    ok: true,
    value: {
      label,
      dictationLabelKey: normalizeDictationLabelKey(label),
    },
  };
}

export function parseDictationDate(
  rawDate: string | null | undefined,
  referenceDate = new Date()
): ParseDictationDateResult {
  const trimmed = (rawDate ?? "").trim();
  const dateValue =
    trimmed.length === 0 ? getTodayUtcDateString(referenceDate) : trimmed;

  if (!DATE_INPUT_PATTERN.test(dateValue)) {
    return { ok: false, error: DICTATION_DATE_INVALID_ERROR };
  }

  const [year, month, day] = dateValue.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return { ok: false, error: DICTATION_DATE_INVALID_ERROR };
  }

  return { ok: true, date: dateValue };
}

export function findMatchingMatrixRow<T extends MatrixLabelRow>(
  matrixRows: T[],
  submittedLabel: string
): T | null {
  const submittedKey = normalizeDictationLabelKey(submittedLabel);

  return (
    matrixRows.find(
      (row) => normalizeDictationLabelKey(row.dictationLabelKey) === submittedKey
    ) ?? null
  );
}

export function formatDictationDateForDisplay(dateValue: string): string {
  if (!DATE_INPUT_PATTERN.test(dateValue)) {
    return dateValue;
  }

  const [year, month, day] = dateValue.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
