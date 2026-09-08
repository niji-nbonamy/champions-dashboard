import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  importWordCountMatrixCsvAction: vi.fn(),
}));

import { WordCountMatrixCsvTools } from "./word-count-matrix-csv-tools";

describe("WordCountMatrixCsvTools", () => {
  it("disables export and shows empty message when the saved matrix is empty", () => {
    const html = renderToStaticMarkup(
      <WordCountMatrixCsvTools savedRows={[]} />
    );

    expect(html).toContain("Exporter CSV");
    expect(html).toContain("Rien à exporter.");
    expect(html).toContain("disabled");
    expect(html).toContain("Importer une matrice CSV");
    expect(html).toContain("sans en-tête");
  });

  it("enables export when saved rows exist and shows overwrite dialog copy", () => {
    const html = renderToStaticMarkup(
      <WordCountMatrixCsvTools
        savedRows={[
          {
            label: "1 - ponctuation",
            wordsYellow: "12",
            wordsGreen: "15",
            wordsViolet: "18",
            wordsGold: "20",
          },
        ]}
      />
    );

    expect(html).not.toContain("Rien à exporter.");
    expect(html).toContain("Exporter CSV");
    expect(html).toContain("Remplacer la matrice ?");
    expect(html).toContain("1 ligne");
  });
});
