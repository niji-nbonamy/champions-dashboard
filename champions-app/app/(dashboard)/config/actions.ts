"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import {
  ROSTER_CSV_MAX_FILE_BYTES,
  ROSTER_CSV_MISSING_FILE_ERROR,
  ROSTER_CSV_FILE_TOO_LARGE_ERROR,
} from "@/lib/domain/roster-import";
import {
  importRosterFromCsv,
  RosterImportError,
  RosterNotEmptyError,
} from "@/lib/services/import-roster-csv";
import { getTeacherClass } from "@/lib/services/get-teacher-class";

export type ImportRosterCsvActionState = {
  error: string | null;
  success: string | null;
};

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
    const result = await importRosterFromCsv(teacherClass.id, fileBytes);
    revalidatePath("/config");
    redirect(`/config?imported=${result.importedCount}`);
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
