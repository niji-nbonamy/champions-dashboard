"use client";

import { useActionState, useMemo, useState } from "react";

import { PasswordField } from "@/components/auth/password-field";
import { PasswordRequirements } from "@/components/auth/password-requirements";
import { Button } from "@/components/ui/button";
import {
  getPasswordRequirementStatus,
  isValidRegistrationPassword,
  passwordsMatch,
} from "@/lib/domain/registration";

import {
  resetPasswordAction,
  type ResetPasswordActionState,
} from "./actions";

const initialState: ResetPasswordActionState = { error: null };

type ResetPasswordFormProps = {
  token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    initialState
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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
    passwordsMatch(password, confirmPassword);

  return (
    <form
      action={formAction}
      noValidate
      className="flex w-full max-w-sm flex-col gap-4"
    >
      <input type="hidden" name="token" value={token} readOnly />

      <PasswordField
        name="password"
        label="Nouveau mot de passe"
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

      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending || !canSubmit}>
        {pending ? "Mise à jour…" : "Réinitialiser le mot de passe"}
      </Button>
    </form>
  );
}
