"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/dictations", label: "Dictées" },
  { href: "/students", label: "Élèves" },
  { href: "/config", label: "Config" },
  { href: "/alerts", label: "Alertes" },
] as const;

function isActiveTab(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

type NavTabsProps = {
  unassignedStudentCount?: number;
  pendingPromotionCount?: number;
};

export function NavTabs({
  unassignedStudentCount = 0,
  pendingPromotionCount = 0,
}: NavTabsProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation principale"
      className="border-b border-border bg-background"
    >
      <ul className="flex flex-wrap gap-1 overflow-x-auto px-4 md:gap-2">
        {tabs.map((tab) => {
          const active = isActiveTab(pathname, tab.href);
          const showUnassignedBadge =
            tab.href === "/students" && unassignedStudentCount > 0;
          const showPendingPromotionBadge =
            tab.href === "/alerts" && pendingPromotionCount > 0;

          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex items-center border-b-2 px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                {tab.label}
                {showUnassignedBadge ? (
                  <span
                    aria-label={`${unassignedStudentCount} élève${
                      unassignedStudentCount > 1 ? "s" : ""
                    } sans niveau`}
                    className="ml-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-semibold text-white"
                  >
                    {unassignedStudentCount}
                  </span>
                ) : null}
                {showPendingPromotionBadge ? (
                  <span
                    aria-label={`${pendingPromotionCount} élève${
                      pendingPromotionCount > 1 ? "s" : ""
                    } prêt${pendingPromotionCount > 1 ? "s" : ""}`}
                    className="ml-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-promotion-ready px-1.5 text-xs font-semibold text-promotion-ready-foreground"
                  >
                    {pendingPromotionCount}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
