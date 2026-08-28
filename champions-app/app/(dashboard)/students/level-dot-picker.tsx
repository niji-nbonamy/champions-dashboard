"use client";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

import {
  CHAMPIONS_LEVELS,
  getChampionsLevelFrenchLabel,
} from "@/lib/domain/champions-level";
import type { ChampionsLevel } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

import {
  assignStudentLevelAction,
  overrideStudentLevelAction,
  type AssignStudentLevelActionState,
  type OverrideStudentLevelActionState,
} from "./actions";

const assignInitialState: AssignStudentLevelActionState = {
  error: null,
};

const overrideInitialState: OverrideStudentLevelActionState = {
  error: null,
  changed: false,
};

const DOT_BUTTON_CLASSES: Record<ChampionsLevel, string> = {
  yellow: "bg-level-yellow text-level-yellow-foreground",
  green: "bg-level-green text-level-green-foreground",
  violet: "bg-level-violet text-level-violet-foreground",
  gold: "bg-level-gold text-level-gold-foreground",
};

type LevelDotPickerProps =
  | {
      studentId: string;
      mode?: "assign";
      currentLevel?: never;
    }
  | {
      studentId: string;
      mode: "override";
      currentLevel: ChampionsLevel;
    };

type LevelDotButtonProps = {
  level: ChampionsLevel;
  disabled: boolean;
  mode: "assign" | "override";
  isCurrentLevel: boolean;
};

function LevelDotButton({
  level,
  disabled,
  mode,
  isCurrentLevel,
}: LevelDotButtonProps) {
  const { pending: formPending } = useFormStatus();
  const label = getChampionsLevelFrenchLabel(level);
  const ariaLabel =
    mode === "override"
      ? `Changer le niveau ${label}`
      : `Assigner le niveau ${label}`;

  return (
    <button
      type="submit"
      name="level"
      value={level}
      disabled={disabled || formPending || isCurrentLevel}
      aria-label={ariaLabel}
      aria-current={isCurrentLevel ? "true" : undefined}
      className={cn(
        "inline-flex min-h-8 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50",
        DOT_BUTTON_CLASSES[level],
        isCurrentLevel && "ring-2 ring-ring ring-offset-2"
      )}
    >
      <span
        aria-hidden="true"
        className="size-2.5 rounded-full bg-current"
      />
      {label}
    </button>
  );
}

export function LevelDotPicker(props: LevelDotPickerProps) {
  const { studentId, mode = "assign" } = props;
  const router = useRouter();
  const submittedRef = useRef(false);
  const [assignState, assignFormAction, assignPending] = useActionState(
    assignStudentLevelAction,
    assignInitialState
  );
  const [overrideState, overrideFormAction, overridePending] = useActionState(
    overrideStudentLevelAction,
    overrideInitialState
  );

  const state = mode === "override" ? overrideState : assignState;
  const formAction = mode === "override" ? overrideFormAction : assignFormAction;
  const pending = mode === "override" ? overridePending : assignPending;
  const currentLevel = mode === "override" ? props.currentLevel : undefined;

  useEffect(() => {
    if (!submittedRef.current || pending) {
      return;
    }

    submittedRef.current = false;

    if (state.error) {
      if (mode === "override") {
        toast.error(state.error);
      }
      return;
    }

    if (mode === "override" && "changed" in state && state.changed === false) {
      return;
    }

    if (mode === "override") {
      toast.success("Niveau mis à jour.");
      router.refresh();
    }
  }, [mode, pending, router, state]);

  return (
    <form
      action={formAction}
      className="flex flex-col items-end gap-1"
      data-testid={`level-dot-picker-${studentId}`}
      onSubmit={() => {
        submittedRef.current = true;
      }}
    >
      <input type="hidden" name="student_id" value={studentId} />
      <div className="flex flex-wrap items-center justify-end gap-2">
        {CHAMPIONS_LEVELS.map((level) => (
          <LevelDotButton
            key={level}
            level={level}
            disabled={pending}
            mode={mode}
            isCurrentLevel={currentLevel === level}
          />
        ))}
      </div>
      {state.error ? (
        <p className="text-xs text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
