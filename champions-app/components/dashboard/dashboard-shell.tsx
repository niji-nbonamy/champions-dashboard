import type { ReactNode } from "react";

import { AppBar } from "@/components/dashboard/app-bar";
import { NavTabs } from "@/components/dashboard/nav-tabs";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppBar />
      <NavTabs />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
