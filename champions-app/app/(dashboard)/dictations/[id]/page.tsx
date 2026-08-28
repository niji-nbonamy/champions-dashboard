import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { ClassGrid } from "@/components/grid/class-grid";
import {
  DICTATION_MATRIX_ROW_MISSING_ERROR,
  formatDictationDateForDisplay,
  findMatchingMatrixRow,
  isValidUuidV4,
} from "@/lib/domain/dictation";
import { buildWordTotalsByStudentId } from "@/lib/domain/word-count-matrix";
import { getTeacherClass } from "@/lib/services/get-teacher-class";
import { getDictationById } from "@/lib/services/list-dictations";
import { listLeveledActiveStudents } from "@/lib/services/list-leveled-active-students";
import { listWordCountMatrixRows } from "@/lib/services/list-word-count-matrix-rows";

type DictationDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

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

  const students = await listLeveledActiveStudents(teacherClass.id);
  const matrixRows = await listWordCountMatrixRows(teacherClass.id);
  const matchingMatrixRow = findMatchingMatrixRow(
    matrixRows,
    dictation.dictationLabelKey
  );

  const wordTotalsByStudentId = matchingMatrixRow
    ? buildWordTotalsByStudentId(students, matchingMatrixRow)
    : {};

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
      <p className="text-sm text-muted-foreground">
        Les comptages ne sont pas encore enregistrés.
      </p>
      {students.length > 0 && !matchingMatrixRow ? (
        <p className="text-sm text-muted-foreground">
          {DICTATION_MATRIX_ROW_MISSING_ERROR}{" "}
          <Link
            href="/config"
            className="underline underline-offset-4"
          >
            Config
          </Link>
        </p>
      ) : (
        <ClassGrid
          students={students}
          wordTotalsByStudentId={wordTotalsByStudentId}
        />
      )}
    </main>
  );
}
