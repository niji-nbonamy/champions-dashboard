import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { EditDictationMetadataDialog } from "@/components/dictations/edit-dictation-metadata-dialog";
import { ClassGrid } from "@/components/grid/class-grid";
import {
  formatDictationDateForDisplay,
  findMatchingMatrixRow,
  isValidUuidV4,
} from "@/lib/domain/dictation";
import { dbColumnsToCategoryErrors } from "@/lib/domain/error-categories";
import type { ChampionsErrorCategoryLetter } from "@/lib/domain/error-categories";
import { buildDictationRosterState } from "@/lib/domain/dictation-roster";
import {
  buildWordTotalsByStudentId,
  isCompleteMatrixRow,
  normalizeDictationLabelKey,
} from "@/lib/domain/word-count-matrix";
import { getTeacherClass } from "@/lib/services/get-teacher-class";
import { getDictationEntriesByDictationId } from "@/lib/services/get-dictation-entries";
import { getDictationById } from "@/lib/services/list-dictations";
import { listActiveStudents } from "@/lib/services/list-active-students";
import { listLeveledActiveStudents } from "@/lib/services/list-leveled-active-students";
import { listPendingPromotionsForStudents } from "@/lib/services/list-pending-promotions";
import { listWordCountMatrixRows } from "@/lib/services/list-word-count-matrix-rows";
import type { LeveledActiveStudent } from "@/lib/services/list-leveled-active-students";

type DictationDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type DictationHeaderProps = {
  label: string;
  dictationDate: string;
  dictationId: string;
  dictationLabelKey: string;
  matrixLabelOptions: Array<{ value: string; label: string }>;
};

function DictationDetailHeader({
  label,
  dictationDate,
  dictationId,
  dictationLabelKey,
  matrixLabelOptions,
}: DictationHeaderProps) {
  return (
    <div className="flex flex-col gap-1">
      <Link
        href="/dictations"
        className="text-sm text-muted-foreground underline underline-offset-4"
      >
        Retour aux dictées
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{label}</h1>
          <p className="text-sm text-muted-foreground">
            {formatDictationDateForDisplay(dictationDate)}
          </p>
        </div>
        {matrixLabelOptions.length > 0 ? (
          <EditDictationMetadataDialog
            dictationId={dictationId}
            currentLabelKey={dictationLabelKey}
            currentDate={dictationDate}
            matrixLabelOptions={matrixLabelOptions}
          />
        ) : (
          <div className="flex flex-col items-end gap-1">
            <Button type="button" variant="outline" size="sm" disabled>
              Modifier
            </Button>
            <p className="max-w-xs text-right text-xs text-muted-foreground">
              Configurez la matrice sur{" "}
              <Link href="/config" className="underline underline-offset-4">
                Config
              </Link>{" "}
              pour modifier la dictée.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

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

  const matrixRows = await listWordCountMatrixRows(teacherClass.id);
  const matrixLabelOptions = matrixRows
    .filter(isCompleteMatrixRow)
    .sort((left, right) =>
      left.dictationLabelKey.localeCompare(right.dictationLabelKey, "fr")
    )
    .map((row) => ({
      value: row.dictationLabelKey,
      label: row.dictationLabelKey,
    }));

  const currentLabelOptionValue =
    matrixLabelOptions.find(
      (option) =>
        normalizeDictationLabelKey(option.value) ===
        normalizeDictationLabelKey(dictation.dictationLabelKey)
    )?.value ?? dictation.dictationLabelKey;

  const [savedEntries, activeStudents, leveledStudents] = await Promise.all([
    getDictationEntriesByDictationId(teacherClass.id, id),
    listActiveStudents(teacherClass.id),
    listLeveledActiveStudents(teacherClass.id),
  ]);

  if (savedEntries.length > 0) {
    const rosterState = buildDictationRosterState(
      savedEntries,
      activeStudents,
      leveledStudents
    );

    const gridStudents: LeveledActiveStudent[] = rosterState.students.map(
      (student) => ({
        id: student.id,
        displayName: student.displayName,
        level: student.level ?? "",
      })
    );

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

    const wordTotalsFromEntries = savedEntries.reduce<Record<string, number>>(
      (totals, entry) => {
        totals[entry.studentId] = entry.wordDenominator;
        return totals;
      },
      {}
    );

    const matchingMatrixRow = findMatchingMatrixRow(
      matrixRows,
      dictation.dictationLabelKey
    );
    const studentsWithoutSavedTotal = gridStudents.filter(
      (student) => wordTotalsFromEntries[student.id] === undefined
    );
    const wordTotalsFromMatrix = matchingMatrixRow
      ? buildWordTotalsByStudentId(studentsWithoutSavedTotal, matchingMatrixRow)
      : {};

    const wordTotalsByStudentId = {
      ...wordTotalsFromMatrix,
      ...wordTotalsFromEntries,
    };

    const readOnlyStudentIds = rosterState.students
      .filter((student) => student.readOnly)
      .map((student) => student.id);

    const pendingPromotionsByStudentId = await loadPendingPromotionsForGrid(
      teacherClass.id,
      gridStudents.map((student) => student.id)
    );

    return (
      <main className="flex flex-1 flex-col gap-4 p-6">
        <DictationDetailHeader
          label={dictation.label}
          dictationDate={dictation.dictationDate}
          dictationId={dictation.id}
          dictationLabelKey={currentLabelOptionValue}
          matrixLabelOptions={matrixLabelOptions}
        />
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

  const matchingMatrixRow = findMatchingMatrixRow(
    matrixRows,
    dictation.dictationLabelKey
  );

  const wordTotalsByStudentId = matchingMatrixRow
    ? buildWordTotalsByStudentId(leveledStudents, matchingMatrixRow)
    : {};

  const pendingPromotionsByStudentId = await loadPendingPromotionsForGrid(
    teacherClass.id,
    leveledStudents.map((student) => student.id)
  );

  return (
    <main className="flex flex-1 flex-col gap-4 p-6">
      <DictationDetailHeader
        label={dictation.label}
        dictationDate={dictation.dictationDate}
        dictationId={dictation.id}
        dictationLabelKey={currentLabelOptionValue}
        matrixLabelOptions={matrixLabelOptions}
      />
      <h2 className="text-lg font-medium">Saisie des erreurs</h2>
      {leveledStudents.length > 0 && !matchingMatrixRow ? (
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
          students={leveledStudents}
          wordTotalsByStudentId={wordTotalsByStudentId}
          pendingPromotionsByStudentId={pendingPromotionsByStudentId}
        />
      )}
    </main>
  );
}
