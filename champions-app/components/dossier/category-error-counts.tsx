import type { ChampionsErrorCategoryLetter } from "@/lib/domain/error-categories";
import { CHAMPIONS_ERROR_CATEGORIES } from "@/lib/domain/error-categories";

type CategoryErrorCountsProps = {
  counts: Record<ChampionsErrorCategoryLetter, number>;
};

export function CategoryErrorCounts({ counts }: CategoryErrorCountsProps) {
  return (
    <dl
      className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9"
      data-testid="category-error-counts"
    >
      {CHAMPIONS_ERROR_CATEGORIES.map((category) => (
        <div
          key={category.letter}
          className="flex flex-col items-center gap-0.5 rounded-md border border-border px-2 py-1.5"
        >
          <dt className="text-xs font-medium text-muted-foreground">
            {category.letter}
          </dt>
          <dd className="text-sm font-medium tabular-nums">
            {counts[category.letter]}
          </dd>
        </div>
      ))}
    </dl>
  );
}
