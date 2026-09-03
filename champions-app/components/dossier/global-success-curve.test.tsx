import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { GlobalSuccessCurve } from "./global-success-curve";

const SVG_HEIGHT = 192;
const PADDING = { top: 16, right: 16, bottom: 44, left: 40 };
const CHART_HEIGHT = SVG_HEIGHT - PADDING.top - PADDING.bottom;

function expectedY(percent: number): number {
  return PADDING.top + (1 - percent / 100) * CHART_HEIGHT;
}

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
    expect(html).toContain("Dictée B : 88 %");
    expect(html).toContain("Dictée A");
    expect(html).toContain("Dictée B");
    expect(html).toContain("Dictée C");
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

    const circleXs = [...html.matchAll(/<circle[^>]*cx="([^"]+)"/g)].map(
      (match) => match[1]
    );
    const labelXs = [...html.matchAll(/<text[^>]*x="([^"]+)"[^>]*>Dictée [AB]/g)].map(
      (match) => match[1]
    );

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

    expect(circleCoordinates).toHaveLength(2);
    expect(circleCoordinates[1]).toBeLessThan(circleCoordinates[0]);
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

    const truncatedLabelMatch = html.match(
      /<text[^>]*>Dictée très…(?:<title>Dictée très longue pour septembre<\/title>)?<\/text>/
    );
    expect(truncatedLabelMatch).not.toBeNull();
    expect(html).toContain("<title>Dictée très longue pour septembre</title>");
  });

  it("returns null when there are no points", () => {
    const html = renderToStaticMarkup(<GlobalSuccessCurve points={[]} />);

    expect(html).toBe("");
  });
});
