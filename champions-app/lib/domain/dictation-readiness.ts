export const EMPTY_ROSTER_MESSAGE =
  "Importez votre liste d'élèves pour commencer.";

export const EMPTY_ROSTER_CTA_LABEL = "Importer la liste";

export type DictationReadinessInput = {
  activeStudentCount: number;
  matrixRowCount: number;
};

export function canCreateDictation(status: DictationReadinessInput): boolean {
  return status.activeStudentCount > 0 && status.matrixRowCount > 0;
}
