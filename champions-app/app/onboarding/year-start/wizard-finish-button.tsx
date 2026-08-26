"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import {
  completeYearStartWizardAction,
  type CompleteYearStartWizardActionState,
} from "./actions";

const initialState: CompleteYearStartWizardActionState = {
  error: null,
};

export function WizardFinishButton({
  canFinish,
  isMatrixDirty = false,
}: {
  canFinish: boolean;
  isMatrixDirty?: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    completeYearStartWizardAction,
    initialState
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <Button type="submit" disabled={!canFinish || pending}>
        {pending ? "Finalisation…" : "Terminer la configuration"}
      </Button>
      {!canFinish && isMatrixDirty ? (
        <p className="text-sm text-muted-foreground">
          Enregistrez la matrice avant de terminer la configuration.
        </p>
      ) : null}
      {!canFinish && !isMatrixDirty ? (
        <p className="text-sm text-muted-foreground">
          Enregistrez au moins une dictée complète dans la matrice (quatre
          totaux de mots supérieurs à 0) pour terminer.
        </p>
      ) : null}
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
