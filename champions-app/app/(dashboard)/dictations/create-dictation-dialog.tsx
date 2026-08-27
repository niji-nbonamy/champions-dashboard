"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { DICTATION_DATE_INVALID_ERROR } from "@/lib/domain/dictation";

import {
  createDictationAction,
  type CreateDictationActionState,
} from "./actions";

const initialState: CreateDictationActionState = { error: null };

type MatrixLabelOption = {
  value: string;
  label: string;
};

type CreateDictationDialogProps = {
  matrixLabelOptions: MatrixLabelOption[];
  defaultDate?: string;
};

function getLocalDateInputValue(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function CreateDictationDialog({
  matrixLabelOptions,
  defaultDate = getLocalDateInputValue(),
}: CreateDictationDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const labelErrorId = useId();
  const dateErrorId = useId();
  const [state, formAction, pending] = useActionState(
    createDictationAction,
    initialState
  );
  const isDateError = state.error === DICTATION_DATE_INVALID_ERROR;

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
    <>
      <Button type="button" onClick={openDialog}>
        Nouvelle dictée
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClick={handleDialogClick}
        onCancel={handleDialogCancel}
        className="fixed top-1/2 left-1/2 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-background p-0 shadow-lg backdrop:bg-black/50 open:flex"
      >
        <form action={formAction} className="flex w-full flex-col gap-4 p-6">
          <div className="flex flex-col gap-2">
            <h2 id={titleId} className="text-lg font-medium">
              Nouvelle dictée
            </h2>
            <p className="text-sm text-muted-foreground">
              Choisissez une dictée de la matrice et sa date.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="dictation_label" className="text-sm font-medium">
              Dictée
            </label>
            <select
              id="dictation_label"
              name="label"
              required
              defaultValue={matrixLabelOptions[0]?.value ?? ""}
              aria-invalid={state.error && !isDateError ? true : undefined}
              aria-errormessage={
                state.error && !isDateError ? labelErrorId : undefined
              }
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {matrixLabelOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="dictation_date" className="text-sm font-medium">
              Date
            </label>
            <input
              id="dictation_date"
              name="dictation_date"
              type="date"
              required
              defaultValue={defaultDate}
              aria-invalid={isDateError ? true : undefined}
              aria-errormessage={isDateError ? dateErrorId : undefined}
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          {state.error ? (
            <p
              id={isDateError ? dateErrorId : labelErrorId}
              className="text-sm text-destructive"
              role="alert"
            >
              {state.error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <SubmitCreateDictationButton pending={pending} />
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
    </>
  );
}

function SubmitCreateDictationButton({ pending }: { pending: boolean }) {
  const { pending: formPending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending || formPending}>
      {pending || formPending ? "Création…" : "Créer la dictée"}
    </Button>
  );
}
