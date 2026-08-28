import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { GlobalSuccessCurve } from "./global-success-curve";

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
  });

  it("returns null when there are no points", () => {
    const html = renderToStaticMarkup(<GlobalSuccessCurve points={[]} />);

    expect(html).toBe("");
  });
});
