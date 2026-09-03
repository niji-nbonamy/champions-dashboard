import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  formatDateShort,
  formatPointTooltip,
  getTooltipY,
  getXAxisDisplayLabel,
  GlobalSuccessCurve,
  selectVisibleLabelIndices,
  shouldUseDateLabels,
  truncateLabel,
} from "./global-success-curve";

const SVG_HEIGHT = 216;
const PADDING = { top: 40, right: 16, bottom: 44, left: 40 };
const CHART_HEIGHT = SVG_HEIGHT - PADDING.top - PADDING.bottom;
const X_LABEL_Y = SVG_HEIGHT - PADDING.bottom + 14;

function expectedY(percent: number): number {
  return PADDING.top + (1 - percent / 100) * CHART_HEIGHT;
}

function buildPoints(count: number): Array<{
  entryId: string;
  date: string;
  label: string;
  percent: number;
}> {
  return Array.from({ length: count }, (_, index) => ({
    entryId: `entry-${index + 1}`,
    date: `2026-08-${String(index + 1).padStart(2, "0")}`,
    label: `Dictée ${index + 1}`,
    percent: 60 + index,
  }));
}

describe("global success curve helpers", () => {
  it("formats dates as dd/MM", () => {
    expect(formatDateShort("2026-08-13")).toBe("13/08");
  });

  it("switches to date labels after six dictations", () => {
    expect(shouldUseDateLabels(6)).toBe(false);
    expect(shouldUseDateLabels(7)).toBe(true);
  });

  it("subsamples labels when there are more than twelve dictations", () => {
    const visibleIndices = selectVisibleLabelIndices(15, 344);

    expect(visibleIndices.has(0)).toBe(true);
    expect(visibleIndices.has(14)).toBe(true);
    expect(visibleIndices.size).toBeLessThan(15);
  });

  it("builds point tooltips with the full dictation name", () => {
    expect(
      formatPointTooltip({
        entryId: "1",
        date: "2026-08-13",
        label: "Dictée très longue",
        percent: 88,
      })
    ).toBe("Dictée très longue : 88 %");
  });

  it("uses short dates on the axis when there are many dictations", () => {
    const label = getXAxisDisplayLabel(
      {
        entryId: "1",
        date: "2026-09-01",
        label: "Dictée septembre",
        percent: 70,
      },
      true
    );

    expect(label).toBe("01/09");
  });

  it("truncates long names when date labels are not used", () => {
    expect(truncateLabel("Dictée très longue pour septembre")).toBe(
      "Dictée très…"
    );
  });

  it("places tooltips above points when there is enough headroom", () => {
    expect(getTooltipY(80)).toBe(44);
  });

  it("flips tooltips below points near the top edge", () => {
    expect(getTooltipY(20)).toBe(32);
  });
});

