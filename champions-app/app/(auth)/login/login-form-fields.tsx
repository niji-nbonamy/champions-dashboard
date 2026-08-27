import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/auth/password-field";

import type { LoginActionState } from "./actions";

export type LoginFormFieldsProps = {
  state: LoginActionState;
  formAction: (payload: FormData) => void;
  pending: boolean;
};

export function LoginFormFields({
  state,
  formAction,
  pending,
}: LoginFormFieldsProps) {
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

      <PasswordField
        name="password"
        label="Mot de passe"
        autoComplete="current-password"
      />

      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Connexion…" : "Se connecter"}
      </Button>
    </form>
  );
}
