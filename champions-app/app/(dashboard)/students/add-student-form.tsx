"use client";

import { useActionState, useEffect, useId, useRef } from "react";

import { Button } from "@/components/ui/button";
import { SpeechTherapyIcon } from "@/components/students/speech-therapy-icon";
import { STUDENT_SPEECH_THERAPY_LABEL } from "@/lib/domain/student-speech-therapy";
import { STUDENT_DISPLAY_NAME_MAX_LENGTH } from "@/lib/domain/student-display-name";

import {
  addStudentAction,
  type AddStudentActionState,
} from "./actions";

const initialState: AddStudentActionState = {
  error: null,
  success: null,
};

export function AddStudentForm() {
  const [state, formAction, pending] = useActionState(
    addStudentAction,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);
  const helpId = useId();
  const errorId = useId();

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex w-full max-w-md flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="display_name" className="text-sm font-medium">
          Nom de l&apos;élève
        </label>
        <p id={helpId} className="text-sm text-muted-foreground">
          Nom complet tel qu&apos;affiché en classe.
        </p>
        <input
          id="display_name"
          name="display_name"
          type="text"
          required
          autoComplete="off"
          maxLength={STUDENT_DISPLAY_NAME_MAX_LENGTH}
          aria-describedby={
            state.error ? `${helpId} ${errorId}` : helpId
          }
          aria-invalid={state.error ? true : undefined}
          aria-errormessage={state.error ? errorId : undefined}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </div>

      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="has_speech_therapy"
          value="true"
          className="size-4 rounded border border-border accent-primary"
        />
        <SpeechTherapyIcon className="opacity-70" />
        <span>{STUDENT_SPEECH_THERAPY_LABEL}</span>
      </label>

      {state.error ? (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="text-sm text-primary" role="status">
          {state.success}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Ajout…" : "Ajouter un élève"}
      </Button>
    </form>
  );
}
