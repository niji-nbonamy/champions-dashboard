"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { useFormStatus } from "react-dom";

import { MAX_SCHOOL_YEAR_LABEL_LENGTH } from "@/lib/domain/class";
import { Button } from "@/components/ui/button";

import {
  resetClassYearAction,
  type ResetClassYearActionState,
} from "./actions";

const initialState: ResetClassYearActionState = { error: null };

const RESET_WARNING_MESSAGE =
  "Tous les élèves, dictées, niveaux et paramètres seront définitivement supprimés. Cette action est irréversible.";

type YearResetSectionProps = {
  currentSchoolYearLabel: string;
};

export function YearResetSection({
  currentSchoolYearLabel,
}: YearResetSectionProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const labelErrorId = useId();
  const [state, formAction, pending] = useActionState(
    resetClassYearAction,
    initialState
  );

  useEffect(() => {
    if (state.error && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  }, [state.error]);

  function openDialog() {
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    if (pending) {
      return;
    }
    dialogRef.current?.close();
  }

  function handleDialogClick(event: React.MouseEvent<HTMLDialogElement>) {
    if (pending) {
      return;
    }
    if (event.target === dialogRef.current) {
      closeDialog();
    }
  }

  function handleDialogCancel(event: React.SyntheticEvent<HTMLDialogElement>) {
    if (pending) {
      event.preventDefault();
    }
  }

  return (
    <section id="reset-annuel" className="flex flex-col gap-3">
      <h2 className="text-lg font-medium">Nouvelle année scolaire</h2>
      <p className="text-sm text-muted-foreground">
        Année scolaire actuelle : {currentSchoolYearLabel}
      </p>
      <Button type="button" variant="destructive" onClick={openDialog}>
        Remettre à zéro pour la nouvelle année
      </Button>

      <dialog
        ref={dialogRef}
        onClick={handleDialogClick}
        onCancel={handleDialogCancel}
        className="fixed top-1/2 left-1/2 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-background p-0 shadow-lg backdrop:bg-black/50 open:flex"
      >
        <form action={formAction} className="flex w-full flex-col gap-4 p-6">
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-medium">Remettre à zéro</h3>
            <p className="text-sm text-muted-foreground">
              {RESET_WARNING_MESSAGE}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="reset_school_year_label"
              className="text-sm font-medium"
            >
              Nouvelle année scolaire (facultatif)
            </label>
            <p
              id="reset_school_year_label_help"
              className="text-sm text-muted-foreground"
            >
              Laissez vide pour conserver « {currentSchoolYearLabel} ».
            </p>
            <input
              id="reset_school_year_label"
              name="school_year_label"
              type="text"
              placeholder={currentSchoolYearLabel}
              autoComplete="off"
              maxLength={MAX_SCHOOL_YEAR_LABEL_LENGTH}
              aria-describedby="reset_school_year_label_help"
              aria-invalid={state.error ? true : undefined}
              aria-errormessage={state.error ? labelErrorId : undefined}
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          {state.error ? (
            <p
              id={labelErrorId}
              className="text-sm text-destructive"
              role="alert"
            >
              {state.error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <ConfirmResetButton pending={pending} />
            <Button
              type="button"
              variant="outline"
              onClick={closeDialog}
              disabled={pending}
            >
              Annuler
            </Button>
          </div>
        </form>
      </dialog>
    </section>
  );
}

function ConfirmResetButton({ pending }: { pending: boolean }) {
  const { pending: formPending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="destructive"
      disabled={pending || formPending}
    >
      {pending || formPending ? "Réinitialisation…" : "Confirmer la réinitialisation"}
    </Button>
  );
}
