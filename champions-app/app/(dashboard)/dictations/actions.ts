"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { canCreateDictation } from "@/lib/domain/dictation-readiness";
import { getTeacherClass } from "@/lib/services/get-teacher-class";
import { getYearStartWizardStatus } from "@/lib/services/get-year-start-wizard-status";
import {
  createDictation,
  CreateDictationError,
} from "@/lib/services/create-dictation";

export type CreateDictationActionState = {
  error: string | null;
};

const CREATE_DICTATION_GENERIC_ERROR = "Création impossible. Réessayez.";

export async function createDictationAction(
  _prevState: CreateDictationActionState,
  formData: FormData
): Promise<CreateDictationActionState> {
  const session = await auth();
  const teacherId = session?.user?.id;

  if (!teacherId) {
    redirect("/login");
  }

  const teacherClass = await getTeacherClass(teacherId);
  if (!teacherClass) {
    redirect("/onboarding/class");
  }

  const labelField = formData.get("label");
  const dateField = formData.get("dictation_date");
  const label = typeof labelField === "string" ? labelField : "";
  const dictationDate = typeof dateField === "string" ? dateField : "";

  const wizardStatus = await getYearStartWizardStatus(teacherClass.id);
  if (!canCreateDictation(wizardStatus)) {
    return { error: CREATE_DICTATION_GENERIC_ERROR };
  }

  try {
    const result = await createDictation(teacherClass.id, {
      label,
      dictationDate,
    });
    revalidatePath("/dictations");
    redirect(`/dictations/${result.id}`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    if (error instanceof CreateDictationError) {
      return { error: error.message };
    }

    return { error: CREATE_DICTATION_GENERIC_ERROR };
  }
}
