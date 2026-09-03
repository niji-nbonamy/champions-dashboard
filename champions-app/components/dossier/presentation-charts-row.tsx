"use client";

import { useCallback, useState } from "react";

import { CategoryCurveToggles } from "@/components/dossier/category-curve-toggles";
import { CategoryErrorCurves } from "@/components/dossier/category-error-curves";
import { CurvePlaceholder } from "@/components/dossier/curve-placeholder";
import { GlobalSuccessCurve } from "@/components/dossier/global-success-curve";
import type { ChampionsErrorCategoryLetter } from "@/lib/domain/error-categories";
import type { CurvePoint } from "@/lib/domain/dossier-curve";
import type { StudentDictationHistoryEntry } from "@/lib/services/get-student-dictation-history";
import { cn } from "@/lib/utils";

type PresentationChartsRowProps = {
  history: StudentDictationHistoryEntry[];
  curvePoints: CurvePoint[];
  hasHistory: boolean;
  className?: string;
};

const DEFAULT_ACTIVE_CATEGORIES = new Set<ChampionsErrorCategoryLetter>(["C"]);

const CHART_CLASS_NAME = "[&_svg]:h-72 [&_svg]:min-h-[320px]";
const PLACEHOLDER_CLASS_NAME = "[&>div]:h-72 [&>div]:min-h-[320px]";

export function PresentationChartsRow({
  history,
  curvePoints,
  hasHistory,
  className,
}: PresentationChartsRowProps) {
  const [activeCategories, setActiveCategories] = useState(
    () => new Set(DEFAULT_ACTIVE_CATEGORIES)
  );

  const handleToggle = useCallback((letter: ChampionsErrorCategoryLetter) => {
    setActiveCategories((current) => {
      const next = new Set(current);

      if (next.has(letter)) {
        if (current.size <= 1) {
          return current;
        }

        next.delete(letter);
      } else {
        next.add(letter);
      }

      return next;
    });
  }, []);

  if (!hasHistory) {
    return <CurvePlaceholder className={cn(PLACEHOLDER_CLASS_NAME, className)} />;
  }

  return (
    <div
      className={cn("flex flex-col gap-6", className)}
      data-testid="presentation-charts-row"
    >
      <div
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
        data-testid="presentation-charts-grid"
      >
        <section aria-labelledby="presentation-global-chart-heading">
          <h2
            id="presentation-global-chart-heading"
            className="mb-3 text-sm font-medium text-muted-foreground"
          >
            Réussite globale (%)
          </h2>
          <GlobalSuccessCurve points={curvePoints} className={CHART_CLASS_NAME} />
        </section>

        <section aria-labelledby="presentation-category-chart-heading">
          <h2
            id="presentation-category-chart-heading"
            className="mb-3 text-sm font-medium text-muted-foreground"
          >
            Erreurs par catégorie
          </h2>
          <CategoryErrorCurves
            history={history}
            activeCategories={activeCategories}
            className={CHART_CLASS_NAME}
          />
        </section>
      </div>

      <CategoryCurveToggles
        activeCategories={activeCategories}
        onToggle={handleToggle}
      />
    </div>
  );
}
