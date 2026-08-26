import { WordCountMatrixForm } from "@/app/(dashboard)/config/word-count-matrix-form";
import type { WordCountMatrixRowInput } from "@/lib/domain/word-count-matrix";

import { WizardFinishButton } from "./wizard-finish-button";

type StepMatrixProps = {
  initialRows: WordCountMatrixRowInput[];
  canFinish: boolean;
};

export function StepMatrix({ initialRows, canFinish }: StepMatrixProps) {
  return (
    <div className="flex w-full flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Définissez au moins une dictée avec les totaux de mots pour chaque
        niveau couleur, puis enregistrez la matrice.
      </p>
      <WordCountMatrixForm initialRows={initialRows} showDefaultSaveButton />
      <WizardFinishButton canFinish={canFinish} />
    </div>
  );
}
