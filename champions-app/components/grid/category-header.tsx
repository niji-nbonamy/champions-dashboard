"use client";

import { useEffect, useId, useState } from "react";

import type { ChampionsErrorCategory } from "@/lib/domain/error-categories";
import { cn } from "@/lib/utils";

type CategoryHeaderProps = {
  category: ChampionsErrorCategory;
  className?: string;
};

export function CategoryHeader({ category, className }: CategoryHeaderProps) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();
  const tooltipText = category.name;

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <th
      scope="col"
      data-category-letter={category.letter}
      title={tooltipText}
      aria-label={tooltipText}
      aria-expanded={open}
      aria-controls={tooltipId}
      style={{
        backgroundColor: category.headerBackground,
        color: category.headerForeground,
      }}
      className={cn(
        "group relative min-w-[var(--spacing-grid-cell-min)] cursor-pointer px-1 py-2 text-center",
        className
      )}
      onClick={() => setOpen((current) => !current)}
    >
      <span className="inline-flex min-h-[var(--spacing-grid-row-height)] min-w-[var(--spacing-grid-cell-min)] items-center justify-center text-xl font-bold leading-none">
        {category.letter}
      </span>
      <div
        id={tooltipId}
        role="tooltip"
        className={cn(
          "absolute left-1/2 top-full z-20 mt-1 w-56 -translate-x-1/2 rounded-md border border-border bg-popover px-3 py-2 text-left text-xs font-normal text-popover-foreground shadow-md transition-opacity",
          open
            ? "opacity-100"
            : "pointer-events-none opacity-0 group-hover:opacity-100"
        )}
      >
        <p className="font-medium">{category.name}</p>
      </div>
    </th>
  );
}
