"use client";

import { useEffect, useId, useRef } from "react";

import type { ChampionsErrorCategory } from "@/lib/domain/error-categories";
import { cn } from "@/lib/utils";

type CategoryHeaderProps = {
  category: ChampionsErrorCategory;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  className?: string;
};

export function CategoryHeader({
  category,
  open,
  onToggle,
  onClose,
  className,
}: CategoryHeaderProps) {
  const popoverId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLTableCellElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        buttonRef.current?.focus();
      }
    }

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [onClose, open]);

  const tooltipText = `${category.name} — ${category.definition}`;

  return (
    <th
      ref={containerRef}
      scope="col"
      className={cn(
        "relative min-w-[var(--spacing-grid-cell-min)] px-1 py-2 text-center font-medium",
        className
      )}
    >
      <button
        ref={buttonRef}
        type="button"
        tabIndex={-1}
        className="inline-flex min-h-[var(--spacing-grid-row-height)] min-w-[var(--spacing-grid-cell-min)] items-center justify-center rounded-md text-sm font-semibold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        title={tooltipText}
        aria-label={`${category.name}, afficher la définition`}
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        onClick={onToggle}
      >
        {category.letter}
      </button>
      {open ? (
        <div
          id={popoverId}
          role="dialog"
          aria-label={category.name}
          className="absolute left-1/2 top-full z-20 mt-1 w-56 -translate-x-1/2 rounded-md border border-border bg-popover px-3 py-2 text-left text-xs text-popover-foreground shadow-md"
        >
          <p className="font-medium">{category.name}</p>
          <p className="mt-1 text-muted-foreground">{category.definition}</p>
        </div>
      ) : null}
    </th>
  );
}
