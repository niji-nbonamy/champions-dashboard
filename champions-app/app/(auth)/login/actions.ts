"use server";

import { AuthError } from "next-auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { signIn } from "@/auth";
import { LOGIN_ERROR_MESSAGE } from "@/lib/domain/authentication";
import { LOGIN_NOT_ALLOWED_MESSAGE } from "@/lib/domain/beta-access";
import { sanitizeCallbackUrl } from "@/lib/domain/auth-redirect";
import { isValidEmail, normalizeEmail } from "@/lib/domain/registration";
import { isAuthRateLimitAllowed } from "@/lib/services/auth-rate-limit";
import { isEmailAllowed, isEmailAllowlistEnforced } from "@/lib/services/email-allowlist";

export type LoginActionState = {
  error: string | null;
};

export async function loginAction(
  _prevState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const callbackUrl = sanitizeCallbackUrl(
    String(formData.get("callbackUrl") ?? "")
  );

  if (!(await isAuthRateLimitAllowed("login"))) {
    return { error: LOGIN_ERROR_MESSAGE };
  }

  const normalizedEmail = normalizeEmail(email);
  if (
    isEmailAllowlistEnforced() &&
    isValidEmail(email) &&
    !isEmailAllowed(normalizedEmail)
  ) {
    return { error: LOGIN_NOT_ALLOWED_MESSAGE };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    if (error instanceof AuthError) {
      return { error: LOGIN_ERROR_MESSAGE };
    }

    return { error: LOGIN_ERROR_MESSAGE };
  }

  return { error: LOGIN_ERROR_MESSAGE };
}
