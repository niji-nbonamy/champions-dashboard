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
    <div className="flex flex-1 flex-col">
      <div className="sticky top-0 z-20 bg-background">
        <AppBar />
        <div className="hidden md:block">
          <NavTabs
            unassignedStudentCount={unassignedStudentCount}
            pendingPromotionCount={pendingPromotionCount}
          />
        </div>
      </div>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