describe("GlobalSuccessCurve", () => {
  it("renders an SVG curve with data points", () => {
    const html = renderToStaticMarkup(
      <GlobalSuccessCurve
        points={[
          {
            entryId: "1",
            date: "2026-08-13",
            label: "Dictée A",
            percent: 75,
          },
          {
            entryId: "2",
            date: "2026-08-20",
            label: "Dictée B",
            percent: 88,
          },
          {
            entryId: "3",
            date: "2026-08-27",
            label: "Dictée C",
            percent: 92,
          },
        ]}
      />
    );

    expect(html).toContain('data-testid="global-success-curve"');
    expect(html).toContain("<polyline");
    expect(html).toContain("<circle");
    expect(html).toContain('aria-label="Courbe de réussite globale, 3 dictées"');
    expect(html).toContain('aria-label="Dictée B : 88 %"');
    expect(html).toContain("Dictée A");
    expect(html).toContain("Dictée B");
    expect(html).toContain("Dictée C");
    expect(html).not.toContain('data-testid="global-success-curve-tooltip"');
  });

  it("renders Y-axis ticks every 20 percent with horizontal guide lines", () => {
    const html = renderToStaticMarkup(
      <GlobalSuccessCurve
        points={[
          {
            entryId: "1",
            date: "2026-08-13",
            label: "Dictée A",
            percent: 75,
          },
          {
            entryId: "2",
            date: "2026-08-27",
            label: "Dictée B",
            percent: 92,
          },
        ]}
      />
    );

    for (const tick of ["0 %", "20 %", "40 %", "60 %", "80 %", "100 %"]) {
      expect(html).toContain(tick);
    }

    const gridLines = html.match(
      /<line[^>]*class="stroke-border\/50"[^>]*>/g
    ) ?? [];
    expect(gridLines).toHaveLength(6);
  });

  it("aligns Y-axis grid lines with point positions at matching percentages", () => {
    const percent = 80;
    const expectedGridY = expectedY(percent);
    const html = renderToStaticMarkup(
      <GlobalSuccessCurve
        points={[
          {
            entryId: "1",
            date: "2026-08-13",
            label: "Dictée A",
            percent,
          },
        ]}
      />
    );

    expect(html).toContain(`y1="${expectedGridY}"`);
    expect(html).toContain(`cy="${expectedGridY}"`);
  });

  it("aligns X-axis labels horizontally with their data points", () => {
    const html = renderToStaticMarkup(
      <GlobalSuccessCurve
        points={[
          {
            entryId: "entry-a",
            date: "2026-08-13",
            label: "Dictée A",
            percent: 75,
          },
          {
            entryId: "entry-b",
            date: "2026-08-27",
            label: "Dictée B",
            percent: 92,
          },
        ]}
      />
    );

    const circleXs = [
      ...html.matchAll(/<circle[^>]*cx="([^"]+)"[^>]*r="4"/g),
    ].map((match) => match[1]);
    const labelXs = [
      ...html.matchAll(
        new RegExp(`<text[^>]*x="([^"]+)"[^>]*y="${X_LABEL_Y}"[^>]*>`, "g")
      ),
    ].map((match) => match[1]);

    expect(labelXs).toHaveLength(2);
    expect(labelXs).toEqual(circleXs);
  });

  it("maps higher success percentages to higher chart positions", () => {
    const html = renderToStaticMarkup(
      <GlobalSuccessCurve
        points={[
          {
            entryId: "1",
            date: "2026-08-13",
            label: "Dictée A",
            percent: 75,
          },
          {
            entryId: "2",
            date: "2026-08-27",
            label: "Dictée B",
            percent: 92,
          },
        ]}
      />
    );

    const circleCoordinates = [...html.matchAll(/<circle[^>]*cy="([^"]+)"/g)].map(
      (match) => Number(match[1])
    );

    expect(circleCoordinates).toHaveLength(4);
    expect(circleCoordinates[3]).toBeLessThan(circleCoordinates[1]);
  });

  it("renders a single point without a connecting line", () => {
    const html = renderToStaticMarkup(
      <GlobalSuccessCurve
        points={[
          {
            entryId: "1",
            date: "2026-08-20",
            label: "Dictée A",
            percent: 88,
          },
        ]}
      />
    );

    expect(html).toContain("<circle");
    expect(html).not.toContain("<polyline");
    expect(html).toContain('aria-label="Courbe de réussite globale, 1 dictée"');
    expect(html).toContain("Dictée A");
    for (const tick of ["0 %", "20 %", "40 %", "60 %", "80 %", "100 %"]) {
      expect(html).toContain(tick);
    }
    expect(
      html.match(/<line[^>]*class="stroke-border\/50"[^>]*>/g) ?? []
    ).toHaveLength(6);
  });

  it("truncates long X-axis labels and keeps the full label in a tooltip", () => {
    const longLabel = "Dictée très longue pour septembre";
    const html = renderToStaticMarkup(
      <GlobalSuccessCurve
        points={[
          {
            entryId: "1",
            date: "2026-09-01",
            label: longLabel,
            percent: 70,
          },
          {
            entryId: "2",
            date: "2026-09-08",
            label: "Dictée B",
            percent: 80,
          },
        ]}
      />
    );

    expect(html).toContain(
      ">Dictée très…<title>Dictée très longue pour septembre</title>"
    );
  });

  it("uses short dates on the X-axis when there are more than six dictations", () => {
    const html = renderToStaticMarkup(
      <GlobalSuccessCurve points={buildPoints(7)} />
    );

    expect(html).toContain(">01/08<title>Dictée 1</title>");
    expect(html).toContain(">07/08<title>Dictée 7</title>");
    expect(html).not.toMatch(/<text[^>]*>Dictée \d+<\/text>/);
    expect(html).toContain('aria-label="Dictée 1 : 60 %"');
  });

  it("subsamples X-axis labels when there are more than twelve dictations", () => {
    const html = renderToStaticMarkup(
      <GlobalSuccessCurve points={buildPoints(15)} />
    );

    const xAxisLabels = [
      ...html.matchAll(/<text[^>]*>(\d{2}\/\d{2})<title>/g),
    ].map((match) => match[1]);

    expect(xAxisLabels.length).toBeLessThan(15);
    expect(xAxisLabels).toContain("01/08");
    expect(xAxisLabels).toContain("15/08");
  });

  it("uses readable axis and tooltip text sizes", () => {
    const html = renderToStaticMarkup(
      <GlobalSuccessCurve
        points={[
          {
            entryId: "1",
            date: "2026-08-13",
            label: "Dictée A",
            percent: 75,
          },
        ]}
      />
    );

    expect(html).toContain('class="fill-muted-foreground text-xs tabular-nums"');
    expect(html).toContain('class="fill-muted-foreground text-xs"');
    expect(html).toContain("h-56 w-full rounded-lg");
  });

  it("returns null when there are no points", () => {
    const html = renderToStaticMarkup(<GlobalSuccessCurve points={[]} />);

    expect(html).toBe("");
  });
});
