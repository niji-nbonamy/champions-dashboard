import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getTeacherClass } from "@/lib/services/get-teacher-class";

import { ClassForm } from "./class-form";

export default async function OnboardingClassPage() {
  const session = await auth();
  const teacherId = session?.user?.id;

  if (!teacherId) {
    redirect("/login");
  }

  const existingClass = await getTeacherClass(teacherId);
  if (existingClass) {
    redirect("/dictations");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <div className="flex w-full max-w-sm flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Créer votre classe
        </h1>
        <p className="text-sm text-muted-foreground">
          Indiquez l&apos;année scolaire pour commencer (ex. 2025-2026).
        </p>
      </div>
      <ClassForm />
    </main>
  );
}
