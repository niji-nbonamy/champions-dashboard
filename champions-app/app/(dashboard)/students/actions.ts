"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ASSIGN_STUDENT_LEVEL_GENERIC_ERROR, parseChampionsLevel } from "@/lib/domain/champions-level";
import {
  STUDENT_ADD_SUCCESS_MESSAGE,
  STUDENT_ARCHIVE_GENERIC_ERROR,
  STUDENT_ARCHIVE_NOT_FOUND_ERROR,
} from "@/lib/domain/student-display-name";
import {
  addStudent,
  AddStudentError,
} from "@/lib/services/add-student";
import { countActiveStudents } from "@/lib/services/count-active-students";
import { getYearStartWizardStatus } from "@/lib/services/get-year-start-wizard-status";
import {
  archiveStudent,
  ArchiveStudentError,
} from "@/lib/services/archive-student";
import {
  assignStudentLevel,
  AssignStudentLevelError,
} from "@/lib/services/assign-student-level";
import { getTeacherClass } from "@/lib/services/get-teacher-class";
import {
  overrideStudentLevel,
  OverrideStudentLevelError,
  OVERRIDE_STUDENT_LEVEL_GENERIC_ERROR,
} from "@/lib/services/override-student-level";
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

export type AddStudentActionState = {
  error: string | null;
  success: string | null;
};

export type AssignStudentLevelActionState = {
  error: string | null;
};

export type OverrideStudentLevelActionState = {
  error: string | null;
  changed: boolean;
};

export type ArchiveStudentActionState = {
  error: string | null;
};

export type DossierPromotionActionResult = {
  error: string | null;
};

type RosterFilterParam = "active" | "archived" | "all";

function revalidateDossierPromotionPaths(studentId: string) {
  revalidatePath(`/students/${studentId}`);
  revalidatePath("/students");
  revalidatePath("/dictations");
}

function parseArchiveFilterParam(
  rawFilter: FormDataEntryValue | null
): RosterFilterParam {
  if (
    typeof rawFilter === "string" &&
    (rawFilter === "archived" || rawFilter === "all")
  ) {
    return rawFilter;
  }

  return "active";
}

export async function addStudentAction(
  _prevState: AddStudentActionState,
  formData: FormData
): Promise<AddStudentActionState> {
  const session = await auth();
  const teacherId = session?.user?.id;

  if (!teacherId) {
    redirect("/login");
  }

  const teacherClass = await getTeacherClass(teacherId);
  if (!teacherClass) {
    redirect("/onboarding/class");
  }

  const displayNameField = formData.get("display_name");
  const rawDisplayName =
    typeof displayNameField === "string" ? displayNameField : "";

  const activeCountBefore = await countActiveStudents(teacherClass.id);

  try {
    await addStudent(teacherClass.id, rawDisplayName);
    revalidatePath("/students");
    revalidatePath("/config");
    revalidatePath("/onboarding/year-start");

    if (activeCountBefore === 0) {
      const wizardStatus = await getYearStartWizardStatus(teacherClass.id);
      if (!wizardStatus.completed) {
        redirect("/onboarding/year-start?step=1");
      }
    }

    return { error: null, success: STUDENT_ADD_SUCCESS_MESSAGE };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    if (error instanceof AddStudentError) {
      return { error: error.message, success: null };
    }

    return {
      error: "Ajout impossible. Réessayez.",
      success: null,
    };
  }
}

export async function assignStudentLevelAction(
  _prevState: AssignStudentLevelActionState,
  formData: FormData
): Promise<AssignStudentLevelActionState> {
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
  const levelField = formData.get("level");
  const studentId =
    typeof studentIdField === "string" ? studentIdField.trim() : "";
  const level = typeof levelField === "string" ? levelField : "";

  if (!studentId) {
    return { error: "Élève introuvable." };
  }

  if (!parseChampionsLevel(level)) {
    return { error: ASSIGN_STUDENT_LEVEL_GENERIC_ERROR };
  }

  try {
    await assignStudentLevel(teacherClass.id, studentId, level);
    revalidatePath("/students", "layout");
    revalidatePath("/onboarding/year-start");
    revalidatePath("/dictations");
    return { error: null };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    if (error instanceof AssignStudentLevelError) {
      return { error: error.message };
    }

    return { error: ASSIGN_STUDENT_LEVEL_GENERIC_ERROR };
  }
}

