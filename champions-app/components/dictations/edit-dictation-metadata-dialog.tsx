"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DICTATION_DATE_INVALID_ERROR } from "@/lib/domain/dictation";
import { DICTATION_METADATA_UPDATE_SUCCESS_MESSAGE } from "@/lib/domain/dictation-save-messages";
import { normalizeDictationLabelKey } from "@/lib/domain/word-count-matrix";

import {
  updateDictationAction,
  type UpdateDictationActionState,
} from "@/app/(dashboard)/dictations/actions";

const initialState: UpdateDictationActionState = { error: null };

type MatrixLabelOption = {
  value: string;
  label: string;
};

type EditDictationMetadataDialogProps = {
  dictationId: string;
  currentLabelKey: string;
  currentDate: string;
  matrixLabelOptions: MatrixLabelOption[];
};

export function EditDictationMetadataDialog({
  dictationId,
  currentLabelKey,
  currentDate,
  matrixLabelOptions,
}: EditDictationMetadataDialogProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const submittedRef = useRef(false);
  const titleId = useId();
  const labelErrorId = useId();
  const dateErrorId = useId();
  const [state, formAction, pending] = useActionState(
    updateDictationAction,
    initialState
  );
  const isDateError = state.error === DICTATION_DATE_INVALID_ERROR;
  const hasCurrentLabelOption = matrixLabelOptions.some(
    (option) =>
      normalizeDictationLabelKey(option.value) ===
      normalizeDictationLabelKey(currentLabelKey)
  );

  useEffect(() => {
    if (state.error && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  }, [state.error]);

  useEffect(() => {
    if (!submittedRef.current || pending) {
      return;
    }

    submittedRef.current = false;

    if (state.error) {
      return;
    }

    toast.success(DICTATION_METADATA_UPDATE_SUCCESS_MESSAGE);
    if (dialogRef.current?.open) {
      dialogRef.current.close();
    }
    router.refresh();
  }, [pending, router, state.error]);

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
      <Button type="button" variant="outline" size="sm" onClick={openDialog}>
        Modifier
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClick={handleDialogClick}
        onCancel={handleDialogCancel}
        className="fixed top-1/2 left-1/2 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-background p-0 shadow-lg backdrop:bg-black/50 open:flex"
      >
        <form
          key={`${currentLabelKey}-${currentDate}`}
          action={formAction}
          className="flex w-full flex-col gap-4 p-6"
          onSubmit={() => {
            submittedRef.current = true;
          }}
        >
          <input type="hidden" name="dictation_id" value={dictationId} />

          <h2 id={titleId} className="text-lg font-medium">
            Modifier la dictée
          </h2>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit_dictation_label" className="text-sm font-medium">
              Dictée
            </label>
            <select
              id="edit_dictation_label"
              name="label"
              required
              defaultValue={hasCurrentLabelOption ? currentLabelKey : ""}
              aria-invalid={state.error && !isDateError ? true : undefined}
              aria-errormessage={
                state.error && !isDateError ? labelErrorId : undefined
              }
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {!hasCurrentLabelOption ? (
                <option value="" disabled>
                  Sélectionnez un libellé
                </option>
              ) : null}
              {matrixLabelOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit_dictation_date" className="text-sm font-medium">
              Date
            </label>
            <input
              id="edit_dictation_date"
              name="dictation_date"
              type="date"
              required
              defaultValue={currentDate}
              aria-invalid={isDateError ? true : undefined}
              aria-errormessage={isDateError ? dateErrorId : undefined}
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          {!hasCurrentLabelOption ? (
            <p className="text-sm text-muted-foreground" role="status">
              Le libellé actuel n&apos;existe plus dans la matrice Config.
              Sélectionnez un libellé valide avant d&apos;enregistrer.
            </p>
          ) : null}

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
            <SubmitEditDictationButton pending={pending} />
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

function SubmitEditDictationButton({ pending }: { pending: boolean }) {
  const { pending: formPending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending || formPending}>
      {pending || formPending ? "Enregistrement…" : "Enregistrer"}
    </Button>
  );
}
