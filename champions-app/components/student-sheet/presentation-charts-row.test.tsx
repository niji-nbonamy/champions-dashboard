import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PresentationChartsRow } from "./presentation-charts-row";
import type { StudentDictationHistoryEntry } from "@/lib/services/get-student-dictation-history";

function makeEntry(
  overrides: Partial<StudentDictationHistoryEntry> = {}
): StudentDictationHistoryEntry {
  return {
    entryId: "aa0e8400-e29b-41d4-a716-446655440010",
    dictationId: "880e8400-e29b-41d4-a716-446655440003",
    label: "Dictée A",
    dictationDate: "2026-08-20",
    levelAtSave: "yellow",
    globalPercent: 87,
    wordDenominator: 40,
    categoryErrors: {
      C: 1,
      H: 0,
      A: 0,
      M: 0,
      P: 0,
      I: 0,
      O: 0,
      N: 0,
      S: 0,
    },
    ...overrides,
  };
}

describe("PresentationChartsRow", () => {
  it("renders the placeholder when history is empty", () => {
    const markup = renderToStaticMarkup(
      <PresentationChartsRow history={[]} curvePoints={[]} hasHistory={false} />
    );

    expect(markup).toContain('data-testid="curve-placeholder"');
    expect(markup).not.toContain("Erreurs par catégorie");
  });

  it("renders dual chart headings and default C toggle", () => {
    const entry = makeEntry();
    const markup = renderToStaticMarkup(
      <PresentationChartsRow
        history={[entry]}
        curvePoints={[
          {
            entryId: entry.entryId,
            date: entry.dictationDate,
            label: entry.label,
            percent: entry.globalPercent,
          },
        ]}
        hasHistory
      />
    );

    expect(markup).toContain("Réussite globale (%)");
    expect(markup).toContain("Erreurs par catégorie");
    expect(markup).toContain('data-testid="global-success-curve"');
    expect(markup).toContain('data-testid="category-error-curves"');
    expect(markup).toContain('data-testid="category-toggle-C"');
    expect(markup).toContain('aria-pressed="true"');
    expect(markup).toContain('data-testid="presentation-charts-grid"');
    expect(markup).toContain("lg:grid-cols-2");
  });
});
