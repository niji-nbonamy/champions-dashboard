"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { AppBar } from "@/components/dashboard/app-bar";
import { NavTabs } from "@/components/dashboard/nav-tabs";

type DashboardChromeProps = {
  children: ReactNode;
  unassignedStudentCount?: number;
  pendingPromotionCount?: number;
};

export function DashboardChrome({
  children,
  unassignedStudentCount = 0,
  pendingPromotionCount = 0,
}: DashboardChromeProps) {
  const pathname = usePathname();
  const hideChrome = pathname.endsWith("/present");

  if (hideChrome) {
    return <div className="min-h-screen">{children}</div>;
  }

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
