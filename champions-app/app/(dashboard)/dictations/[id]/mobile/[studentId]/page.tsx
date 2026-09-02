import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { MobilePerStudentForm } from "@/components/dictations/mobile-per-student-form";
import { auth } from "@/auth";
import { dbColumnsToCategoryErrors } from "@/lib/domain/error-categories";
import { findMatchingMatrixRow, isValidUuidV4 } from "@/lib/domain/dictation";
import { buildMobileDictationRosterState } from "@/lib/domain/mobile-dictation-roster";
import { formatUnleveledMobileBlockMessage } from "@/lib/domain/student-display-name";
import {
  getWordCountForLevel,
  isCompleteMatrixRow,
} from "@/lib/domain/word-count-matrix";
import { parseChampionsLevel } from "@/lib/domain/champions-level";
import type { CategoryErrorCounts } from "@/lib/domain/grid-validation";
import { getClassStudent } from "@/lib/services/get-class-student";
import { getDictationEntriesByDictationId } from "@/lib/services/get-dictation-entries";
import { getTeacherClass } from "@/lib/services/get-teacher-class";
import { listActiveStudents } from "@/lib/services/list-active-students";
import { listLeveledActiveStudents } from "@/lib/services/list-leveled-active-students";
import { getDictationById } from "@/lib/services/list-dictations";
import { listWordCountMatrixRows } from "@/lib/services/list-word-count-matrix-rows";

type MobileStudentEntryPageProps = {
  params: Promise<{
    id: string;
    studentId: string;
  }>;
};

const EMPTY_COUNTS: CategoryErrorCounts = {
  C: 0,
  H: 0,
  A: 0,
  M: 0,
  P: 0,
  I: 0,
  O: 0,
  N: 0,
  S: 0,
};

export default async function MobileStudentEntryPage({
  params,
}: MobileStudentEntryPageProps) {
  const session = await auth();
  const teacherId = session?.user?.id;

  if (!teacherId) {
    redirect("/login");
  }

  const teacherClass = await getTeacherClass(teacherId);
  if (!teacherClass) {
    redirect("/onboarding/class");
  }

  const { id, studentId } = await params;

  if (!isValidUuidV4(id) || !isValidUuidV4(studentId)) {
    notFound();
  }

  const dictation = await getDictationById(teacherClass.id, id);
  if (!dictation) {
    notFound();
  }

  const [activeStudents, leveledStudents, entries, matrixRows] =
    await Promise.all([
      listActiveStudents(teacherClass.id),
      listLeveledActiveStudents(teacherClass.id),
      getDictationEntriesByDictationId(teacherClass.id, id),
      listWordCountMatrixRows(teacherClass.id),
    ]);

  const rosterState = buildMobileDictationRosterState(
    entries,
    activeStudents,
    leveledStudents
  );
  const rosterStudent = rosterState.students.find(
    (student) => student.id === studentId
  );

  if (!rosterStudent) {
    notFound();
  }

  if (rosterStudent.readOnly) {
    const existingEntry = entries.find(
      (entry) => entry.studentId === studentId
    );

    if (!existingEntry) {
      notFound();
    }

    const initialCounts = dbColumnsToCategoryErrors({
      errorsC: existingEntry.errorsC,
      errorsH: existingEntry.errorsH,
      errorsA: existingEntry.errorsA,
      errorsM: existingEntry.errorsM,
      errorsP: existingEntry.errorsP,
      errorsI: existingEntry.errorsI,
      errorsO: existingEntry.errorsO,
      errorsN: existingEntry.errorsN,
      errorsS: existingEntry.errorsS,
    });

    return (
      <main className="flex flex-1 flex-col gap-4 p-6">
        <Link
          href={`/dictations/${id}/mobile`}
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Retour à la liste d'élèves
        </Link>
        <MobilePerStudentForm
          dictationId={id}
          studentId={studentId}
          displayName={rosterStudent.displayName}
          wordDenominator={existingEntry.wordDenominator}
          initialCounts={initialCounts}
          orderedStudentIds={rosterState.orderedEditableStudentIds}
          readOnly
        />
      </main>
    );
  }

  const classStudent = await getClassStudent(teacherClass.id, studentId);

  if (!classStudent || classStudent.archived) {
    notFound();
  }

  const studentLevel = parseChampionsLevel(classStudent.level ?? "");

  if (!studentLevel) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-6">
        <Link
          href={`/dictations/${id}/mobile`}
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Retour à la liste d'élèves
        </Link>
        <p className="text-sm text-destructive" role="alert">
          {formatUnleveledMobileBlockMessage(classStudent.displayName)}
        </p>
      </main>
    );
  }

  const existingEntry = entries.find(
    (entry) => entry.studentId === studentId && !entry.archived
  );

  let wordDenominator: number;
  let initialCounts: CategoryErrorCounts;

  if (existingEntry) {
    wordDenominator = existingEntry.wordDenominator;
    initialCounts = dbColumnsToCategoryErrors({
      errorsC: existingEntry.errorsC,
      errorsH: existingEntry.errorsH,
      errorsA: existingEntry.errorsA,
      errorsM: existingEntry.errorsM,
      errorsP: existingEntry.errorsP,
      errorsI: existingEntry.errorsI,
      errorsO: existingEntry.errorsO,
      errorsN: existingEntry.errorsN,
      errorsS: existingEntry.errorsS,
    });
  } else {
    const matchingMatrixRow = findMatchingMatrixRow(
      matrixRows.filter(isCompleteMatrixRow),
      dictation.dictationLabelKey
    );

    if (!matchingMatrixRow) {
      return (
        <main className="flex flex-1 flex-col gap-4 p-6">
          <Link
            href={`/dictations/${id}/mobile`}
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            Retour à la liste d'élèves
          </Link>
          <p className="text-sm text-destructive" role="alert">
            Saisie impossible : la matrice de mots pour cette dictée est
            introuvable. Configurez-la depuis un ordinateur ou une tablette.
          </p>
        </main>
      );
    }

    wordDenominator = getWordCountForLevel(matchingMatrixRow, studentLevel);
    initialCounts = { ...EMPTY_COUNTS };
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-6">
      <Link
        href={`/dictations/${id}/mobile`}
        className="text-sm text-primary underline-offset-4 hover:underline"
      >
        Retour à la liste d'élèves
      </Link>
      <MobilePerStudentForm
        dictationId={id}
        studentId={studentId}
        displayName={classStudent.displayName}
        wordDenominator={wordDenominator}
        initialCounts={initialCounts}
        orderedStudentIds={rosterState.orderedEditableStudentIds}
      />
    </main>
  );
}
