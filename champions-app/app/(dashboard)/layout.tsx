import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MobileRouteGuard } from "@/components/dashboard/mobile-route-guard";
import { countPendingPromotionsForClass } from "@/lib/services/count-pending-promotions";
import { countUnassignedActiveStudents } from "@/lib/services/count-unassigned-active-students";
import { getTeacherClass } from "@/lib/services/get-teacher-class";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const teacherId = session?.user?.id;

  if (!teacherId) {
    redirect("/login");
  }

  const teacherClass = await getTeacherClass(teacherId);
  if (!teacherClass) {
    redirect("/onboarding/class");
  }

  const [unassignedStudentCount, pendingPromotionCount] = await Promise.all([
    countUnassignedActiveStudents(teacherClass.id),
    countPendingPromotionsForClass(teacherClass.id),
  ]);

  return (
    <DashboardShell
      unassignedStudentCount={unassignedStudentCount}
      pendingPromotionCount={pendingPromotionCount}
    >
      <MobileRouteGuard>{children}</MobileRouteGuard>
    </DashboardShell>
  );
}
