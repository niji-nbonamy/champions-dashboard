"use client";

import { useActionState } from "react";

import { MAX_SCHOOL_YEAR_LABEL_LENGTH } from "@/lib/domain/class";
import { Button } from "@/components/ui/button";

import { createClassAction, type CreateClassActionState } from "./actions";

const initialState: CreateClassActionState = { error: null };

export function ClassForm() {
  const [state, formAction, pending] = useActionState(
    createClassAction,
    initialState
  );

  return (
    <form
      action={formAction}
      noValidate
      className="flex w-full max-w-sm flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="school_year_label" className="text-sm font-medium">
          Année scolaire
        </label>
        <input
          id="school_year_label"
          name="school_year_label"
          type="text"
          placeholder="2025-2026"
          autoComplete="off"
          maxLength={MAX_SCHOOL_YEAR_LABEL_LENGTH}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Création…" : "Créer ma classe"}
      </Button>
    </form>
  );
}
