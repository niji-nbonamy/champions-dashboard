"use client";

import { useMemo, useRef, useState } from "react";

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

const CATEGORY_TOOLTIP_WIDTH = 208;
const CATEGORY_TOOLTIP_HEIGHT = 72;
const CATEGORY_TOOLTIP_OFFSET_Y = 12;
const CATEGORY_TOOLTIP_EDGE_MARGIN = 4;
const CATEGORY_TOUCH_DISMISS_MS = 2000;

export const CATEGORY_ERROR_TOOLTIP_INNER_CLASS =
  "max-w-full whitespace-normal break-words rounded-md border border-border bg-popover px-2 py-1 text-center text-xs leading-snug text-popover-foreground shadow-md";

function getCategoryTooltipY(pointY: number): number {
  const aboveY = pointY - CATEGORY_TOOLTIP_OFFSET_Y - CATEGORY_TOOLTIP_HEIGHT;

  if (aboveY >= CATEGORY_TOOLTIP_EDGE_MARGIN) {
    return aboveY;
  }

  return pointY + CATEGORY_TOOLTIP_OFFSET_Y;
}

function getCategoryTooltipX(pointX: number): number {
  const minX = PADDING.left;
  const maxX = SVG_WIDTH - PADDING.right - CATEGORY_TOOLTIP_WIDTH;

  return Math.min(
    Math.max(pointX - CATEGORY_TOOLTIP_WIDTH / 2, minX),
    maxX
  );
}

type CategoryErrorCurvesProps = {
  history: StudentDictationHistoryEntry[];
  activeCategories: ReadonlySet<ChampionsErrorCategoryLetter>;
  className?: string;
};

type HoveredPoint = {
  entryId: string;
  letter: ChampionsErrorCategoryLetter;
  label: string;
  x: number;
  y: number;
  categoryName: string;
  count: number;
};

export function formatCategoryPointTooltip(
  label: string,
  categoryName: string,
  count: number
): string {
  const errorLabel = count <= 1 ? "erreur" : "erreurs";

  return `${label} — ${categoryName}: ${count} ${errorLabel}`;
}

function getCategoryByLetter(letter: ChampionsErrorCategoryLetter) {
  return CHAMPIONS_ERROR_CATEGORIES.find(
    (category) => category.letter === letter
  );
}

function resolveDisplayHoveredPoint(
  hoveredPoint: HoveredPoint | null,
  sortedHistory: StudentDictationHistoryEntry[],
  activeCategories: ReadonlySet<ChampionsErrorCategoryLetter>,
  yMax: number
): HoveredPoint | null {
  if (!hoveredPoint) {
    return null;
  }

  if (!activeCategories.has(hoveredPoint.letter)) {
    return null;
  }

  const index = sortedHistory.findIndex(
    (entry) => entry.entryId === hoveredPoint.entryId
  );

  if (index < 0) {
    return null;
  }

  const entry = sortedHistory[index];
  const category = getCategoryByLetter(hoveredPoint.letter);

  if (!category) {
    return null;
  }

  const count = entry.categoryErrors[hoveredPoint.letter];

  return {
    entryId: entry.entryId,
    letter: hoveredPoint.letter,
    label: entry.label,
    x: indexToChartX(index, sortedHistory.length),
    y: countToChartY(count, yMax),
    categoryName: category.name,
    count,
  };
}

export function CategoryErrorCurves({
  history,
  activeCategories,
  className,
}: CategoryErrorCurvesProps) {
  const [hoveredPoint, setHoveredPoint] = useState<HoveredPoint | null>(null);
  const touchDismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const sortedHistory = useMemo(() => {
    const entryById = new Map(history.map((entry) => [entry.entryId, entry]));

    return toCurvePoints(history)
      .map((point) => entryById.get(point.entryId))
      .filter((entry): entry is StudentDictationHistoryEntry => entry != null);
  }, [history]);

  const curvePoints = useMemo(() => toCurvePoints(history), [history]);

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
  const { chartWidth, xAxisY } = getDossierChartDimensions();
  const xLabelY = xAxisY + 14;
  const useDateLabels = shouldUseDateLabels(sortedHistory.length);
  const visibleLabelIndices = selectVisibleLabelIndices(
    sortedHistory.length,
    chartWidth
  );

  const displayHoveredPoint = resolveDisplayHoveredPoint(
    hoveredPoint,
    sortedHistory,
    activeCategories,
    yMax
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

  function showHoveredPoint(
    entry: StudentDictationHistoryEntry,
    letter: ChampionsErrorCategoryLetter,
    x: number,
    y: number,
    categoryName: string,
    count: number
  ) {
    if (touchDismissTimerRef.current) {
      clearTimeout(touchDismissTimerRef.current);
      touchDismissTimerRef.current = null;
    }

    setHoveredPoint({
      entryId: entry.entryId,
      letter,
      label: entry.label,
      x,
      y,
      categoryName,
      count,
    });
  }

  function scheduleTouchDismiss() {
    if (touchDismissTimerRef.current) {
      clearTimeout(touchDismissTimerRef.current);
    }

    touchDismissTimerRef.current = setTimeout(() => {
      setHoveredPoint(null);
      touchDismissTimerRef.current = null;
    }, CATEGORY_TOUCH_DISMISS_MS);
  }

  return (
    <div
      className={cn("relative w-full", className)}
      data-testid="category-error-curves"
    >
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="h-56 w-full rounded-lg border border-border bg-background"
        role="img"
        aria-label="Erreurs par catégorie"
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
                    showHoveredPoint(
                      entry,
                      letter,
                      x,
                      y,
                      categoryName,
                      count
                    )
                  }
                  onMouseLeave={() => setHoveredPoint(null)}
                  onFocus={() =>
                    showHoveredPoint(
                      entry,
                      letter,
                      x,
                      y,
                      categoryName,
                      count
                    )
                  }
                  onBlur={() => setHoveredPoint(null)}
                  onTouchStart={() =>
                    showHoveredPoint(
                      entry,
                      letter,
                      x,
                      y,
                      categoryName,
                      count
                    )
                  }
                  onTouchEnd={scheduleTouchDismiss}
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
        {displayHoveredPoint ? (
          <foreignObject
            x={getCategoryTooltipX(displayHoveredPoint.x)}
            y={getCategoryTooltipY(displayHoveredPoint.y)}
            width={CATEGORY_TOOLTIP_WIDTH}
            height={CATEGORY_TOOLTIP_HEIGHT}
            className="pointer-events-none overflow-visible"
          >
            <div
              {...({
                xmlns: "http://www.w3.org/1999/xhtml",
                role: "tooltip",
                "data-testid": "category-error-curves-tooltip",
                className: "flex h-full w-full items-center justify-center",
              } as React.HTMLAttributes<HTMLDivElement>)}
            >
              <div className={CATEGORY_ERROR_TOOLTIP_INNER_CLASS}>
                {formatCategoryPointTooltip(
                  displayHoveredPoint.label,
                  displayHoveredPoint.categoryName,
                  displayHoveredPoint.count
                )}
              </div>
            </div>
          </foreignObject>
        ) : null}
      </svg>
    </div>
  );
}
