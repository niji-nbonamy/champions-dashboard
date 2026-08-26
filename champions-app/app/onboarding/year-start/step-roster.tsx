"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import type { ActiveStudent } from "@/lib/services/list-active-students";

import {
  confirmRosterStepAction,
  removeStudentFromWizardAction,
  type RemoveStudentFromWizardActionState,
} from "./actions";

const removeInitialState: RemoveStudentFromWizardActionState = {
  error: null,
};

type StepRosterProps = {
  students: ActiveStudent[];
};

export function StepRoster({ students }: StepRosterProps) {
  const [removeState, removeAction, removePending] = useActionState(
    removeStudentFromWizardAction,
    removeInitialState
  );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
    <p className="text-sm text-muted-foreground">
      Vérifiez la liste importée et retirez les entrées erronées avant de
      continuer.
    </p>

    {students.length === 0 ? (
      <p className="text-sm text-muted-foreground">
        Aucun élève actif pour le moment. Importez une liste depuis Config ou
        ajoutez des élèves depuis l&apos;onglet Élèves.
      </p>
    ) : (
      <ul className="divide-y divide-border rounded-lg border border-border">
        {students.map((student) => (
          <li
            key={student.id}
            className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="text-sm font-medium">{student.displayName}</span>
            {student.level == null ? (
              <form action={removeAction}>
                <input type="hidden" name="student_id" value={student.id} />
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  disabled={removePending}
                >
                  Retirer
                </Button>
              </form>
            ) : null}
          </li>
        ))}
      </ul>
    )}

    {removeState.error ? (
      <p className="text-sm text-destructive" role="alert">
        {removeState.error}
      </p>
    ) : null}

    <form action={confirmRosterStepAction}>
      <ConfirmRosterButton
        disabled={students.length === 0 || removePending}
      />
    </form>
    </div>
  );
}

function ConfirmRosterButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="accent" disabled={disabled || pending}>
      {pending ? "Confirmation…" : "Confirmer"}
    </Button>
  );
}