export async function overrideStudentLevelAction(
  _prevState: OverrideStudentLevelActionState,
  formData: FormData
): Promise<OverrideStudentLevelActionState> {
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
  const levelField = formData.get("level");
  const studentId =
    typeof studentIdField === "string" ? studentIdField.trim() : "";
  const level = typeof levelField === "string" ? levelField : "";

  if (!studentId) {
    return { error: "Élève introuvable.", changed: false };
  }

  if (!parseChampionsLevel(level)) {
    return { error: OVERRIDE_STUDENT_LEVEL_GENERIC_ERROR, changed: false };
  }

  try {
    const result = await overrideStudentLevel(
      teacherClass.id,
      studentId,
      level
    );

    if (result.changed) {
      revalidateDossierPromotionPaths(studentId);
    }

    return { error: null, changed: result.changed };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    if (error instanceof OverrideStudentLevelError) {
      return { error: error.message, changed: false };
    }

    return { error: OVERRIDE_STUDENT_LEVEL_GENERIC_ERROR, changed: false };
  }
}

export async function archiveStudentAction(
  _prevState: ArchiveStudentActionState,
  formData: FormData
): Promise<ArchiveStudentActionState> {
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
  const filter = parseArchiveFilterParam(formData.get("filter"));

  if (!studentId) {
    return { error: STUDENT_ARCHIVE_NOT_FOUND_ERROR };
  }

  try {
    await archiveStudent(teacherClass.id, studentId);
    revalidatePath("/students", "layout");
    revalidatePath("/students");
    revalidatePath("/dictations");
    revalidatePath("/config");
    revalidatePath("/onboarding/year-start");
    const query =
      filter === "active" ? "notice=archived" : `filter=${filter}&notice=archived`;
    redirect(`/students?${query}`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    if (error instanceof ArchiveStudentError) {
      return { error: error.message };
    }

    return { error: STUDENT_ARCHIVE_GENERIC_ERROR };
  }
}

export async function validateDossierPromotionAction(
  studentId: string
): Promise<DossierPromotionActionResult> {
  const normalizedStudentId = studentId?.trim() ?? "";
  if (!normalizedStudentId) {
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
    await validateStudentPromotion(teacherClass.id, normalizedStudentId);
    revalidateDossierPromotionPaths(normalizedStudentId);
    return { error: null };
  } catch (error) {
    if (error instanceof PendingPromotionNotFoundError) {
      revalidateDossierPromotionPaths(normalizedStudentId);
      return { error: null };
    }

    if (error instanceof StudentPromotionError) {
      return { error: PROMOTION_VALIDATE_GENERIC_ERROR };
    }

    return { error: PROMOTION_VALIDATE_GENERIC_ERROR };
  }
}

export async function refuseDossierPromotionAction(
  studentId: string
): Promise<DossierPromotionActionResult> {
  const normalizedStudentId = studentId?.trim() ?? "";
  if (!normalizedStudentId) {
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
    await refuseStudentPromotion(teacherClass.id, normalizedStudentId);
    revalidateDossierPromotionPaths(normalizedStudentId);
    return { error: null };
  } catch (error) {
    if (error instanceof PendingPromotionNotFoundError) {
      revalidateDossierPromotionPaths(normalizedStudentId);
      return { error: null };
    }

    if (error instanceof StudentPromotionError) {
      return { error: PROMOTION_REFUSE_GENERIC_ERROR };
    }

    return { error: PROMOTION_REFUSE_GENERIC_ERROR };
  }
}
