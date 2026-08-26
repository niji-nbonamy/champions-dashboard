"use client";

import { WordCountMatrixForm } from "@/app/(dashboard)/config/word-count-matrix-form";
import type { WordCountMatrixRowInput } from "@/lib/domain/word-count-matrix";

type StepMatrixProps = {
  initialRows: WordCountMatrixRowInput[];
  onDirtyChange?: (isDirty: boolean) => void;
};

export function StepMatrix({ initialRows, onDirtyChange }: StepMatrixProps) {
  return (
    <div className="flex w-full flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Définissez au moins une dictée avec les totaux de mots pour chaque
        niveau couleur, puis enregistrez la matrice.
      </p>
      <WordCountMatrixForm
        initialRows={initialRows}
        showDefaultSaveButton
        onDirtyChange={onDirtyChange}
      />
    </div>
  );
}
