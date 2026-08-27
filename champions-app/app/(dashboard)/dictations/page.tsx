import Link from "next/link";
import { redirect } from "next/navigation";

import { EmptyRosterPreSetup } from "@/components/dashboard/empty-roster-pre-setup";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { formatDictationDateForDisplay } from "@/lib/domain/dictation";
import { isCompleteMatrixRow } from "@/lib/domain/word-count-matrix";
import {
  canCreateDictation,
  getDisabledCreateDictationTitle,
  MATRIX_MISSING_CTA_LABEL,
  UNLEVELED_STUDENTS_CTA_LABEL,
  UNLEVELED_STUDENTS_MESSAGE,
} from "@/lib/domain/dictation-readiness";
import { getTeacherClass } from "@/lib/services/get-teacher-class";
import { getYearStartWizardStatus } from "@/lib/services/get-year-start-wizard-status";
import { listDictations } from "@/lib/services/list-dictations";
import { listWordCountMatrixRows } from "@/lib/services/list-word-count-matrix-rows";

import { CreateDictationDialog } from "./create-dictation-dialog";

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
  const canCreate = canCreateDictation(wizardStatus);
  const isEmptyRoster = wizardStatus.activeStudentCount === 0;
  const hasUnleveledStudents =
    wizardStatus.activeStudentCount > 0 &&
    wizardStatus.leveledActiveStudentCount === 0;
  const [dictations, matrixRows] = await Promise.all([
    listDictations(teacherClass.id),
    listWordCountMatrixRows(teacherClass.id),
  ]);
  const matrixLabelOptions = matrixRows
    .filter(isCompleteMatrixRow)
    .sort((left, right) =>
      left.dictationLabelKey.localeCompare(right.dictationLabelKey, "fr")
    )
    .map((row) => ({
      value: row.dictationLabelKey,
      label: row.dictationLabelKey,
    }));

  const matrixMissing = wizardStatus.matrixRowCount === 0;

  return (
    <main className="flex flex-1 flex-col gap-4 p-6">
      {isEmptyRoster ? (
        <>
          <h1 className="text-2xl font-semibold tracking-tight">Dictées</h1>
          <EmptyRosterPreSetup showCta ctaHref="/config#liste-eleves" />
          <div className="flex flex-col items-start gap-2">
            <Button
              type="button"
              disabled={!canCreate}
              aria-disabled={!canCreate}
              title={!canCreate ? getDisabledCreateDictationTitle(wizardStatus) : undefined}
            >
              Nouvelle dictée
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight">Dictées</h1>
              {!canCreate || dictations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {canCreate
                    ? "Créez votre première dictée pour commencer la saisie."
                    : hasUnleveledStudents
                      ? UNLEVELED_STUDENTS_MESSAGE
                      : matrixMissing
                        ? "Configurez la matrice sur Config pour créer une dictée."
                        : "Configurez votre année scolaire pour préparer les dictées."}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col items-start gap-2">
              {canCreate ? (
                <CreateDictationDialog matrixLabelOptions={matrixLabelOptions} />
              ) : (
                <Button
                  type="button"
                  disabled
                  aria-disabled
                  title={getDisabledCreateDictationTitle(wizardStatus)}
                >
                  Nouvelle dictée
                </Button>
              )}
              {!canCreate && hasUnleveledStudents ? (
                <p className="text-sm text-muted-foreground">
                  <Link
                    href="/students"
                    className="underline underline-offset-4"
                  >
                    {UNLEVELED_STUDENTS_CTA_LABEL}
                  </Link>{" "}
                  sur la page Élèves.
                </p>
              ) : null}
              {!canCreate && matrixMissing ? (
                <p className="text-sm text-muted-foreground">
                  <Link
                    href="/config#matrice-mots"
                    className="underline underline-offset-4"
                  >
                    {MATRIX_MISSING_CTA_LABEL}
                  </Link>{" "}
                  sur la page Config pour créer une dictée.
                </p>
              ) : null}
            </div>
          </div>

          {dictations.length > 0 ? (
            <section aria-label="Historique des dictées" className="flex flex-col gap-2">
              <h2 className="text-lg font-medium">Historique</h2>
              <ul className="divide-y divide-border rounded-lg border border-border">
                {dictations.map((dictation) => (
                  <li key={dictation.id}>
                    <Link
                      href={`/dictations/${dictation.id}`}
                      className="flex items-center justify-between gap-4 px-4 py-3 text-sm hover:bg-muted/50"
                      aria-label={`${dictation.label}, ${formatDictationDateForDisplay(dictation.dictationDate)}`}
                    >
                      <span className="font-medium">{dictation.label}</span>
                      <span className="text-muted-foreground">
                        {formatDictationDateForDisplay(dictation.dictationDate)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </main>
  );
}
