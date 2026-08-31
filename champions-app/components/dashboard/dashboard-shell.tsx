import type { ReactNode } from "react";

import { AppBar } from "@/components/dashboard/app-bar";
import { NavTabs } from "@/components/dashboard/nav-tabs";

type DashboardShellProps = {
  children: ReactNode;
  unassignedStudentCount?: number;
  pendingPromotionCount?: number;
};

export function DashboardShell({
  children,
  unassignedStudentCount = 0,
  pendingPromotionCount = 0,
}: DashboardShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppBar />
      <NavTabs
        unassignedStudentCount={unassignedStudentCount}
        pendingPromotionCount={pendingPromotionCount}
      />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
