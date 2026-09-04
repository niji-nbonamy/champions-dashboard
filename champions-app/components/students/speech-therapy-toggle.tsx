"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  setStudentSpeechTherapyAction,
  type SetStudentSpeechTherapyActionState,
} from "@/app/(dashboard)/students/actions";
import { STUDENT_SPEECH_THERAPY_LABEL } from "@/lib/domain/student-speech-therapy";
import { cn } from "@/lib/utils";

import { SpeechTherapyIcon } from "./speech-therapy-icon";

const initialState: SetStudentSpeechTherapyActionState = {
  error: null,
  changed: false,
};

type SpeechTherapyToggleProps = {
  studentId: string;
  hasSpeechTherapy: boolean;
  className?: string;
};

export function SpeechTherapyToggle({
  studentId,
  hasSpeechTherapy,
  className,
}: SpeechTherapyToggleProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const submittedRef = useRef(false);
  const [checked, setChecked] = useState(hasSpeechTherapy);
  const [state, formAction, pending] = useActionState(
    setStudentSpeechTherapyAction,
    initialState
  );

  useEffect(() => {
    setChecked(hasSpeechTherapy);
  }, [hasSpeechTherapy]);

  useEffect(() => {
    if (!submittedRef.current || pending) {
      return;
    }

    submittedRef.current = false;

    if (state.error) {
      setChecked(hasSpeechTherapy);
      toast.error(state.error);
      return;
    }

    if (state.changed) {
      toast.success("Suivi orthophoniste mis à jour.");
      router.refresh();
    }
  }, [hasSpeechTherapy, pending, router, state]);

  const handleChange = (nextChecked: boolean) => {
    setChecked(nextChecked);
    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = nextChecked ? "true" : "false";
    }
    submittedRef.current = true;
    formRef.current?.requestSubmit();
  };

  return (
    <form
      ref={formRef}
      action={formAction}
      className={cn("flex items-center", className)}
      data-testid={`speech-therapy-toggle-${studentId}`}
      onSubmit={() => {
        submittedRef.current = true;
      }}
    >
      <input type="hidden" name="student_id" value={studentId} />
      <input
        ref={hiddenInputRef}
        type="hidden"
        name="has_speech_therapy"
        value={checked ? "true" : "false"}
      />
      <label className="inline-flex cursor-pointer items-center gap-1.5">
        <input
          type="checkbox"
          checked={checked}
          disabled={pending}
          onChange={(event) => {
            handleChange(event.currentTarget.checked);
          }}
          className="size-4 rounded border border-border accent-primary"
          aria-label={STUDENT_SPEECH_THERAPY_LABEL}
        />
        <SpeechTherapyIcon
          className={cn(
            "opacity-50",
            checked && "opacity-100"
          )}
          title={STUDENT_SPEECH_THERAPY_LABEL}
        />
      </label>
    </form>
  );
}
