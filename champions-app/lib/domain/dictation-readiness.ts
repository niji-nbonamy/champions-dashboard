export const EMPTY_ROSTER_MESSAGE =
  "Importez votre liste d'élèves pour commencer.";

export const EMPTY_ROSTER_CTA_LABEL = "Importer la liste";

export const UNLEVELED_STUDENTS_MESSAGE =
  "Attribuez un niveau à vos élèves pour créer une dictée.";

export const UNLEVELED_STUDENTS_CTA_LABEL = "Attribuer les niveaux";

export type DictationReadinessInput = {
  leveledActiveStudentCount: number;
  matrixRowCount: number;
};

export function canCreateDictation(status: DictationReadinessInput): boolean {
  return status.leveledActiveStudentCount > 0 && status.matrixRowCount > 0;
}
