"use client";

import {
  CHAMPIONS_ERROR_CATEGORIES,
  type ChampionsErrorCategoryLetter,
} from "@/lib/domain/error-categories";
import { cn } from "@/lib/utils";

type CategoryCurveTogglesProps = {
  activeCategories: ReadonlySet<ChampionsErrorCategoryLetter>;
  onToggle: (letter: ChampionsErrorCategoryLetter) => void;
  className?: string;
};

function getToggleAriaLabel(
  name: string,
  isActive: boolean
): string {
  return `${name}, ${isActive ? "affichée" : "masquée"}`;
}

export function CategoryCurveToggles({
  activeCategories,
  onToggle,
  className,
}: CategoryCurveTogglesProps) {
  return (
    <div
      className={cn("flex flex-wrap justify-center gap-2", className)}
      data-testid="category-curve-toggles"
      role="group"
      aria-label="Catégories d'erreurs"
    >
      {CHAMPIONS_ERROR_CATEGORIES.map((category) => {
        const isActive = activeCategories.has(category.letter);

        return (
          <button
            key={category.letter}
            type="button"
            aria-pressed={isActive}
            aria-label={getToggleAriaLabel(category.name, isActive)}
            data-testid={`category-toggle-${category.letter}`}
            className={cn(
              "flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isActive
                ? "border-transparent"
                : "border-border bg-background text-muted-foreground"
            )}
            style={
              isActive
                ? {
                    backgroundColor: category.headerBackground,
                    color: category.headerForeground,
                  }
                : undefined
            }
            onClick={() => onToggle(category.letter)}
            onKeyDown={(event) => {
              if (event.key === " " || event.key === "Enter") {
                event.preventDefault();
                onToggle(category.letter);
              }
            }}
          >
            {category.letter}
          </button>
        );
      })}
    </div>
  );
}
