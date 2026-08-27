"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { revalidateWizardAffectedPaths } from "@/lib/revalidation/wizard-affected-paths";
import {
  getSchoolYearLabelValidationError,
  validateSchoolYearLabel,
} from "@/lib/domain/class";
import {
  parseWordCountMatrixRowsFromFormData,
  WORD_COUNT_MATRIX_GENERIC_ERROR,
  WORD_COUNT_MATRIX_SAVE_SUCCESS_MESSAGE,
} from "@/lib/domain/word-count-matrix";
import {
  importRosterFromCsv,
  RosterImportError,
  RosterNotEmptyError,
} from "@/lib/services/import-roster-csv";
import { getTeacherClass } from "@/lib/services/get-teacher-class";
import {
  replaceWordCountMatrix,
  WordCountMatrixValidationError,
} from "@/lib/services/replace-word-count-matrix";
import {
  resetClassYear,
  RESET_CLASS_YEAR_GENERIC_ERROR,
  ResetClassYearError,
} from "@/lib/services/reset-class-year";
import {
  ROSTER_CSV_MAX_FILE_BYTES,
  ROSTER_CSV_MISSING_FILE_ERROR,
  ROSTER_CSV_FILE_TOO_LARGE_ERROR,
} from "@/lib/domain/roster-import";

export type ImportRosterCsvActionState = {
  error: string | null;
  success: string | null;
};

export type SaveWordCountMatrixActionState = {
  error: string | null;
  success: string | null;
  errorRowIndex?: number | null;
  errorField?: string | null;
};

export type ResetClassYearActionState = {
  error: string | null;
};

export async function saveWordCountMatrixAction(
  _prevState: SaveWordCountMatrixActionState,
  formData: FormData
): Promise<SaveWordCountMatrixActionState> {
  const session = await auth();
  const teacherId = session?.user?.id;

  if (!teacherId) {
    redirect("/login");
  }

  const teacherClass = await getTeacherClass(teacherId);
  if (!teacherClass) {
    redirect("/onboarding/class");
  }

  const rawRows = parseWordCountMatrixRowsFromFormData(formData);

  try {
    await replaceWordCountMatrix(teacherClass.id, rawRows);
    revalidatePath("/config");
    revalidatePath("/onboarding/year-start");
    return {
      error: null,
      success: WORD_COUNT_MATRIX_SAVE_SUCCESS_MESSAGE,
      errorRowIndex: null,
      errorField: null,
    };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    if (error instanceof WordCountMatrixValidationError) {
      return {
        error: error.message,
        success: null,
        errorRowIndex: error.rowIndex ?? null,
        errorField: error.field ?? null,
      };
    }

    return {
      error: WORD_COUNT_MATRIX_GENERIC_ERROR,
      success: null,
      errorRowIndex: null,
      errorField: null,
    };
  }
}

export async function importRosterCsvAction(
  _prevState: ImportRosterCsvActionState,
  formData: FormData
): Promise<ImportRosterCsvActionState> {
  const session = await auth();
  const teacherId = session?.user?.id;

  if (!teacherId) {
    redirect("/login");
  }

  const teacherClass = await getTeacherClass(teacherId);
  if (!teacherClass) {
    redirect("/onboarding/class");
  }

  const fileField = formData.get("csv_file");
  if (!(fileField instanceof File) || fileField.size === 0) {
    return { error: ROSTER_CSV_MISSING_FILE_ERROR, success: null };
  }

  if (fileField.size > ROSTER_CSV_MAX_FILE_BYTES) {
    return {
      error: ROSTER_CSV_FILE_TOO_LARGE_ERROR,
      success: null,
    };
  }

  try {
    const buffer = await fileField.arrayBuffer();
    const fileBytes = new Uint8Array(buffer);
    await importRosterFromCsv(teacherClass.id, fileBytes);
    revalidatePath("/config");
    revalidatePath("/onboarding/year-start");
    redirect("/onboarding/year-start?step=1");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    if (error instanceof RosterNotEmptyError || error instanceof RosterImportError) {
      return { error: error.message, success: null };
    }

    return {
      error: "Import impossible. Réessayez.",
      success: null,
    };
  }
}

export async function resetClassYearAction(
  _prevState: ResetClassYearActionState,
  formData: FormData
): Promise<ResetClassYearActionState> {
  const session = await auth();
  const teacherId = session?.user?.id;

  if (!teacherId) {
    redirect("/login");
  }

  const teacherClass = await getTeacherClass(teacherId);
  if (!teacherClass) {
    redirect("/onboarding/class");
  }

  const schoolYearLabelField = formData.get("school_year_label");
  const schoolYearLabelRaw =
    typeof schoolYearLabelField === "string" ? schoolYearLabelField : "";

  let newSchoolYearLabel: string | null = null;

  if (schoolYearLabelRaw.length > 0) {
    const validationError = getSchoolYearLabelValidationError(schoolYearLabelRaw);
    if (validationError) {
      return { error: validationError };
    }

    newSchoolYearLabel = validateSchoolYearLabel(schoolYearLabelRaw);
  }

  try {
    await resetClassYear(teacherClass.id, newSchoolYearLabel);
    revalidateWizardAffectedPaths();
    redirect("/onboarding/year-start?step=1");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    if (error instanceof ResetClassYearError) {
      return { error: error.message };
    }

    return { error: RESET_CLASS_YEAR_GENERIC_ERROR };
  }
}
