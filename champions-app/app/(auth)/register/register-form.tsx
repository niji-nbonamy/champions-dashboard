"use client";

import { useActionState, useMemo, useState } from "react";

import { PasswordField } from "@/components/auth/password-field";
import { PasswordRequirements } from "@/components/auth/password-requirements";
import { RecaptchaField } from "@/components/auth/recaptcha-field";
import { Button } from "@/components/ui/button";
import {
  getPasswordRequirementStatus,
  isValidRegistrationPassword,
  passwordsMatch,
} from "@/lib/domain/registration";

import {
  registerAction,
  type RegisterActionState,
} from "./actions";

const initialState: RegisterActionState = { error: null };

type RegisterFormProps = {
  recaptchaSiteKey: string | null;
  recaptchaRequired: boolean;
};

export function RegisterForm({
  recaptchaSiteKey,
  recaptchaRequired,
}: RegisterFormProps) {
  const [state, formAction, pending] = useActionState(
    registerAction,
    initialState
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  const requirementStatus = useMemo(
    () => getPasswordRequirementStatus(password, confirmPassword),
    [password, confirmPassword]
  );

  const allRequirementsMet = useMemo(
    () => Object.values(requirementStatus).every(Boolean),
    [requirementStatus]
  );

  const canSubmit =
    allRequirementsMet &&
    isValidRegistrationPassword(password) &&
    passwordsMatch(password, confirmPassword) &&
    (!recaptchaRequired || Boolean(recaptchaToken));

  return (
    <form
      action={formAction}
      noValidate
      className="flex w-full max-w-sm flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
          <span className="text-destructive" aria-hidden="true">
            {" "}
            *
          </span>
        </label>
        <input
          id="email"
          name="email"
          type="text"
          inputMode="email"
          autoComplete="email"
          required
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <PasswordField
          name="password"
          label="Mot de passe"
          autoComplete="new-password"
          required
          onChange={setPassword}
        />

      <PasswordField
          name="confirmPassword"
          label="Confirmation du mot de passe"
          autoComplete="new-password"
          required
          onChange={setConfirmPassword}
        />

      <PasswordRequirements
        password={password}
        confirmPassword={confirmPassword}
      />

      {recaptchaSiteKey ? (
        <>
          <RecaptchaField
            siteKey={recaptchaSiteKey}
            onTokenChange={setRecaptchaToken}
          />
          <input
            type="hidden"
            name="recaptchaToken"
            value={recaptchaToken ?? ""}
            readOnly
          />
        </>
      ) : null}

      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending || !canSubmit}>
        {pending ? "Création du compte…" : "Créer mon compte"}
      </Button>
    </form>
  );
}
