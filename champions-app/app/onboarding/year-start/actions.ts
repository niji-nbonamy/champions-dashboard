"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import {
  completeYearStartWizard,
  CompleteYearStartWizardError,
} from "@/lib/services/complete-year-start-wizard";
import { confirmYearStartRoster } from "@/lib/services/confirm-year-start-roster";
import { getTeacherClass } from "@/lib/services/get-teacher-class";
import { getYearStartWizardStatus } from "@/lib/services/get-year-start-wizard-status";
import { revalidateWizardAffectedPaths } from "@/lib/revalidation/wizard-affected-paths";
import {
  removeActiveStudent,
  RemoveActiveStudentError,
} from "@/lib/services/remove-active-student";

export type RemoveStudentFromWizardActionState = {
  error: string | null;
};

export type CompleteYearStartWizardActionState = {
  error: string | null;
};

async function requireWizardClassContext() {
  const session = await auth();
  const teacherId = session?.user?.id;

  if (!teacherId) {
    redirect("/login");
  }

  const teacherClass = await getTeacherClass(teacherId);
  if (!teacherClass) {
    redirect("/onboarding/class");
  }

  const status = await getYearStartWizardStatus(teacherClass.id);

  if (status.completed) {
    redirect("/dictations");
  }

  return { teacherClass, status };
}

export async function confirmRosterStepAction(): Promise<void> {
  const { teacherClass, status } = await requireWizardClassContext();

  if (status.activeStudentCount === 0) {
    redirect("/onboarding/year-start?step=1");
  }

  await confirmYearStartRoster(teacherClass.id);
  revalidateWizardAffectedPaths();
  redirect("/onboarding/year-start?step=2");
}

export async function confirmLevelsStepAction(): Promise<void> {
  const { status } = await requireWizardClassContext();

  if (status.activeStudentCount === 0) {
    redirect("/onboarding/year-start?step=1");
  }

  if (status.unassignedCount > 0) {
    redirect("/onboarding/year-start?step=2");
  }

  redirect("/onboarding/year-start?step=3");
}

export async function removeStudentFromWizardAction(
  _prevState: RemoveStudentFromWizardActionState,
  formData: FormData
): Promise<RemoveStudentFromWizardActionState> {
  const session = await auth();
  const teacherId = session?.user?.id;

  if (!teacherId) {
    redirect("/login");
  }

  const teacherClass = await getTeacherClass(teacherId);
  if (!teacherClass) {
    redirect("/onboarding/class");
  }

  const studentIdField = formData.get("student_id");
  const studentId =
    typeof studentIdField === "string" ? studentIdField.trim() : "";

  if (!studentId) {
    return { error: "Élève introuvable." };
  }

  try {
    await removeActiveStudent(teacherClass.id, studentId);
    revalidateWizardAffectedPaths();
    return { error: null };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    if (error instanceof RemoveActiveStudentError) {
      return { error: error.message };
    }

    return { error: "Retrait impossible. Réessayez." };
  }
}

export async function completeYearStartWizardAction(
  _prevState: CompleteYearStartWizardActionState
): Promise<CompleteYearStartWizardActionState> {
  void _prevState;
  const session = await auth();
  const teacherId = session?.user?.id;

  if (!teacherId) {
    redirect("/login");
  }

  const teacherClass = await getTeacherClass(teacherId);
  if (!teacherClass) {
    redirect("/onboarding/class");
  }

  const status = await getYearStartWizardStatus(teacherClass.id);

  if (status.completed) {
    redirect("/dictations");
  }

  if (
    status.activeStudentCount === 0 ||
    status.unassignedCount > 0 ||
    status.matrixRowCount === 0
  ) {
    if (status.activeStudentCount === 0) {
      return {
        error:
          "Ajoutez au moins un élève avant de terminer la configuration.",
      };
    }

    if (status.unassignedCount > 0) {
      return {
        error:
          "Assignez un niveau à chaque élève avant de terminer la configuration.",
      };
    }

    return {
      error: "Enregistrez au moins une dictée complète dans la matrice.",
    };
  }

  try {
    await completeYearStartWizard(teacherClass.id);
    revalidateWizardAffectedPaths();
    redirect("/dictations");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    if (error instanceof CompleteYearStartWizardError) {
      return { error: error.message };
    }

    return { error: "Finalisation impossible. Réessayez." };
  }
}
