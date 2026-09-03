import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { PresentationMode } from "@/components/student-sheet/presentation-mode";
import { isChampionsLevel } from "@/lib/domain/champions-level";
import { isValidUuidV4 } from "@/lib/domain/dictation";
import { getClassStudent } from "@/lib/services/get-class-student";
import { getStudentDictationHistory } from "@/lib/services/get-student-dictation-history";
import { getTeacherClass } from "@/lib/services/get-teacher-class";

type StudentPresentationPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function StudentPresentationPage({
  params,
}: StudentPresentationPageProps) {
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
  const level =
    student.level && isChampionsLevel(student.level) ? student.level : null;

  return (
    <PresentationMode
      studentId={id}
      displayName={student.displayName}
      level={level}
      history={history}
    />
  );
}
