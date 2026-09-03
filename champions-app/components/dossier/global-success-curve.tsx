"use client";

import { useState } from "react";

import type { CurvePoint } from "@/lib/domain/dossier-curve";
import { cn } from "@/lib/utils";

type GlobalSuccessCurveProps = {
  points: CurvePoint[];
  className?: string;
};

const SVG_WIDTH = 400;
const SVG_HEIGHT = 216;
const PADDING = { top: 40, right: 16, bottom: 44, left: 40 };
const Y_TICKS = [0, 20, 40, 60, 80, 100] as const;
const MAX_X_LABEL_LENGTH = 12;
const DATE_LABEL_THRESHOLD = 6;
const SUBSAMPLE_THRESHOLD = 12;
const MIN_LABEL_GAP_PX = 48;
const TOOLTIP_WIDTH = 160;
const TOOLTIP_HEIGHT = 24;
const TOOLTIP_OFFSET_Y = 12;
const TOOLTIP_EDGE_MARGIN = 4;

export function truncateLabel(
  label: string,
  maxLength = MAX_X_LABEL_LENGTH
): string {
  if (label.length <= maxLength) {
    return label;
  }

  return `${label.slice(0, maxLength - 1)}…`;
}

export function formatDateShort(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

  if (!match) {
    return date;
  }

  const [, , month, day] = match;
  return `${day}/${month}`;
}

export function selectVisibleLabelIndices(
  count: number,
  chartWidth: number
): Set<number> {
  const allIndices = Array.from({ length: count }, (_, index) => index);

  if (count <= SUBSAMPLE_THRESHOLD) {
    return new Set(allIndices);
  }

  const maxLabels = Math.max(2, Math.floor(chartWidth / MIN_LABEL_GAP_PX));

  if (count <= maxLabels) {
    return new Set(allIndices);
  }

  const step = Math.ceil(count / maxLabels);
  const indices = new Set<number>();

  for (let index = 0; index < count; index += step) {
    indices.add(index);
  }

  indices.add(0);
  indices.add(count - 1);

  return indices;
}

export function shouldUseDateLabels(pointCount: number): boolean {
  return pointCount > DATE_LABEL_THRESHOLD;
}

export function getXAxisDisplayLabel(
  point: CurvePoint,
  useDateLabels: boolean
): string {
  if (useDateLabels) {
    return formatDateShort(point.date);
  }

  return truncateLabel(point.label);
}

export function formatPointTooltip(point: CurvePoint): string {
  return `${point.label} : ${point.percent} %`;
}

export function getTooltipY(pointY: number): number {
  const aboveY = pointY - TOOLTIP_OFFSET_Y - TOOLTIP_HEIGHT;

  if (aboveY >= TOOLTIP_EDGE_MARGIN) {
    return aboveY;
  }

  return pointY + TOOLTIP_OFFSET_Y;
}

function toChartCoordinates(
  points: CurvePoint[]
): Array<{ x: number; y: number; point: CurvePoint }> {
  const chartWidth = SVG_WIDTH - PADDING.left - PADDING.right;
  const chartHeight = SVG_HEIGHT - PADDING.top - PADDING.bottom;
  const lastIndex = Math.max(points.length - 1, 1);

  return points.map((point, index) => ({
    x: PADDING.left + (index / lastIndex) * chartWidth,
    y: PADDING.top + (1 - point.percent / 100) * chartHeight,
    point,
  }));
}

function tickY(tick: number, chartHeight: number): number {
  return PADDING.top + (1 - tick / 100) * chartHeight;
}

export function GlobalSuccessCurve({
  points,
  className,
}: GlobalSuccessCurveProps) {
  const [hoveredEntryId, setHoveredEntryId] = useState<string | null>(null);

  if (points.length === 0) {
    return null;
  }

  const chartWidth = SVG_WIDTH - PADDING.left - PADDING.right;
  const chartHeight = SVG_HEIGHT - PADDING.top - PADDING.bottom;
  const coordinates = toChartCoordinates(points);
  const polylinePoints = coordinates
    .map(({ x, y }) => `${x},${y}`)
    .join(" ");
  const xAxisY = SVG_HEIGHT - PADDING.bottom;
  const xLabelY = xAxisY + 14;
  const useDateLabels = shouldUseDateLabels(points.length);
  const visibleLabelIndices = selectVisibleLabelIndices(
    points.length,
    chartWidth
  );
  const hoveredCoordinate = coordinates.find(
    ({ point }) => point.entryId === hoveredEntryId
  );

  const ariaLabel = `Courbe de réussite globale, ${points.length} dictée${
    points.length > 1 ? "s" : ""
  }`;

  return (
    <div
      className={cn("relative w-full", className)}
      data-testid="global-success-curve"
    >
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="h-48 w-full rounded-lg border border-border bg-background"
        role="img"
        aria-label={ariaLabel}
      >
        {Y_TICKS.map((tick) => {
          const y = tickY(tick, chartHeight);

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
        {Y_TICKS.map((tick) => {
          const y = tickY(tick, chartHeight);

          return (
            <text
              key={`y-tick-${tick}`}
              x={PADDING.left - 8}
              y={y + 4}
              textAnchor="end"
              className="fill-muted-foreground text-[10px] tabular-nums"
            >
              {tick} %
            </text>
          );
        })}
        {coordinates.length > 1 ? (
          <polyline
            points={polylinePoints}
            fill="none"
            className="stroke-primary"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}
        {coordinates.map(({ x, y, point }) => (
          <g key={point.entryId}>
            <circle
              cx={x}
              cy={y}
              r="10"
              className="fill-transparent"
              tabIndex={0}
              role="graphics-symbol"
              aria-label={formatPointTooltip(point)}
              onMouseEnter={() => setHoveredEntryId(point.entryId)}
              onMouseLeave={() => setHoveredEntryId(null)}
              onFocus={() => setHoveredEntryId(point.entryId)}
              onBlur={() => setHoveredEntryId(null)}
            />
            <circle
              cx={x}
              cy={y}
              r="4"
              className="fill-primary pointer-events-none"
            />
          </g>
        ))}
        {coordinates.map(({ x, point }, index) => {
          if (!visibleLabelIndices.has(index)) {
            return null;
          }

          const displayLabel = getXAxisDisplayLabel(point, useDateLabels);
          const showNameTooltip =
            useDateLabels || displayLabel !== point.label;

          return (
            <text
              key={`x-label-${point.entryId}`}
              x={x}
              y={xLabelY}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px]"
            >
              {displayLabel}
              {showNameTooltip ? <title>{point.label}</title> : null}
            </text>
          );
        })}
        {hoveredCoordinate ? (
          <foreignObject
            x={hoveredCoordinate.x - TOOLTIP_WIDTH / 2}
            y={getTooltipY(hoveredCoordinate.y)}
            width={TOOLTIP_WIDTH}
            height={TOOLTIP_HEIGHT}
            className="pointer-events-none overflow-visible"
          >
            <div
              xmlns="http://www.w3.org/1999/xhtml"
              role="tooltip"
              data-testid="global-success-curve-tooltip"
              className="flex h-full items-center justify-center"
            >
              <div className="max-w-full truncate rounded-md border border-border bg-popover px-2 py-0.5 text-center text-[10px] leading-tight text-popover-foreground shadow-md">
                {formatPointTooltip(hoveredCoordinate.point)}
              </div>
            </div>
          </foreignObject>
        ) : null}
      </svg>
    </div>
  );
}
