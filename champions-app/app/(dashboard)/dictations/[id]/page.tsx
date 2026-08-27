import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { formatDictationDateForDisplay } from "@/lib/domain/dictation";
import { getTeacherClass } from "@/lib/services/get-teacher-class";
import { getDictationById } from "@/lib/services/list-dictations";

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
  const dictation = await getDictationById(teacherClass.id, id);

  if (!dictation) {
    notFound();
  }

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
      <p className="text-sm text-muted-foreground">
        Saisie grille — prochaine étape
      </p>
    </main>
  );
}
