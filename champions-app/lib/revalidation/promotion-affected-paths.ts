import { revalidatePath } from "next/cache";

type RevalidatePromotionAffectedPathsOptions = {
  dictationId?: string;
};

export function revalidatePromotionAffectedPaths(
  studentId: string,
  options: RevalidatePromotionAffectedPathsOptions = {}
): void {
  const { dictationId } = options;

  if (dictationId) {
    revalidatePath(`/dictations/${dictationId}`);
  }

  revalidatePath(`/students/${studentId}`);
  revalidatePath("/students", "layout");
  revalidatePath("/dictations");
  revalidatePath("/alerts");
  revalidatePath("/alerts", "layout");
}
