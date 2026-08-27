"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import type { ClassStudentFilter } from "@/lib/services/list-class-students";

const FILTER_OPTIONS: { value: ClassStudentFilter; label: string }[] = [
  { value: "active", label: "Actifs" },
  { value: "archived", label: "Archivés" },
  { value: "all", label: "Tous" },
];

type RosterFilterProps = {
  current: ClassStudentFilter;
};

export function RosterFilter({ current }: RosterFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setFilter(filter: ClassStudentFilter) {
    const params = new URLSearchParams(searchParams.toString());

    if (filter === "active") {
      params.delete("filter");
    } else {
      params.set("filter", filter);
    }

    params.delete("notice");

    const query = params.toString();
    router.push(query ? `/students?${query}` : "/students");
  }

  return (
    <div
      className="inline-flex rounded-lg border border-border p-0.5"
      role="group"
      aria-label="Filtrer la liste des élèves"
    >
      {FILTER_OPTIONS.map(({ value, label }) => (
        <Button
          key={value}
          type="button"
          variant={current === value ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setFilter(value)}
          aria-pressed={current === value}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
