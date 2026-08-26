"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { STUDENT_ADD_SUCCESS_MESSAGE } from "@/lib/domain/student-display-name";
import {
  addStudent,
  AddStudentError,
} from "@/lib/services/add-student";
import { getTeacherClass } from "@/lib/services/get-teacher-class";

export type AddStudentActionState = {
  error: string | null;
  success: string | null;
};

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

  try {
    await addStudent(teacherClass.id, rawDisplayName);
    revalidatePath("/students");
    revalidatePath("/config");
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
