"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import {
  CLASS_ONBOARDING_ERROR_MESSAGE,
  getSchoolYearLabelValidationError,
} from "@/lib/domain/class";
import {
  ClassCreationFailedError,
  createClass,
} from "@/lib/services/create-class";
import { getTeacherClass } from "@/lib/services/get-teacher-class";

export type CreateClassActionState = {
  error: string | null;
};

export async function createClassAction(
  _prevState: CreateClassActionState,
  formData: FormData
): Promise<CreateClassActionState> {
  const session = await auth();
  const teacherId = session?.user?.id;

  if (!teacherId) {
    redirect("/login");
  }

  const schoolYearLabelRaw = formData.get("school_year_label");
  if (schoolYearLabelRaw !== null && typeof schoolYearLabelRaw !== "string") {
    return { error: CLASS_ONBOARDING_ERROR_MESSAGE };
  }

  const schoolYearLabel =
    typeof schoolYearLabelRaw === "string" ? schoolYearLabelRaw : "";
  const validationError = getSchoolYearLabelValidationError(schoolYearLabel);

  if (validationError) {
    return { error: validationError };
  }

  try {
    await createClass(teacherId, schoolYearLabel);
    redirect("/dictations");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    if (error instanceof ClassCreationFailedError) {
      const existing = await getTeacherClass(teacherId);
      if (existing) {
        redirect("/dictations");
      }

      return { error: CLASS_ONBOARDING_ERROR_MESSAGE };
    }

    return { error: CLASS_ONBOARDING_ERROR_MESSAGE };
  }
}
