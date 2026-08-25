"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import {
  registerAction,
  type RegisterActionState,
} from "./actions";

const initialState: RegisterActionState = { error: null };

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    registerAction,
    initialState
  );

  return (
    <form
      action={formAction}
      noValidate
      className="flex w-full max-w-sm flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="text"
          inputMode="email"
          autoComplete="email"
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      {state.error ? (
        <p className="text-sm text-destructive" role="alert">{state.error}</p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
