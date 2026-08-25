"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";

import { REGISTRATION_ERROR_MESSAGE } from "@/lib/domain/registration";
import { registerTeacher } from "@/lib/services/register-teacher";

export type RegisterActionState = {
  error: string | null;
};

export async function registerAction(
  _prevState: RegisterActionState,
  formData: FormData
): Promise<RegisterActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

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
