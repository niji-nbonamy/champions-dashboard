"use client";

import { useEffect, useMemo, useState } from "react";

import {
  buildIntegerYTicks,
  computeIntegerYMax,
  countToChartY,
  DOSSIER_CHART_PADDING as PADDING,
  DOSSIER_CHART_SVG_HEIGHT as SVG_HEIGHT,
  DOSSIER_CHART_SVG_WIDTH as SVG_WIDTH,
  getDossierChartDimensions,
  indexToChartX,
} from "@/components/dossier/dossier-chart-layout";
import {
  getTooltipX,
  getTooltipY,
  getXAxisDisplayLabel,
  selectVisibleLabelIndices,
  shouldUseDateLabels,
} from "@/components/dossier/global-success-curve";
import {
  CHAMPIONS_ERROR_CATEGORIES,
  type ChampionsErrorCategoryLetter,
} from "@/lib/domain/error-categories";
import { toCurvePoints } from "@/lib/domain/dossier-curve";
import type { StudentDictationHistoryEntry } from "@/lib/services/get-student-dictation-history";
import { cn } from "@/lib/utils";

type CategoryErrorCurvesProps = {
  history: StudentDictationHistoryEntry[];
  activeCategories: ReadonlySet<ChampionsErrorCategoryLetter>;
  className?: string;
};

type HoveredPoint = {
  entryId: string;
  letter: ChampionsErrorCategoryLetter;
  x: number;
  y: number;
  label: string;
  categoryName: string;
  count: number;
};

export function formatCategoryPointTooltip(
  label: string,
  categoryName: string,
  count: number
): string {
  const errorLabel = count === 1 ? "erreur" : "erreurs";

  return `${label} — ${categoryName}: ${count} ${errorLabel}`;
}

function getCategoryByLetter(letter: ChampionsErrorCategoryLetter) {
  return CHAMPIONS_ERROR_CATEGORIES.find(
    (category) => category.letter === letter
  );
}

