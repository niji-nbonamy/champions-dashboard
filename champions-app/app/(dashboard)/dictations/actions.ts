"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import {
  canCreateDictation,
  getCreateDictationBlockedMessage,
} from "@/lib/domain/dictation-readiness";
import { getTeacherClass } from "@/lib/services/get-teacher-class";
import { getYearStartWizardStatus } from "@/lib/services/get-year-start-wizard-status";
import {
  createDictation,
  CreateDictationError,
} from "@/lib/services/create-dictation";
import {
  saveDictation,
  DictationSaveError,
  DICTATION_SAVE_GENERIC_ERROR,
} from "@/lib/services/dictation-save";
import {
  refuseStudentPromotion,
  PROMOTION_REFUSE_GENERIC_ERROR,
} from "@/lib/services/refuse-student-promotion";
import {
  validateStudentPromotion,
  StudentPromotionError,
  PendingPromotionNotFoundError,
  PROMOTION_VALIDATE_GENERIC_ERROR,
} from "@/lib/services/validate-student-promotion";
import type { ChampionsErrorCategoryLetter } from "@/lib/domain/error-categories";

export type CreateDictationActionState = {
  error: string | null;
};

const CREATE_DICTATION_GENERIC_ERROR = "Création impossible. Réessayez.";

export type SaveDictationActionResult = {
  error: string | null;
};

export type PromotionActionResult = {
  error: string | null;
};

export type SaveDictationCounts = Record<
  string,
  Record<ChampionsErrorCategoryLetter, number>
>;

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
    return { error: getCreateDictationBlockedMessage(wizardStatus) };
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

export async function saveDictationAction(
  dictationId: string,
  counts: SaveDictationCounts
): Promise<SaveDictationActionResult> {
  const session = await auth();
  const teacherId = session?.user?.id;

  if (!teacherId) {
    redirect("/login");
  }

  const teacherClass = await getTeacherClass(teacherId);
  if (!teacherClass) {
    redirect("/onboarding/class");
  }

  try {
    await saveDictation(teacherClass.id, dictationId, counts);
    revalidatePath(`/dictations/${dictationId}`);
    revalidatePath("/dictations");
    return { error: null };
  } catch (error) {
    if (error instanceof DictationSaveError) {
      return { error: error.message };
    }

    return { error: DICTATION_SAVE_GENERIC_ERROR };
  }
}

export async function validatePromotionAction(
  studentId: string,
  dictationId: string
): Promise<PromotionActionResult> {
  if (!studentId?.trim()) {
    return { error: PROMOTION_VALIDATE_GENERIC_ERROR };
  }

  const session = await auth();
  const teacherId = session?.user?.id;

  if (!teacherId) {
    redirect("/login");
  }

  const teacherClass = await getTeacherClass(teacherId);
  if (!teacherClass) {
    redirect("/onboarding/class");
  }

  try {
    await validateStudentPromotion(teacherClass.id, studentId);
    revalidatePath(`/dictations/${dictationId}`);
    revalidatePath("/dictations");
    revalidatePath("/students");
    return { error: null };
  } catch (error) {
    if (error instanceof PendingPromotionNotFoundError) {
      revalidatePath(`/dictations/${dictationId}`);
      revalidatePath("/dictations");
      revalidatePath("/students");
      return { error: null };
    }

    if (error instanceof StudentPromotionError) {
      return { error: PROMOTION_VALIDATE_GENERIC_ERROR };
    }

    return { error: PROMOTION_VALIDATE_GENERIC_ERROR };
  }
}

export async function refusePromotionAction(
  studentId: string,
  dictationId: string
): Promise<PromotionActionResult> {
  if (!studentId?.trim()) {
    return { error: PROMOTION_REFUSE_GENERIC_ERROR };
  }

  const session = await auth();
  const teacherId = session?.user?.id;

  if (!teacherId) {
    redirect("/login");
  }

  const teacherClass = await getTeacherClass(teacherId);
  if (!teacherClass) {
    redirect("/onboarding/class");
  }

  try {
    await refuseStudentPromotion(teacherClass.id, studentId);
    revalidatePath(`/dictations/${dictationId}`);
    revalidatePath("/dictations");
    revalidatePath("/students");
    return { error: null };
  } catch (error) {
    if (error instanceof PendingPromotionNotFoundError) {
      revalidatePath(`/dictations/${dictationId}`);
      revalidatePath("/dictations");
      revalidatePath("/students");
      return { error: null };
    }

    if (error instanceof StudentPromotionError) {
      return { error: PROMOTION_REFUSE_GENERIC_ERROR };
    }

    return { error: PROMOTION_REFUSE_GENERIC_ERROR };
  }
}
