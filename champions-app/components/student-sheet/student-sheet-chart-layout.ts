export const STUDENT_SHEET_CHART_SVG_WIDTH = 400;
export const STUDENT_SHEET_CHART_SVG_HEIGHT = 216;
export const STUDENT_SHEET_CHART_PADDING = {
  top: 40,
  right: 16,
  bottom: 44,
  left: 40,
} as const;

export function getStudentSheetChartDimensions() {
  const chartWidth =
    STUDENT_SHEET_CHART_SVG_WIDTH -
    STUDENT_SHEET_CHART_PADDING.left -
    STUDENT_SHEET_CHART_PADDING.right;
  const chartHeight =
    STUDENT_SHEET_CHART_SVG_HEIGHT -
    STUDENT_SHEET_CHART_PADDING.top -
    STUDENT_SHEET_CHART_PADDING.bottom;
  const xAxisY = STUDENT_SHEET_CHART_SVG_HEIGHT - STUDENT_SHEET_CHART_PADDING.bottom;

  return { chartWidth, chartHeight, xAxisY };
}

export function indexToChartX(index: number, pointCount: number): number {
  const { chartWidth } = getStudentSheetChartDimensions();
  const lastIndex = Math.max(pointCount - 1, 1);

  return STUDENT_SHEET_CHART_PADDING.left + (index / lastIndex) * chartWidth;
}

export function countToChartY(count: number, yMax: number): number {
  const { chartHeight } = getStudentSheetChartDimensions();

  if (yMax <= 0) {
    return STUDENT_SHEET_CHART_PADDING.top + chartHeight;
  }

  return STUDENT_SHEET_CHART_PADDING.top + (1 - count / yMax) * chartHeight;
}

export function computeIntegerYMax(values: number[]): number {
  const maxError = values.length > 0 ? Math.max(...values) : 0;

  return maxError + 1;
}

export function buildIntegerYTicks(yMax: number): number[] {
  if (yMax <= 12) {
    return Array.from({ length: yMax + 1 }, (_, index) => index);
  }

  const step = Math.ceil(yMax / 6);
  const ticks = new Set<number>([0, yMax]);

  for (let tick = step; tick < yMax; tick += step) {
    ticks.add(tick);
  }

  return [...ticks].sort((a, b) => a - b);
}
