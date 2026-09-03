"use server";

import { isAuthRateLimitAllowed } from "@/lib/services/auth-rate-limit";
import { requestPasswordReset } from "@/lib/services/password-reset";
import {
  isRecaptchaRequired,
  verifyRecaptchaToken,
} from "@/lib/services/recaptcha-verify";

export type ForgotPasswordActionState = {
  submitted: boolean;
};

export async function forgotPasswordAction(
  _prevState: ForgotPasswordActionState,
  formData: FormData
): Promise<ForgotPasswordActionState> {
  const email = String(formData.get("email") ?? "");
  const recaptchaToken = String(formData.get("recaptchaToken") ?? "");

  try {
    if (!(await isAuthRateLimitAllowed("password-reset"))) {
      return { submitted: true };
    }

    if (isRecaptchaRequired()) {
      const recaptchaValid = await verifyRecaptchaToken(
        recaptchaToken.length > 0 ? recaptchaToken : null
      );

      if (!recaptchaValid) {
        return { submitted: true };
      }
    }

    await requestPasswordReset(email);
  } catch (error) {
    console.error("XXX", "[forgot-password] request failed", error);
  }

  return { submitted: true };
}
