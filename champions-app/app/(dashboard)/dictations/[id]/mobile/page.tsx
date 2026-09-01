import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { MobileStudentPicker } from "@/components/dictations/mobile-student-picker";
import { auth } from "@/auth";
import { isValidUuidV4 } from "@/lib/domain/dictation";
import { getDictationEntriesByDictationId } from "@/lib/services/get-dictation-entries";
import { getTeacherClass } from "@/lib/services/get-teacher-class";
import { listActiveStudents } from "@/lib/services/list-active-students";
import { listLeveledActiveStudents } from "@/lib/services/list-leveled-active-students";
import { getDictationById } from "@/lib/services/list-dictations";

type MobileDictationPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MobileDictationPage({
  params,
}: MobileDictationPageProps) {
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

  const [activeStudents, leveledStudents, entries] = await Promise.all([
    listActiveStudents(teacherClass.id),
    listLeveledActiveStudents(teacherClass.id),
    getDictationEntriesByDictationId(teacherClass.id, id),
  ]);

  const leveledStudentIds = new Set(leveledStudents.map((student) => student.id));
  const enteredStudentIds = entries
    .filter(
      (entry) => !entry.archived && leveledStudentIds.has(entry.studentId)
    )
    .map((entry) => entry.studentId);
  const remainingCount = leveledStudents.length - enteredStudentIds.length;

  return (
    <main className="flex flex-1 flex-col gap-4 p-6">
      <Link
        href="/dictations"
        className="text-sm text-primary underline-offset-4 hover:underline"
      >
        Retour au hub
      </Link>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">
          Sélectionnez un élève
        </h1>
        <p className="text-sm text-muted-foreground">{dictation.label}</p>
      </div>
      <MobileStudentPicker
        dictationId={id}
        students={activeStudents}
        enteredStudentIds={enteredStudentIds}
        remainingCount={remainingCount}
        leveledStudentCount={leveledStudents.length}
      />
    </main>
  );
}
