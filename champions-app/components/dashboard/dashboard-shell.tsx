import type { ReactNode } from "react";

import { DashboardChrome } from "@/components/dashboard/dashboard-chrome";

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
    <DashboardChrome
      unassignedStudentCount={unassignedStudentCount}
      pendingPromotionCount={pendingPromotionCount}
    >
      {children}
    </DashboardChrome>
  );
}
