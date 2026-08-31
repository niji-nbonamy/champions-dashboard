import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { isValidUuidV4 } from "@/lib/domain/dictation";
import { getTeacherClass } from "@/lib/services/get-teacher-class";
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

  return (
    <main className="flex flex-1 flex-col gap-4 p-6">
      <Link
        href="/dictations"
        className="text-sm text-primary underline-offset-4 hover:underline"
      >
        Retour au hub
      </Link>
      <h1 className="text-xl font-semibold tracking-tight">
        Sélectionnez un élève
      </h1>
    </main>
  );
}
