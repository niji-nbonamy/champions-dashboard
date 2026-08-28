import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { ClassGrid } from "@/components/grid/class-grid";
import {
  formatDictationDateForDisplay,
  findMatchingMatrixRow,
  isValidUuidV4,
} from "@/lib/domain/dictation";
import { dbColumnsToCategoryErrors } from "@/lib/domain/error-categories";
import type { ChampionsErrorCategoryLetter } from "@/lib/domain/error-categories";
import { buildWordTotalsByStudentId } from "@/lib/domain/word-count-matrix";
import { getTeacherClass } from "@/lib/services/get-teacher-class";
import { getDictationEntriesByDictationId } from "@/lib/services/get-dictation-entries";
import { getDictationById } from "@/lib/services/list-dictations";
import { listLeveledActiveStudents } from "@/lib/services/list-leveled-active-students";
import { listPendingPromotionsForStudents } from "@/lib/services/list-pending-promotions";
import { listWordCountMatrixRows } from "@/lib/services/list-word-count-matrix-rows";
import type { LeveledActiveStudent } from "@/lib/services/list-leveled-active-students";

type DictationDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function loadPendingPromotionsForGrid(
  classId: string,
  studentIds: string[]
) {
  try {
    return await listPendingPromotionsForStudents(classId, studentIds);
  } catch {
    return {};
  }
}

export default async function DictationDetailPage({
  params,
}: DictationDetailPageProps) {
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

  const dictation = await getDictationById(teacherClass.id, id);

  if (!dictation) {
    notFound();
  }

  const savedEntries = await getDictationEntriesByDictationId(teacherClass.id, id);
  const activeStudents = await listLeveledActiveStudents(teacherClass.id);

  if (savedEntries.length > 0) {
    const activeStudentsById = new Map(
      activeStudents.map((student) => [student.id, student])
    );

    const gridStudents: LeveledActiveStudent[] = savedEntries.map((entry) => {
      const activeStudent = activeStudentsById.get(entry.studentId);

      return {
        id: entry.studentId,
        displayName: activeStudent?.displayName ?? entry.displayName,
        level: entry.levelAtSave,
      };
    });

    const initialCounts = savedEntries.reduce<
      Record<string, Record<ChampionsErrorCategoryLetter, number>>
    >((counts, entry) => {
      counts[entry.studentId] = dbColumnsToCategoryErrors({
        errorsC: entry.errorsC,
        errorsH: entry.errorsH,
        errorsA: entry.errorsA,
        errorsM: entry.errorsM,
        errorsP: entry.errorsP,
        errorsI: entry.errorsI,
        errorsO: entry.errorsO,
        errorsN: entry.errorsN,
        errorsS: entry.errorsS,
      });
      return counts;
    }, {});

    const wordTotalsByStudentId = savedEntries.reduce<Record<string, number>>(
      (totals, entry) => {
        totals[entry.studentId] = entry.wordDenominator;
        return totals;
      },
      {}
    );

    const readOnlyStudentIds = savedEntries
      .filter((entry) => entry.archived)
      .map((entry) => entry.studentId);

    const pendingPromotionsByStudentId = await loadPendingPromotionsForGrid(
      teacherClass.id,
      gridStudents.map((student) => student.id)
    );

    return (
      <main className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex flex-col gap-1">
          <Link
            href="/dictations"
            className="text-sm text-muted-foreground underline underline-offset-4"
          >
            Retour aux dictées
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            {dictation.label}
          </h1>
          <p className="text-sm text-muted-foreground">
            {formatDictationDateForDisplay(dictation.dictationDate)}
          </p>
        </div>
        <h2 className="text-lg font-medium">Saisie des erreurs</h2>
        <ClassGrid
          dictationId={dictation.id}
          students={gridStudents}
          wordTotalsByStudentId={wordTotalsByStudentId}
          initialCounts={initialCounts}
          readOnlyStudentIds={readOnlyStudentIds}
          pendingPromotionsByStudentId={pendingPromotionsByStudentId}
        />
      </main>
    );
  }

  const matrixRows = await listWordCountMatrixRows(teacherClass.id);
  const matchingMatrixRow = findMatchingMatrixRow(
    matrixRows,
    dictation.dictationLabelKey
  );

  const wordTotalsByStudentId = matchingMatrixRow
    ? buildWordTotalsByStudentId(activeStudents, matchingMatrixRow)
    : {};

  const pendingPromotionsByStudentId = await loadPendingPromotionsForGrid(
    teacherClass.id,
    activeStudents.map((student) => student.id)
  );

  return (
    <main className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex flex-col gap-1">
        <Link
          href="/dictations"
          className="text-sm text-muted-foreground underline underline-offset-4"
        >
          Retour aux dictées
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {dictation.label}
        </h1>
        <p className="text-sm text-muted-foreground">
          {formatDictationDateForDisplay(dictation.dictationDate)}
        </p>
      </div>
      <h2 className="text-lg font-medium">Saisie des erreurs</h2>
      {activeStudents.length > 0 && !matchingMatrixRow ? (
        <p className="text-sm text-muted-foreground">
          Aucune ligne de matrice pour cette dictée. Configurez la matrice sur{" "}
          <Link
            href="/config"
            className="underline underline-offset-4"
          >
            Config
          </Link>
          .
        </p>
      ) : (
        <ClassGrid
          dictationId={dictation.id}
          students={activeStudents}
          wordTotalsByStudentId={wordTotalsByStudentId}
          pendingPromotionsByStudentId={pendingPromotionsByStudentId}
        />
      )}
    </main>
  );
}
