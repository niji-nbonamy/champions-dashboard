"use client";

import { useActionState, useState } from "react";

import { RecaptchaField } from "@/components/auth/recaptcha-field";
import { Button } from "@/components/ui/button";
import { FORGOT_PASSWORD_SUCCESS_MESSAGE } from "@/lib/domain/password-reset";

import {
  forgotPasswordAction,
  type ForgotPasswordActionState,
} from "./actions";

const initialState: ForgotPasswordActionState = { submitted: false };

type ForgotPasswordFormProps = {
  initialSubmitted?: boolean;
  recaptchaSiteKey: string | null;
  recaptchaRequired: boolean;
};

export function ForgotPasswordForm({
  initialSubmitted = false,
  recaptchaSiteKey,
  recaptchaRequired,
}: ForgotPasswordFormProps) {
  const [state, formAction, pending] = useActionState(
    forgotPasswordAction,
    initialSubmitted ? { submitted: true } : initialState
  );
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  const canSubmit = !recaptchaRequired || Boolean(recaptchaToken);

  if (state.submitted) {
    return (
      <p
        className="w-full max-w-sm rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-foreground"
        role="status"
      >
        {FORGOT_PASSWORD_SUCCESS_MESSAGE}
      </p>
    );
  }

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
          type="email"
          inputMode="email"
          autoComplete="email"
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

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

      <Button type="submit" disabled={pending || !canSubmit}>
        {pending ? "Envoi…" : "Envoyer le lien"}
      </Button>
    </form>
  );
}
