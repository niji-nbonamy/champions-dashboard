export const CLASS_ONBOARDING_ERROR_MESSAGE =
  "Impossible de créer la classe. Vérifiez les informations et réessayez.";

export const SCHOOL_YEAR_LABEL_EMPTY_MESSAGE =
  "Indiquez l'année scolaire.";

export const MAX_SCHOOL_YEAR_LABEL_LENGTH = 64;

export function validateSchoolYearLabel(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.length > MAX_SCHOOL_YEAR_LABEL_LENGTH) {
    return null;
  }

  return trimmed;
}

export function getSchoolYearLabelValidationError(raw: string): string | null {
  if (!raw.trim()) {
    return SCHOOL_YEAR_LABEL_EMPTY_MESSAGE;
  }

  if (!validateSchoolYearLabel(raw)) {
    return CLASS_ONBOARDING_ERROR_MESSAGE;
  }

  return null;
}
