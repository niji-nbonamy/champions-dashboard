import { redirect } from "next/navigation";

import { auth } from "@/auth";
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

  return children;
}
