"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";

import {
  passwordsMatch,
  REGISTRATION_ERROR_MESSAGE,
} from "@/lib/domain/registration";
import { registerTeacher } from "@/lib/services/register-teacher";
import {
  isRecaptchaRequired,
  verifyRecaptchaToken,
} from "@/lib/services/recaptcha-verify";

export type RegisterActionState = {
  error: string | null;
};

export async function registerAction(
  _prevState: RegisterActionState,
  formData: FormData
): Promise<RegisterActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const recaptchaToken = String(formData.get("recaptchaToken") ?? "");

  if (!passwordsMatch(password, confirmPassword)) {
    return { error: REGISTRATION_ERROR_MESSAGE };
  }

  if (isRecaptchaRequired()) {
    const recaptchaValid = await verifyRecaptchaToken(
      recaptchaToken.length > 0 ? recaptchaToken : null
    );

    if (!recaptchaValid) {
      return { error: REGISTRATION_ERROR_MESSAGE };
    }
  }

  try {
    await registerTeacher(email, password);
    redirect("/login?registered=1");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    return { error: REGISTRATION_ERROR_MESSAGE };
  }
}
