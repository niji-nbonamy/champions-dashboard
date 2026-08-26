"use client";

import { useActionState } from "react";

import {
  CHAMPIONS_LEVELS,
  getChampionsLevelFrenchLabel,
} from "@/lib/domain/champions-level";
import type { ChampionsLevel } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

import {
  assignStudentLevelAction,
  type AssignStudentLevelActionState,
} from "./actions";

const initialState: AssignStudentLevelActionState = {
  error: null,
};

const DOT_BUTTON_CLASSES: Record<ChampionsLevel, string> = {
  yellow: "bg-level-yellow text-level-yellow-foreground",
  green: "bg-level-green text-level-green-foreground",
  violet: "bg-level-violet text-level-violet-foreground",
  gold: "bg-level-gold text-level-gold-foreground",
};

type LevelDotPickerProps = {
  studentId: string;
};

export function LevelDotPicker({ studentId }: LevelDotPickerProps) {
  const [state, formAction, pending] = useActionState(
    assignStudentLevelAction,
    initialState
  );

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="student_id" value={studentId} />
      <div className="flex flex-wrap items-center justify-end gap-2">
        {CHAMPIONS_LEVELS.map((level) => (
          <button
            key={level}
            type="submit"
            name="level"
            value={level}
            disabled={pending}
            aria-label={`Assigner le niveau ${getChampionsLevelFrenchLabel(level)}`}
            className={cn(
              "inline-flex min-h-8 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50",
              DOT_BUTTON_CLASSES[level]
            )}
          >
            <span
              aria-hidden="true"
              className="size-2.5 rounded-full bg-current"
            />
            {getChampionsLevelFrenchLabel(level)}
          </button>
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
