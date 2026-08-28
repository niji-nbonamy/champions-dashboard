import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { LevelHistoryList } from "@/components/dossier/level-history-list";
import { CurvePlaceholder } from "@/components/dossier/curve-placeholder";
import { DictationHistoryTable } from "@/components/dossier/dictation-history-table";
import {
  DOSSIER_CONTENT_CONTAINER_CLASS,
  DOSSIER_CURVE_TABLE_GRID_CLASS,
} from "@/components/dossier/dossier-layout";
import { GlobalSuccessCurve } from "@/components/dossier/global-success-curve";
import { LevelBadge } from "@/components/ui/level-badge";
import { PromotionBanner } from "@/components/promotion/promotion-banner";
import { isChampionsLevel } from "@/lib/domain/champions-level";
import { isValidUuidV4 } from "@/lib/domain/dictation";
import { toCurvePoints } from "@/lib/domain/dossier-curve";
import { getClassStudent } from "@/lib/services/get-class-student";
import { getStudentDictationHistory } from "@/lib/services/get-student-dictation-history";
import { getStudentLevelHistory } from "@/lib/services/get-student-level-history";
import { listPendingPromotionsForStudents } from "@/lib/services/list-pending-promotions";
import { getTeacherClass } from "@/lib/services/get-teacher-class";

import { LevelDotPicker } from "../level-dot-picker";

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
  let levelHistory: Awaited<ReturnType<typeof getStudentLevelHistory>> = [];

  try {
    levelHistory = await getStudentLevelHistory(teacherClass.id, id);
  } catch {
    levelHistory = [];
  }

  const hasHistory = history.length > 0;
  const curvePoints = toCurvePoints(history);
  const pendingPromotions = student.archived
    ? {}
    : await listPendingPromotionsForStudents(teacherClass.id, [id]);
  const pendingPromotion = pendingPromotions[id] ?? null;

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <Link
          href="/students"
          className="text-sm text-muted-foreground underline underline-offset-4"
        >
          Retour aux élèves
        </Link>
        <h1 className="text-display">{student.displayName}</h1>
        {student.level && isChampionsLevel(student.level) ? (
          <div className="mt-2 flex flex-col sm:flex-row sm:items-start">
            <div className="flex flex-col gap-2 pb-4 sm:pb-0 sm:pr-6">
              <span className="text-sm font-medium text-muted-foreground">
                Niveau actuel
              </span>
              <LevelBadge level={student.level} showDot />
            </div>
            <div
              aria-hidden="true"
              className="border-border border-t sm:h-auto sm:w-px sm:self-stretch sm:border-t-0 sm:border-l"
            />
            {student.archived ? (
              <div className="pt-4 sm:pt-0 sm:pl-6">
                <span className="text-sm text-muted-foreground">Archivé</span>
              </div>
            ) : (
              <div className="pt-4 sm:pt-0 sm:pl-6">
                <LevelDotPicker
                  studentId={id}
                  mode="override"
                  currentLevel={student.level}
                />
              </div>
            )}
          </div>
        ) : student.archived ? (
          <span className="mt-2 text-sm text-muted-foreground">Archivé</span>
        ) : null}
      </div>

      {pendingPromotion ? (
        <PromotionBanner studentId={id} targetLevel={pendingPromotion.targetLevel} />
      ) : null}

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

        <section className="mt-6 flex flex-col gap-3">
          <h2 className="text-lg font-medium">Historique des niveaux</h2>
          <LevelHistoryList entries={levelHistory} />
        </section>
      </div>
    </main>
  );
}
