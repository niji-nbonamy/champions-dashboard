"use client";

import type { Ref } from "react";

import {
  formatGridCellAriaLabel,
  type ChampionsErrorCategoryLetter,
} from "@/lib/domain/error-categories";
import { cn } from "@/lib/utils";

type GridCellProps = {
  studentId: string;
  categoryLetter: ChampionsErrorCategoryLetter;
  categoryName: string;
  firstName: string;
  value: number;
  inputRef?: Ref<HTMLInputElement>;
  onValueChange: (studentId: string, letter: ChampionsErrorCategoryLetter, value: number) => void;
  onArrowKey?: (
    studentIndex: number,
    categoryIndex: number,
    direction: "left" | "right" | "up" | "down"
  ) => void;
  onTabWrap?: (direction: "forward" | "backward") => void;
  studentIndex: number;
  categoryIndex: number;
  isFirstCell?: boolean;
  isLastCell?: boolean;
};

function parseNonNegativeInteger(rawValue: string): number | null {
  const trimmed = rawValue.trim();

  if (!trimmed) {
    return 0;
  }

  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  return Number.parseInt(trimmed, 10);
}

export function GridCell({
  studentId,
  categoryLetter,
  categoryName,
  firstName,
  value,
  inputRef,
  onValueChange,
  onArrowKey,
  onTabWrap,
  studentIndex,
  categoryIndex,
  isFirstCell = false,
  isLastCell = false,
}: GridCellProps) {
  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const parsed = parseNonNegativeInteger(event.target.value);

    if (parsed === null) {
      return;
    }

    onValueChange(studentId, categoryLetter, parsed);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Tab") {
      if (!event.shiftKey && isLastCell) {
        event.preventDefault();
        onTabWrap?.("forward");
        return;
      }

      if (event.shiftKey && isFirstCell) {
        event.preventDefault();
        onTabWrap?.("backward");
        return;
      }
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      onArrowKey?.(studentIndex, categoryIndex, "left");
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      onArrowKey?.(studentIndex, categoryIndex, "right");
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      onArrowKey?.(studentIndex, categoryIndex, "up");
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      onArrowKey?.(studentIndex, categoryIndex, "down");
    }
  }

  return (
    <td className="p-0 align-middle">
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={String(value)}
        aria-label={formatGridCellAriaLabel(firstName, categoryName, value)}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={cn(
          "text-data-lg box-border min-h-[var(--spacing-grid-row-height)] min-w-[var(--spacing-grid-cell-min)] w-full border-0 bg-transparent px-1 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        )}
      />
    </td>
  );
}
