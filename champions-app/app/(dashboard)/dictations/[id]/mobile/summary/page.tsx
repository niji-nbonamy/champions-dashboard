import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import {
  formatDictationDateForDisplay,
  isValidUuidV4,
} from "@/lib/domain/dictation";
import { getDictationCompletionSummary } from "@/lib/services/get-dictation-completion-summary";
import { getTeacherClass } from "@/lib/services/get-teacher-class";
import { getDictationById } from "@/lib/services/list-dictations";

type MobileDictationSummaryPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MobileDictationSummaryPage({
  params,
}: MobileDictationSummaryPageProps) {
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

  const completionSummary = await getDictationCompletionSummary(
    teacherClass.id,
    id
  );

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <Link
        href="/dictations"
        className="text-sm text-primary underline-offset-4 hover:underline"
      >
        Retour aux dictées
      </Link>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {dictation.label}
        </h1>
        <p className="text-sm text-muted-foreground">
          {formatDictationDateForDisplay(dictation.dictationDate)}
        </p>
      </div>
      {completionSummary.isComplete ? (
        <p className="text-sm font-medium text-primary" role="status">
          Dictée complète
        </p>
      ) : null}
      <p className="text-sm text-muted-foreground">
        {completionSummary.totalLeveledCount === 0
          ? "Aucun élève nivelé actif."
          : `${completionSummary.enteredCount} sur ${completionSummary.totalLeveledCount} élèves saisis`}
      </p>
    </main>
  );
}
