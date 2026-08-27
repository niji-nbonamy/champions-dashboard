import { revalidatePath } from "next/cache";

export const WIZARD_AFFECTED_PATHS = [
  "/onboarding/year-start",
  "/dictations",
  "/students",
  "/config",
] as const;

export function revalidateWizardAffectedPaths(): void {
  for (const path of WIZARD_AFFECTED_PATHS) {
    revalidatePath(path);
  }
}
