"use client";

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

const ASSIGN_DOT_BUTTON_CLASSES: Record<ChampionsLevel, string> = {
  yellow: "bg-level-yellow text-level-yellow-foreground",
  green: "bg-level-green text-level-green-foreground",
  violet: "bg-level-violet text-level-violet-foreground",
  gold: "bg-level-gold text-level-gold-foreground",
};

const OVERRIDE_DOT_BUTTON_CLASSES: Record<ChampionsLevel, string> = {
  yellow:
    "border-level-yellow bg-background text-foreground hover:bg-level-yellow/15 hover:shadow-sm",
  green:
    "border-level-green bg-background text-foreground hover:bg-level-green/15 hover:shadow-sm",
  violet:
    "border-level-violet bg-background text-foreground hover:bg-level-violet/15 hover:shadow-sm",
  gold: "border-level-gold bg-background text-foreground hover:bg-level-gold/15 hover:shadow-sm",
};

const OVERRIDE_DOT_COLORS: Record<ChampionsLevel, string> = {
  yellow: "bg-level-yellow",
  green: "bg-level-green",
  violet: "bg-level-violet",
  gold: "bg-level-gold",
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

  const isOverride = mode === "override";
  const isInteractive = !disabled && !formPending && !isCurrentLevel;

  return (
    <button
      type="submit"
      name="level"
      value={level}
      disabled={disabled || formPending || isCurrentLevel}
      aria-label={ariaLabel}
      aria-current={isCurrentLevel ? "true" : undefined}
      className={cn(
        "inline-flex min-h-8 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50",
        isOverride
          ? cn(
              "border-2",
              OVERRIDE_DOT_BUTTON_CLASSES[level],
              isCurrentLevel && "cursor-default border-dashed opacity-60",
              isInteractive && "cursor-pointer"
            )
          : cn(ASSIGN_DOT_BUTTON_CLASSES[level], "cursor-pointer hover:brightness-110")
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-2.5 rounded-full",
          isOverride ? OVERRIDE_DOT_COLORS[level] : "bg-current"
        )}
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

  const levelButtons = (
    <div className="flex flex-wrap items-center gap-2">
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
  );

  return (
    <form
      action={formAction}
      className={cn(
        "flex flex-col gap-1",
        mode === "override" ? "items-start" : "items-end"
      )}
      data-testid={`level-dot-picker-${studentId}`}
      data-mode={mode}
      onSubmit={() => {
        submittedRef.current = true;
      }}
    >
      <input type="hidden" name="student_id" value={studentId} />
      {mode === "override" ? (
        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className="text-sm font-medium text-muted-foreground">
            Modifier le niveau
          </legend>
          {levelButtons}
        </fieldset>
      ) : (
        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className="text-sm font-medium text-muted-foreground">
            Assigner un niveau
          </legend>
          {levelButtons}
        </fieldset>
      )}
      {state.error && mode !== "override" ? (
        <p className="text-xs text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
