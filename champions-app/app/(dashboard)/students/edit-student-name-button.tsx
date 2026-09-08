"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  STUDENT_DISPLAY_NAME_MAX_LENGTH,
  STUDENT_DISPLAY_NAME_UPDATE_DIALOG_TITLE,
  STUDENT_DISPLAY_NAME_UPDATE_SUCCESS_MESSAGE,
} from "@/lib/domain/student-display-name";

import {
  updateStudentDisplayNameAction,
  type UpdateStudentDisplayNameActionState,
} from "./actions";

const initialState: UpdateStudentDisplayNameActionState = {
  error: null,
  changed: false,
};

type EditStudentNameButtonProps = {
  studentId: string;
  displayName: string;
};

export function EditStudentNameButton({
  studentId,
  displayName,
}: EditStudentNameButtonProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const submittedRef = useRef(false);
  const titleId = useId();
  const labelId = useId();
  const errorId = useId();
  const [state, formAction, pending] = useActionState(
    updateStudentDisplayNameAction,
    initialState
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

    if (state.changed) {
      toast.success(STUDENT_DISPLAY_NAME_UPDATE_SUCCESS_MESSAGE);
      dialogRef.current?.close();
      router.refresh();
      return;
    }

    dialogRef.current?.close();
  }, [pending, router, state]);

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
      <Button type="button" variant="ghost" size="sm" onClick={openDialog}>
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
          action={formAction}
          className="flex w-full flex-col gap-4 p-6"
          onSubmit={() => {
            submittedRef.current = true;
          }}
        >
          <div className="flex flex-col gap-2">
            <h2 id={titleId} className="text-lg font-medium">
              {STUDENT_DISPLAY_NAME_UPDATE_DIALOG_TITLE}
            </h2>
            <label id={labelId} htmlFor={`display_name_${studentId}`} className="text-sm font-medium">
              Nom de l&apos;élève
            </label>
            <input
              id={`display_name_${studentId}`}
              name="display_name"
              type="text"
              required
              autoComplete="off"
              maxLength={STUDENT_DISPLAY_NAME_MAX_LENGTH}
              defaultValue={displayName}
              aria-labelledby={labelId}
              aria-describedby={state.error ? errorId : undefined}
              aria-invalid={state.error ? true : undefined}
              aria-errormessage={state.error ? errorId : undefined}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          <input type="hidden" name="student_id" value={studentId} />

          {state.error ? (
            <p
              id={errorId}
              className="text-sm text-destructive"
              role="alert"
            >
              {state.error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <SaveNameButton pending={pending} />
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

function SaveNameButton({ pending }: { pending: boolean }) {
  const { pending: formPending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending || formPending}>
      {pending || formPending ? "Enregistrement…" : "Enregistrer"}
    </Button>
  );
}
