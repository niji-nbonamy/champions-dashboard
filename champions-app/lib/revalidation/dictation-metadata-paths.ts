import { revalidatePath } from "next/cache";

export function revalidateDictationMetadataPaths(
  dictationId: string,
  studentIds: string[] = []
): void {
  revalidatePath("/dictations");
  revalidatePath(`/dictations/${dictationId}`);
  revalidatePath(`/dictations/${dictationId}/mobile`);
  revalidatePath(`/dictations/${dictationId}/mobile/summary`);

  const uniqueStudentIds = [...new Set(studentIds)];
  for (const studentId of uniqueStudentIds) {
    revalidatePath(`/students/${studentId}`);
    revalidatePath(`/students/${studentId}/present`);
  }
}
