import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PresentationHighlights } from "./presentation-highlights";
import type { StudentDictationHistoryEntry } from "@/lib/services/get-student-dictation-history";

function makeEntry(
  overrides: Partial<StudentDictationHistoryEntry> & {
    globalPercent: number;
  }
): StudentDictationHistoryEntry {
  return {
    entryId: "aa0e8400-e29b-41d4-a716-446655440010",
    dictationId: "880e8400-e29b-41d4-a716-446655440003",
    label: "Dictée A",
    dictationDate: "2026-08-20",
    levelAtSave: "yellow",
    wordDenominator: 40,
    categoryErrors: {
      C: 0,
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

describe("PresentationHighlights", () => {
  it("renders the last dictation percent from newest-first history", () => {
    const html = renderToStaticMarkup(
      <PresentationHighlights
        level="green"
        history={[
          makeEntry({ globalPercent: 87 }),
          makeEntry({
            entryId: "bb0e8400-e29b-41d4-a716-446655440011",
            globalPercent: 83,
          }),
        ]}
      />
    );

    expect(html).toContain("87 %");
    expect(html).toContain("Dernière dictée");
    expect(html).toContain("vert");
    expect(html).toContain("text-data-lg");
  });

  it("renders the level badge in text-data-lg when a level is defined", () => {
    const html = renderToStaticMarkup(
      <PresentationHighlights
        level="green"
        history={[makeEntry({ globalPercent: 87 })]}
      />
    );

    expect(html).toMatch(
      /<span[^>]*text-data-lg[^>]*>[\s\S]*?vert[\s\S]*?<\/span>/
    );
  });

  it("renders trend as an em dash when fewer than two dictations exist", () => {
    const html = renderToStaticMarkup(
      <PresentationHighlights level="green" history={[makeEntry({ globalPercent: 87 })]} />
    );

    expect(html).toContain("Tendance");
    expect(html).toContain(">—<");
    expect(html).not.toContain("text-trend-up");
    expect(html).not.toContain("text-trend-down");
    expect(html).not.toContain("text-trend-flat");
  });

  it("maps positive, negative, and flat trend deltas to color tokens", () => {
    const positiveHtml = renderToStaticMarkup(
      <PresentationHighlights
        level="green"
        history={[
          makeEntry({ globalPercent: 90 }),
          makeEntry({
            entryId: "bb0e8400-e29b-41d4-a716-446655440011",
            globalPercent: 85,
          }),
        ]}
      />
    );
    const negativeHtml = renderToStaticMarkup(
      <PresentationHighlights
        level="green"
        history={[
          makeEntry({ globalPercent: 80 }),
          makeEntry({
            entryId: "bb0e8400-e29b-41d4-a716-446655440011",
            globalPercent: 90,
          }),
        ]}
      />
    );
    const flatHtml = renderToStaticMarkup(
      <PresentationHighlights
        level="green"
        history={[
          makeEntry({ globalPercent: 88 }),
          makeEntry({
            entryId: "bb0e8400-e29b-41d4-a716-446655440011",
            globalPercent: 88,
          }),
        ]}
      />
    );

    expect(positiveHtml).toContain("+5 %");
    expect(positiveHtml).toContain("text-trend-up");
    expect(negativeHtml).toContain("-10 %");
    expect(negativeHtml).toContain("text-trend-down");
    expect(flatHtml).toContain("Stable");
    expect(flatHtml).toContain("text-trend-flat");
    expect(flatHtml).not.toContain("0 %");
  });

  it("renders em dashes for empty history and shows the current level badge", () => {
    const html = renderToStaticMarkup(
      <PresentationHighlights level="violet" history={[]} />
    );

    expect(html).toContain(">—<");
    expect(html).toContain("violet");
    expect(html).toContain("text-data-lg");
  });
});
