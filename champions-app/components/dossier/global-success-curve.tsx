import type { CurvePoint } from "@/lib/domain/dossier-curve";
import { cn } from "@/lib/utils";

type GlobalSuccessCurveProps = {
  points: CurvePoint[];
  className?: string;
};

const SVG_WIDTH = 400;
const SVG_HEIGHT = 192;
const PADDING = { top: 16, right: 16, bottom: 44, left: 40 };
const Y_TICKS = [0, 20, 40, 60, 80, 100] as const;
const MAX_X_LABEL_LENGTH = 12;

function truncateLabel(label: string, maxLength = MAX_X_LABEL_LENGTH): string {
  if (label.length <= maxLength) {
    return label;
  }

  return `${label.slice(0, maxLength - 1)}…`;
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
  if (points.length === 0) {
    return null;
  }

  const chartHeight = SVG_HEIGHT - PADDING.top - PADDING.bottom;
  const coordinates = toChartCoordinates(points);
  const polylinePoints = coordinates
    .map(({ x, y }) => `${x},${y}`)
    .join(" ");
  const xAxisY = SVG_HEIGHT - PADDING.bottom;
  const xLabelY = xAxisY + 14;

  const ariaLabel = `Courbe de réussite globale, ${points.length} dictée${
    points.length > 1 ? "s" : ""
  }`;

  return (
    <div
      className={cn("w-full", className)}
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
          <circle
            key={point.entryId}
            cx={x}
            cy={y}
            r="4"
            className="fill-primary"
          >
            <title>{`${point.label} : ${point.percent} %`}</title>
          </circle>
        ))}
        {coordinates.map(({ x, point }) => {
          const displayLabel = truncateLabel(point.label);

          return (
            <text
              key={`x-label-${point.entryId}`}
              x={x}
              y={xLabelY}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px]"
            >
              {displayLabel}
              {displayLabel !== point.label ? (
                <title>{point.label}</title>
              ) : null}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
