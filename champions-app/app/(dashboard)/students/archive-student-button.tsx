"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

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
  filter: "active" | "archived" | "all";
};

export function ArchiveStudentButton({
  studentId,
  displayName,
  filter,
}: ArchiveStudentButtonProps) {
  const [state, formAction, pending] = useActionState(
    archiveStudentAction,
    initialState
  );

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <form
        action={formAction}
        onSubmit={(event) => {
          if (
            !window.confirm(
              `Archiver ${displayName} ? L'élève sera retiré de la liste active.`
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="student_id" value={studentId} />
        <input type="hidden" name="filter" value={filter} />
        <SubmitArchiveButton pending={pending} />
      </form>
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}

function SubmitArchiveButton({ pending }: { pending: boolean }) {
  const { pending: formPending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="ghost"
      size="sm"
      disabled={pending || formPending}
    >
      {pending || formPending ? "Archivage…" : "Archiver"}
    </Button>
  );
}
