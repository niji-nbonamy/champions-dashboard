import {
  DICTATION_LABEL_REQUIRED_ERROR,
  DICTATION_LABEL_TOO_LONG_ERROR,
  normalizeDictationLabel,
  normalizeDictationLabelKey,
} from "@/lib/domain/word-count-matrix";

export const DICTATION_MATRIX_ROW_MISSING_ERROR =
  "Aucune ligne de matrice pour cette dictée. Configurez la matrice sur Config.";

export const DICTATION_DATE_INVALID_ERROR = "Date de dictée invalide.";

export const CLASS_CALENDAR_TIMEZONE = "Europe/Paris";

const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

export function isValidUuidV4(value: string): boolean {
  return UUID_V4_PATTERN.test(value);
}

export function getClassLocalDateString(referenceDate = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: CLASS_CALENDAR_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(referenceDate);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    return referenceDate.toISOString().slice(0, 10);
  }

  return `${year}-${month}-${day}`;
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
    trimmed.length === 0 ? getClassLocalDateString(referenceDate) : trimmed;

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
    timeZone: CLASS_CALENDAR_TIMEZONE,
  });
}
