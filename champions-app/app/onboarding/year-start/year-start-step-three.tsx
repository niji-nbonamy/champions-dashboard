"use client";

import { useState } from "react";

import type { WordCountMatrixRowInput } from "@/lib/domain/word-count-matrix";

import { StepMatrix } from "./step-matrix";
import { WizardFinishButton } from "./wizard-finish-button";
import { WizardShell } from "./wizard-shell";

type YearStartStepThreeProps = {
  backHref: string;
  initialRows: WordCountMatrixRowInput[];
  canFinish: boolean;
};

export function YearStartStepThree({
  backHref,
  initialRows,
  canFinish,
}: YearStartStepThreeProps) {
  const [isMatrixDirty, setIsMatrixDirty] = useState(false);
  const canSubmitFinish = canFinish && !isMatrixDirty;

  return (
    <WizardShell
      currentStep={3}
      backHref={backHref}
      footer={<WizardFinishButton canFinish={canSubmitFinish} isMatrixDirty={isMatrixDirty} />}
    >
      <StepMatrix
        initialRows={initialRows}
        onDirtyChange={setIsMatrixDirty}
      />
    </WizardShell>
  );
}
