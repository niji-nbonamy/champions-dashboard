import type { CurvePoint } from "@/lib/domain/dossier-curve";
import { cn } from "@/lib/utils";

type GlobalSuccessCurveProps = {
  points: CurvePoint[];
  className?: string;
};

const SVG_WIDTH = 400;
const SVG_HEIGHT = 192;
const PADDING = { top: 16, right: 16, bottom: 32, left: 40 };

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

export function GlobalSuccessCurve({
  points,
  className,
}: GlobalSuccessCurveProps) {
  if (points.length === 0) {
    return null;
  }

  const coordinates = toChartCoordinates(points);
  const polylinePoints = coordinates
    .map(({ x, y }) => `${x},${y}`)
    .join(" ");

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
        <line
          x1={PADDING.left}
          y1={PADDING.top}
          x2={PADDING.left}
          y2={SVG_HEIGHT - PADDING.bottom}
          className="stroke-border"
          strokeWidth="1"
        />
        <line
          x1={PADDING.left}
          y1={SVG_HEIGHT - PADDING.bottom}
          x2={SVG_WIDTH - PADDING.right}
          y2={SVG_HEIGHT - PADDING.bottom}
          className="stroke-border"
          strokeWidth="1"
        />
        <text
          x={PADDING.left - 8}
          y={PADDING.top + 4}
          textAnchor="end"
          className="fill-muted-foreground text-[10px] tabular-nums"
        >
          100 %
        </text>
        <text
          x={PADDING.left - 8}
          y={SVG_HEIGHT - PADDING.bottom}
          textAnchor="end"
          className="fill-muted-foreground text-[10px] tabular-nums"
        >
          0 %
        </text>
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
      </svg>
    </div>
  );
}
