export const EMPTY_ROSTER_MESSAGE =
  "Importez votre liste d'élèves pour commencer.";

export const EMPTY_ROSTER_CTA_LABEL = "Importer la liste";

export const UNLEVELED_STUDENTS_MESSAGE =
  "Attribuez un niveau à vos élèves pour créer une dictée.";

export const UNLEVELED_STUDENTS_CTA_LABEL = "Attribuer les niveaux";

export const MATRIX_MISSING_MESSAGE =
  "Configurez la matrice sur Config pour créer une dictée.";

export const MATRIX_MISSING_CTA_LABEL = "Configurer la matrice";

export type DictationReadinessInput = {
  leveledActiveStudentCount: number;
  matrixRowCount: number;
};

export type DictationReadinessStatus = DictationReadinessInput & {
  activeStudentCount: number;
};

export function canCreateDictation(status: DictationReadinessInput): boolean {
  return status.leveledActiveStudentCount > 0 && status.matrixRowCount > 0;
}

export function getCreateDictationBlockedMessage(
  status: DictationReadinessStatus
): string {
  if (status.activeStudentCount === 0) {
    return EMPTY_ROSTER_MESSAGE;
  }

  const hasUnleveledStudents = status.leveledActiveStudentCount === 0;

  if (hasUnleveledStudents && status.matrixRowCount === 0) {
    return `${UNLEVELED_STUDENTS_MESSAGE} ${MATRIX_MISSING_MESSAGE}`;
  }

  if (hasUnleveledStudents) {
    return UNLEVELED_STUDENTS_MESSAGE;
  }

  if (status.matrixRowCount === 0) {
    return MATRIX_MISSING_MESSAGE;
  }

  return "Création impossible. Réessayez.";
}

export function getDisabledCreateDictationTitle(
  status: DictationReadinessStatus
): string {
  return getCreateDictationBlockedMessage(status);
}
