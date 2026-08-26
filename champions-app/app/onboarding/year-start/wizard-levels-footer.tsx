"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

import { confirmLevelsStepAction } from "./actions";

export function WizardLevelsFooter({
  canAdvance,
}: {
  canAdvance: boolean;
}) {
  return (
    <form action={confirmLevelsStepAction}>
      <WizardLevelsSubmitButton canAdvance={canAdvance} />
    </form>
  );
}

function WizardLevelsSubmitButton({ canAdvance }: { canAdvance: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="accent"
      disabled={!canAdvance || pending}
    >
      {pending ? "Chargement…" : "Suivant"}
    </Button>
  );
}
