"use server";

import { isAuthRateLimitAllowed } from "@/lib/services/auth-rate-limit";
import { requestPasswordReset } from "@/lib/services/password-reset";

export type ForgotPasswordActionState = {
  submitted: boolean;
};

export async function forgotPasswordAction(
  _prevState: ForgotPasswordActionState,
  formData: FormData
): Promise<ForgotPasswordActionState> {
  const email = String(formData.get("email") ?? "");

  if (await isAuthRateLimitAllowed("password-reset")) {
    try {
      await requestPasswordReset(email);
    } catch (error) {
      console.error("XXX", "[forgot-password] request failed", error);
    }
  }

  return { submitted: true };
}
