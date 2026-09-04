import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { StudentSheetPresentationLink } from "@/components/student-sheet/student-sheet-presentation-link";
import { SpeechTherapyToggle } from "@/components/students/speech-therapy-toggle";
import { StudentNameWithSpeechTherapy } from "@/components/students/student-name-with-speech-therapy";
import { PresentationReturnFocus } from "@/components/student-sheet/presentation-return-focus";
import { LevelHistoryList } from "@/components/student-sheet/level-history-list";
import { CurvePlaceholder } from "@/components/student-sheet/curve-placeholder";
import { DictationHistoryTable } from "@/components/student-sheet/dictation-history-table";
import {
  STUDENT_SHEET_CONTENT_CONTAINER_CLASS,
  STUDENT_SHEET_CURVE_TABLE_LAYOUT_CLASS,
} from "@/components/student-sheet/student-sheet-layout";
import { GlobalSuccessCurve } from "@/components/student-sheet/global-success-curve";
import { LevelBadge } from "@/components/ui/level-badge";
import { PromotionBanner } from "@/components/promotion/promotion-banner";
import { isChampionsLevel } from "@/lib/domain/champions-level";
import { isValidUuidV4 } from "@/lib/domain/dictation";
import { STUDENT_SPEECH_THERAPY_LABEL } from "@/lib/domain/student-speech-therapy";
import { toCurvePoints } from "@/lib/domain/student-sheet-curve";
import { canArchiveStudents } from "@/lib/domain/year-start-readiness";
import { getClassStudent } from "@/lib/services/get-class-student";
import { getStudentDictationHistory } from "@/lib/services/get-student-dictation-history";
import { getStudentLevelHistory } from "@/lib/services/get-student-level-history";
import { getYearStartWizardStatus } from "@/lib/services/get-year-start-wizard-status";
import { listPendingPromotionsForStudents } from "@/lib/services/list-pending-promotions";
import { getTeacherClass } from "@/lib/services/get-teacher-class";

import { ArchiveStudentButton } from "../archive-student-button";
import { LevelDotPicker } from "../level-dot-picker";

type StudentSheetPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function StudentSheetPage({
  params,
}: StudentSheetPageProps) {
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

  const [history, wizardStatus] = await Promise.all([
    getStudentDictationHistory(teacherClass.id, id),
    getYearStartWizardStatus(teacherClass.id),
  ]);
  const showArchiveAction =
    !student.archived && canArchiveStudents(wizardStatus);
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
      <PresentationReturnFocus />
      <div className="flex flex-col gap-1">
        <Link
          href="/students"
          className="text-sm text-muted-foreground underline underline-offset-4"
        >
          Retour aux élèves
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="text-display">
            <StudentNameWithSpeechTherapy
              displayName={student.displayName}
              hasSpeechTherapy={student.hasSpeechTherapy}
            />
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <StudentSheetPresentationLink studentId={id} />
            {showArchiveAction ? (
              <ArchiveStudentButton
                studentId={id}
                displayName={student.displayName}
                filter="active"
              />
            ) : null}
          </div>
        </div>
        {student.level && isChampionsLevel(student.level) ? (
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start">
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
            <div
              aria-hidden="true"
              className="border-border border-t sm:h-auto sm:w-px sm:self-stretch sm:border-t-0 sm:border-l"
            />
            <div className="flex flex-col gap-2 pt-4 sm:pt-0 sm:pl-6">
              <span className="text-sm font-medium text-muted-foreground">
                {STUDENT_SPEECH_THERAPY_LABEL}
              </span>
              {student.archived ? (
                <span className="text-sm text-muted-foreground">
                  {student.hasSpeechTherapy ? "Oui" : "Non"}
                </span>
              ) : (
                <SpeechTherapyToggle
                  studentId={id}
                  hasSpeechTherapy={student.hasSpeechTherapy}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="mt-2 flex flex-col gap-2">
            {student.archived ? (
              <span className="text-sm text-muted-foreground">Archivé</span>
            ) : null}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                {STUDENT_SPEECH_THERAPY_LABEL}
              </span>
              {student.archived ? (
                <span className="text-sm text-muted-foreground">
                  {student.hasSpeechTherapy ? "Oui" : "Non"}
                </span>
              ) : (
                <SpeechTherapyToggle
                  studentId={id}
                  hasSpeechTherapy={student.hasSpeechTherapy}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {pendingPromotion ? (
        <PromotionBanner studentId={id} targetLevel={pendingPromotion.targetLevel} />
      ) : null}

      <div className={STUDENT_SHEET_CONTENT_CONTAINER_CLASS}>
        {hasHistory ? (
          <div className={STUDENT_SHEET_CURVE_TABLE_LAYOUT_CLASS}>
            <section
              aria-labelledby="global-curve-heading"
              className="flex flex-col gap-3"
            >
              <h2
                id="global-curve-heading"
                className="text-lg font-medium"
              >
                Courbe de réussite globale
              </h2>
              <GlobalSuccessCurve
                points={curvePoints}
                className="[&_svg]:h-56 lg:[&_svg]:h-64"
              />
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
