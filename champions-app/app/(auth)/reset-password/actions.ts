"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";

import { RESET_INVALID_TOKEN_MESSAGE, RESET_PASSWORD_ERROR_MESSAGE } from "@/lib/domain/password-reset";
import { passwordsMatch } from "@/lib/domain/registration";
import {
  completePasswordReset,
  findValidPasswordResetToken,
  PasswordResetFailedError,
} from "@/lib/services/password-reset";

export type ResetPasswordActionState = {
  error: string | null;
};

export async function resetPasswordAction(
  _prevState: ResetPasswordActionState,
  formData: FormData
): Promise<ResetPasswordActionState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!passwordsMatch(password, confirmPassword)) {
    return { error: RESET_PASSWORD_ERROR_MESSAGE };
  }

  try {
    await completePasswordReset(token, password, confirmPassword);
    redirect("/login?passwordUpdated=1");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    if (error instanceof PasswordResetFailedError) {
      let stillValid = null;

      try {
        stillValid = await findValidPasswordResetToken(token);
      } catch {
        return { error: RESET_PASSWORD_ERROR_MESSAGE };
      }

      return {
        error: stillValid ? error.message : RESET_INVALID_TOKEN_MESSAGE,
      };
    }

    return { error: RESET_PASSWORD_ERROR_MESSAGE };
  }
}
