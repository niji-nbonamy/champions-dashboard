import { redirect } from "next/navigation";

import { AlertsPromotionQueue } from "@/components/promotion/alerts-promotion-queue";
import { auth } from "@/auth";
import { getTeacherClass } from "@/lib/services/get-teacher-class";
import { listPendingPromotionQueueForClass } from "@/lib/services/list-pending-promotion-queue";

export default async function AlertsPage() {
  const session = await auth();
  const teacherId = session?.user?.id;

  if (!teacherId) {
    redirect("/login");
  }

  const teacherClass = await getTeacherClass(teacherId);
  if (!teacherClass) {
    redirect("/onboarding/class");
  }

  const queue = await listPendingPromotionQueueForClass(teacherClass.id);

  return (
    <main className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Alertes</h1>
        <p className="text-sm text-muted-foreground">
          Élèves prêts à monter de niveau.
        </p>
      </div>
      {queue.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucun élève prêt à monter de niveau.
        </p>
      ) : (
        <AlertsPromotionQueue items={queue} />
      )}
    </main>
  );
}
