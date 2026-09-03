import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  buildIntegerYTicks,
  computeIntegerYMax,
  countToChartY,
} from "./dossier-chart-layout";
import {
  CategoryErrorCurves,
  CATEGORY_ERROR_TOOLTIP_INNER_CLASS,
  formatCategoryPointTooltip,
} from "./category-error-curves";
import type { StudentDictationHistoryEntry } from "@/lib/services/get-student-dictation-history";

function makeEntry(
  overrides: Partial<StudentDictationHistoryEntry> & {
    entryId: string;
    label: string;
    dictationDate: string;
  }
): StudentDictationHistoryEntry {
  return {
    dictationId: "880e8400-e29b-41d4-a716-446655440003",
    levelAtSave: "yellow",
    globalPercent: 80,
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

describe("category error curve helpers", () => {
  it("computes yMax as max error plus one", () => {
    expect(computeIntegerYMax([0, 2, 5])).toBe(6);
    expect(computeIntegerYMax([0, 0, 0])).toBe(1);
  });

  it("formats tooltips with dictation label and singular or plural error labels", () => {
    expect(formatCategoryPointTooltip("Dictée A", "Conjugaison", 0)).toBe(
      "Dictée A — Conjugaison: 0 erreur"
    );
    expect(formatCategoryPointTooltip("Dictée A", "Conjugaison", 1)).toBe(
      "Dictée A — Conjugaison: 1 erreur"
    );
    expect(formatCategoryPointTooltip("Dictée B", "Homophones", 3)).toBe(
      "Dictée B — Homophones: 3 erreurs"
    );
    expect(
      formatCategoryPointTooltip(
        "Dictée C",
        "Néant / Non-présent / Non-sens",
        1
      )
    ).toBe("Dictée C — Néant / Non-présent / Non-sens: 1 erreur");
  });

  it("allows multi-line tooltip text for long category names", () => {
    expect(CATEGORY_ERROR_TOOLTIP_INNER_CLASS).toContain("whitespace-normal");
    expect(CATEGORY_ERROR_TOOLTIP_INNER_CLASS).toContain("break-words");
    expect(CATEGORY_ERROR_TOOLTIP_INNER_CLASS).not.toContain("truncate");
  });

  it("builds compact integer ticks for large scales", () => {
    const ticks = buildIntegerYTicks(24);

    expect(ticks[0]).toBe(0);
    expect(ticks.at(-1)).toBe(24);
    expect(ticks.length).toBeLessThan(25);
  });
});

describe("CategoryErrorCurves", () => {
  it("returns null when history is empty", () => {
    const markup = renderToStaticMarkup(
      <CategoryErrorCurves history={[]} activeCategories={new Set(["C"])} />
    );

    expect(markup).toBe("");
  });

  it("renders integer y-axis ticks without percent signs", () => {
    const markup = renderToStaticMarkup(
      <CategoryErrorCurves
        history={[
          makeEntry({
            entryId: "entry-1",
            label: "Dictée A",
            dictationDate: "2026-08-01",
            categoryErrors: {
              C: 2,
              H: 0,
              A: 0,
              M: 0,
              P: 0,
              I: 0,
              O: 0,
              N: 0,
              S: 0,
            },
          }),
          makeEntry({
            entryId: "entry-2",
            label: "Dictée B",
            dictationDate: "2026-08-08",
            categoryErrors: {
              C: 4,
              H: 0,
              A: 0,
              M: 0,
              P: 0,
              I: 0,
              O: 0,
              N: 0,
              S: 0,
            },
          }),
        ]}
        activeCategories={new Set(["C"])}
      />
    );

    expect(markup).toContain('data-testid="category-error-curves"');
    expect(markup).toContain('aria-label="Erreurs par catégorie"');
    expect(markup).toContain(">3<");
    expect(markup).not.toContain("%");
    expect(markup).toContain('data-testid="category-series-C"');
    expect(markup).not.toContain('data-testid="category-series-H"');
  });

  it("orders points chronologically when history input is unsorted", () => {
    const markup = renderToStaticMarkup(
      <CategoryErrorCurves
        history={[
          makeEntry({
            entryId: "entry-newer",
            label: "Dictée récente",
            dictationDate: "2026-08-20",
            categoryErrors: {
              C: 4,
              H: 0,
              A: 0,
              M: 0,
              P: 0,
              I: 0,
              O: 0,
              N: 0,
              S: 0,
            },
          }),
          makeEntry({
            entryId: "entry-older",
            label: "Dictée ancienne",
            dictationDate: "2026-08-01",
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
          }),
        ]}
        activeCategories={new Set(["C"])}
      />
    );

    const olderIndex = markup.indexOf("Dictée ancienne");
    const newerIndex = markup.indexOf("Dictée récente");

    expect(olderIndex).toBeGreaterThan(-1);
    expect(newerIndex).toBeGreaterThan(olderIndex);
  });

  it("renders multiple active category series", () => {
    const markup = renderToStaticMarkup(
      <CategoryErrorCurves
        history={[
          makeEntry({
            entryId: "entry-1",
            label: "Dictée A",
            dictationDate: "2026-08-01",
            categoryErrors: {
              C: 1,
              H: 2,
              A: 0,
              M: 0,
              P: 0,
              I: 0,
              O: 0,
              N: 0,
              S: 0,
            },
          }),
        ]}
        activeCategories={new Set(["C", "H"])}
      />
    );

    expect(markup).toContain('data-testid="category-series-C"');
    expect(markup).toContain('data-testid="category-series-H"');
  });

  it("renders all nine category series when all toggles are active", () => {
    const markup = renderToStaticMarkup(
      <CategoryErrorCurves
        history={[
          makeEntry({
            entryId: "entry-1",
            label: "Dictée A",
            dictationDate: "2026-08-01",
            categoryErrors: {
              C: 1,
              H: 2,
              A: 3,
              M: 4,
              P: 5,
              I: 6,
              O: 7,
              N: 8,
              S: 9,
            },
          }),
        ]}
        activeCategories={
          new Set(["C", "H", "A", "M", "P", "I", "O", "N", "S"])
        }
      />
    );

    for (const letter of ["C", "H", "A", "M", "P", "I", "O", "N", "S"]) {
      expect(markup).toContain(`data-testid="category-series-${letter}"`);
    }
  });

  it("shows zero on the y-axis when all active values are zero", () => {
    const markup = renderToStaticMarkup(
      <CategoryErrorCurves
        history={[
          makeEntry({
            entryId: "entry-1",
            label: "Dictée A",
            dictationDate: "2026-08-01",
          }),
        ]}
        activeCategories={new Set(["C"])}
      />
    );

    expect(markup).toContain(">0<");
    expect(markup).toContain(">1<");
  });

  it("renders a zero-error point at the bottom of the chart on a mixed series", () => {
    const history = [
      makeEntry({
        entryId: "entry-1",
        label: "Dictée A",
        dictationDate: "2026-08-01",
        categoryErrors: {
          C: 3,
          H: 0,
          A: 0,
          M: 0,
          P: 0,
          I: 0,
          O: 0,
          N: 0,
          S: 0,
        },
      }),
      makeEntry({
        entryId: "entry-2",
        label: "Dictée B",
        dictationDate: "2026-08-08",
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
      }),
    ];
    const yMax = computeIntegerYMax([3, 0]);
    const expectedZeroCy = countToChartY(0, yMax);

    const markup = renderToStaticMarkup(
      <CategoryErrorCurves
        history={history}
        activeCategories={new Set(["C"])}
      />
    );

    expect(markup).toContain(`cy="${expectedZeroCy}"`);
  });

  it("renders all nine category series across a typical school year", () => {
    const letters = ["C", "H", "A", "M", "P", "I", "O", "N", "S"] as const;
    const history = Array.from({ length: 18 }, (_, index) =>
      makeEntry({
        entryId: `entry-${index + 1}`,
        label: `Dictée ${index + 1}`,
        dictationDate: `2026-08-${String(index + 1).padStart(2, "0")}`,
        categoryErrors: Object.fromEntries(
          letters.map((letter, letterIndex) => [
            letter,
            (index + letterIndex) % 5,
          ])
        ) as StudentDictationHistoryEntry["categoryErrors"],
      })
    );

    const markup = renderToStaticMarkup(
      <CategoryErrorCurves
        history={history}
        activeCategories={new Set(letters)}
      />
    );

    for (const letter of letters) {
      expect(markup).toContain(`data-testid="category-series-${letter}"`);
    }
  });
});
