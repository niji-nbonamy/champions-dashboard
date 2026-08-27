export const STUDENT_DISPLAY_NAME_MAX_LENGTH = 200;

export const STUDENT_DISPLAY_NAME_EMPTY_ERROR =
  "Saisissez le nom de l'élève.";

export const STUDENT_DISPLAY_NAME_TOO_LONG_ERROR =
  "Nom trop long (max 200 caractères).";

export const STUDENT_ADD_SUCCESS_MESSAGE = "Élève ajouté.";

export const STUDENT_ARCHIVE_SUCCESS_MESSAGE = "Élève archivé.";

export const STUDENT_ARCHIVE_NOT_FOUND_ERROR = "Élève introuvable.";

export const STUDENT_ARCHIVE_GENERIC_ERROR =
  "Archivage impossible. Réessayez.";

export type ValidateDisplayNameSuccess = {
  ok: true;
  displayName: string;
};

export type ValidateDisplayNameFailure = {
  ok: false;
  error: string;
};

export type ValidateDisplayNameResult =
  | ValidateDisplayNameSuccess
  | ValidateDisplayNameFailure;

export function normalizeDisplayName(name: string): string {
  return name.trim();
}

export function normalizeDuplicateKey(name: string): string {
  return normalizeDisplayName(name).toLowerCase();
}

export function formatStudentDuplicateError(existingName: string): string {
  return `Un élève avec ce nom existe déjà : ${existingName}.`;
}

export function validateDisplayName(
  rawName: string
): ValidateDisplayNameResult {
  const displayName = normalizeDisplayName(rawName);

  if (!displayName) {
    return { ok: false, error: STUDENT_DISPLAY_NAME_EMPTY_ERROR };
  }

  if (displayName.length > STUDENT_DISPLAY_NAME_MAX_LENGTH) {
    return { ok: false, error: STUDENT_DISPLAY_NAME_TOO_LONG_ERROR };
  }

  return { ok: true, displayName };
}
