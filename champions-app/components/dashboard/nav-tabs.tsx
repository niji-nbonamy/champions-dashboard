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

export function NavTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation principale"
      className="border-b border-border bg-background"
    >
      <ul className="flex flex-wrap gap-1 overflow-x-auto px-4 md:gap-2">
        {tabs.map((tab) => {
          const active = isActiveTab(pathname, tab.href);

          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex border-b-2 px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
