import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { getTeacherClass } from "@/lib/services/get-teacher-class";
import { getYearStartWizardStatus } from "@/lib/services/get-year-start-wizard-status";

export default async function DictationsPage() {
  const session = await auth();
  const teacherId = session?.user?.id;

  if (!teacherId) {
    redirect("/login");
  }

  const teacherClass = await getTeacherClass(teacherId);
  if (!teacherClass) {
    redirect("/onboarding/class");
  }

  const wizardStatus = await getYearStartWizardStatus(teacherClass.id);
  const canCreateDictation = wizardStatus.completed;

  return (
    <main className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Dictées</h1>
          <p className="text-sm text-muted-foreground">
            {canCreateDictation
              ? "La création de dictées sera disponible dans une prochaine version."
              : "Configurez votre année scolaire pour préparer les dictées."}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2">
          <Button
            type="button"
            disabled={!canCreateDictation}
            aria-disabled={!canCreateDictation}
            title={
              canCreateDictation
                ? "Création de dictée — bientôt disponible"
                : undefined
            }
          >
            Nouvelle dictée
          </Button>
          {!canCreateDictation ? (
            <p className="text-sm text-muted-foreground">
              <Link
                href="/onboarding/year-start"
                className="underline underline-offset-4"
              >
                Terminez la configuration de l&apos;année
              </Link>{" "}
              pour créer une dictée.
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
