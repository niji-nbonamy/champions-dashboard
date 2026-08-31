"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import {
  formatStudentArchiveConfirmTitle,
  STUDENT_ARCHIVE_CONFIRM_MESSAGE,
} from "@/lib/domain/student-display-name";
import type { ClassStudentFilter } from "@/lib/services/list-class-students";

import {
  archiveStudentAction,
  type ArchiveStudentActionState,
} from "./actions";

const initialState: ArchiveStudentActionState = {
  error: null,
};

type ArchiveStudentButtonProps = {
  studentId: string;
  displayName: string;
  filter: ClassStudentFilter;
};

export function ArchiveStudentButton({
  studentId,
  displayName,
  filter,
}: ArchiveStudentButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const errorId = useId();
  const [state, formAction, pending] = useActionState(
    archiveStudentAction,
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
    <>
      <Button type="button" variant="ghost" size="sm" onClick={openDialog}>
        Archiver
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
              {formatStudentArchiveConfirmTitle(displayName)}
            </h2>
            <p className="text-sm text-muted-foreground">
              {STUDENT_ARCHIVE_CONFIRM_MESSAGE}
            </p>
          </div>

          <input type="hidden" name="student_id" value={studentId} />
          <input type="hidden" name="filter" value={filter} />

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
            <ConfirmArchiveButton pending={pending} />
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

function ConfirmArchiveButton({ pending }: { pending: boolean }) {
  const { pending: formPending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="destructive"
      disabled={pending || formPending}
    >
      {pending || formPending ? "Archivage…" : "Confirmer l'archivage"}
    </Button>
  );
}