export function CategoryErrorCurves({
  history,
  activeCategories,
  className,
}: CategoryErrorCurvesProps) {
  const [hoveredPoint, setHoveredPoint] = useState<HoveredPoint | null>(null);

  const sortedHistory = useMemo(() => {
    const entryById = new Map(history.map((entry) => [entry.entryId, entry]));

    return toCurvePoints(history)
      .map((point) => entryById.get(point.entryId))
      .filter((entry): entry is StudentDictationHistoryEntry => entry != null);
  }, [history]);

  const curvePoints = useMemo(() => toCurvePoints(history), [history]);

  useEffect(() => {
    setHoveredPoint(null);
  }, [history, activeCategories]);

  if (sortedHistory.length === 0) {
    return null;
  }

  const activeLetters = CHAMPIONS_ERROR_CATEGORIES.map(
    (category) => category.letter
  ).filter((letter) => activeCategories.has(letter));

  const activeValues = sortedHistory.flatMap((entry) =>
    activeLetters.map((letter) => entry.categoryErrors[letter])
  );
  const yMax = computeIntegerYMax(activeValues);
  const yTicks = buildIntegerYTicks(yMax);
  const { chartWidth, chartHeight, xAxisY } = getDossierChartDimensions();
  const xLabelY = xAxisY + 14;
  const useDateLabels = shouldUseDateLabels(sortedHistory.length);
  const visibleLabelIndices = selectVisibleLabelIndices(
    sortedHistory.length,
    chartWidth
  );

  const series = activeLetters.map((letter) => {
    const category = getCategoryByLetter(letter)!;

    return {
      letter,
      color: category.headerBackground,
      categoryName: category.name,
      coordinates: sortedHistory.map((entry, index) => ({
        x: indexToChartX(index, sortedHistory.length),
        y: countToChartY(entry.categoryErrors[letter], yMax),
        entry,
        count: entry.categoryErrors[letter],
      })),
    };
  });

  const ariaLabel = `Erreurs par catégorie, ${sortedHistory.length} dictée${
    sortedHistory.length > 1 ? "s" : ""
  }`;

  return (
    <div
      className={cn("relative w-full", className)}
      data-testid="category-error-curves"
    >
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="h-56 w-full rounded-lg border border-border bg-background"
        role="img"
        aria-label={ariaLabel}
      >
        {yTicks.map((tick) => {
          const y = countToChartY(tick, yMax);

          return (
            <line
              key={`grid-${tick}`}
              x1={PADDING.left}
              y1={y}
              x2={SVG_WIDTH - PADDING.right}
              y2={y}
              className="stroke-border/50"
              strokeWidth="1"
            />
          );
        })}
        <line
          x1={PADDING.left}
          y1={PADDING.top}
          x2={PADDING.left}
          y2={xAxisY}
          className="stroke-border"
          strokeWidth="1"
        />
        <line
          x1={PADDING.left}
          y1={xAxisY}
          x2={SVG_WIDTH - PADDING.right}
          y2={xAxisY}
          className="stroke-border"
          strokeWidth="1"
        />
        {yTicks.map((tick) => {
          const y = countToChartY(tick, yMax);

          return (
            <text
              key={`y-tick-${tick}`}
              x={PADDING.left - 8}
              y={y + 4}
              textAnchor="end"
              className="fill-muted-foreground text-xs tabular-nums"
            >
              {tick}
            </text>
          );
        })}
        {series.map(({ letter, color, categoryName, coordinates }) => (
          <g key={letter} data-testid={`category-series-${letter}`}>
            {coordinates.length > 1 ? (
              <polyline
                points={coordinates.map(({ x, y }) => `${x},${y}`).join(" ")}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ) : null}
            {coordinates.map(({ x, y, entry, count }) => (
              <g key={`${letter}-${entry.entryId}`}>
                <circle
                  cx={x}
                  cy={y}
                  r="10"
                  className="fill-transparent"
                  tabIndex={0}
                  role="graphics-symbol"
                  aria-label={formatCategoryPointTooltip(
                    entry.label,
                    categoryName,
                    count
                  )}
                  onMouseEnter={() =>
                    setHoveredPoint({
                      entryId: entry.entryId,
                      letter,
                      x,
                      y,
                      label: entry.label,
                      categoryName,
                      count,
                    })
                  }
                  onMouseLeave={() => setHoveredPoint(null)}
                  onFocus={() =>
                    setHoveredPoint({
                      entryId: entry.entryId,
                      letter,
                      x,
                      y,
                      label: entry.label,
                      categoryName,
                      count,
                    })
                  }
                  onBlur={() => setHoveredPoint(null)}
                  onTouchStart={() =>
                    setHoveredPoint({
                      entryId: entry.entryId,
                      letter,
                      x,
                      y,
                      label: entry.label,
                      categoryName,
                      count,
                    })
                  }
                  onTouchEnd={() => setHoveredPoint(null)}
                  onTouchCancel={() => setHoveredPoint(null)}
                />
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill={color}
                  className="pointer-events-none"
                />
              </g>
            ))}
          </g>
        ))}
        {curvePoints.map((point, index) => {
          if (!visibleLabelIndices.has(index)) {
            return null;
          }

          const x = indexToChartX(index, sortedHistory.length);
          const displayLabel = getXAxisDisplayLabel(point, useDateLabels);
          const showNameTooltip =
            useDateLabels || displayLabel !== point.label;

          return (
            <text
              key={`x-label-${point.entryId}`}
              x={x}
              y={xLabelY}
              textAnchor="middle"
              className="fill-muted-foreground text-xs"
            >
              {displayLabel}
              {showNameTooltip ? <title>{point.label}</title> : null}
            </text>
          );
        })}
        {hoveredPoint ? (
          <foreignObject
            x={getTooltipX(hoveredPoint.x)}
            y={getTooltipY(hoveredPoint.y)}
            width={160}
            height={24}
            className="pointer-events-none overflow-visible"
          >
            <div
              {...({
                xmlns: "http://www.w3.org/1999/xhtml",
                role: "tooltip",
                "data-testid": "category-error-curves-tooltip",
                className: "flex h-full items-center justify-center",
              } as React.HTMLAttributes<HTMLDivElement>)}
            >
              <div className="max-w-full truncate rounded-md border border-border bg-popover px-2 py-0.5 text-center text-xs leading-tight text-popover-foreground shadow-md">
                {formatCategoryPointTooltip(
                  hoveredPoint.label,
                  hoveredPoint.categoryName,
                  hoveredPoint.count
                )}
              </div>
            </div>
          </foreignObject>
        ) : null}
      </svg>
    </div>
  );
}
