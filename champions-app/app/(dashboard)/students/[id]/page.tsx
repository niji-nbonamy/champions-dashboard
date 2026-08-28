import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { CurvePlaceholder } from "@/components/dossier/curve-placeholder";
import { DictationHistoryTable } from "@/components/dossier/dictation-history-table";
import {
  DOSSIER_CONTENT_CONTAINER_CLASS,
  DOSSIER_CURVE_TABLE_GRID_CLASS,
} from "@/components/dossier/dossier-layout";
import { GlobalSuccessCurve } from "@/components/dossier/global-success-curve";
import { LevelBadge } from "@/components/ui/level-badge";
import { isChampionsLevel } from "@/lib/domain/champions-level";
import { isValidUuidV4 } from "@/lib/domain/dictation";
import { toCurvePoints } from "@/lib/domain/dossier-curve";
import { getClassStudent } from "@/lib/services/get-class-student";
import { getStudentDictationHistory } from "@/lib/services/get-student-dictation-history";
import { getTeacherClass } from "@/lib/services/get-teacher-class";

type StudentDossierPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function StudentDossierPage({
  params,
}: StudentDossierPageProps) {
  const session = await auth();
  const teacherId = session?.user?.id;

  if (!teacherId) {
    redirect("/login");
  }

  const teacherClass = await getTeacherClass(teacherId);
  if (!teacherClass) {
    redirect("/onboarding/class");
  }

  const { id } = await params;

  if (!isValidUuidV4(id)) {
    notFound();
  }

  const student = await getClassStudent(teacherClass.id, id);

  if (!student) {
    notFound();
  }

  const history = await getStudentDictationHistory(teacherClass.id, id);
  const hasHistory = history.length > 0;
  const curvePoints = toCurvePoints(history);

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <Link
          href="/students"
          className="text-sm text-muted-foreground underline underline-offset-4"
        >
          Retour aux élèves
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-display">{student.displayName}</h1>
          {student.level && isChampionsLevel(student.level) ? (
            <LevelBadge level={student.level} />
          ) : null}
          {student.archived ? (
            <span className="text-sm text-muted-foreground">Archivé</span>
          ) : null}
        </div>
      </div>

      <div className={DOSSIER_CONTENT_CONTAINER_CLASS}>
        {hasHistory ? (
          <div className={DOSSIER_CURVE_TABLE_GRID_CLASS}>
            <section aria-label="Courbe de réussite globale">
              <GlobalSuccessCurve points={curvePoints} />
            </section>
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-medium">Historique des dictées</h2>
              <DictationHistoryTable entries={history} />
            </section>
          </div>
        ) : (
          <>
            <CurvePlaceholder />
            <p className="mt-6 text-sm text-muted-foreground" role="status">
              Aucune dictée enregistrée.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
