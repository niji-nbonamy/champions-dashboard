/**
 * @vitest-environment happy-dom
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { DictationHistoryTable } from "./dictation-history-table";
import type { StudentDictationHistoryEntry } from "@/lib/services/get-student-dictation-history";

const sampleEntry: StudentDictationHistoryEntry = {
  entryId: "aa0e8400-e29b-41d4-a716-446655440010",
  dictationId: "880e8400-e29b-41d4-a716-446655440003",
  label: "Dictée B",
  dictationDate: "2026-08-27",
  levelAtSave: "yellow",
  globalPercent: 92,
  wordDenominator: 40,
  categoryErrors: {
    C: 1,
    H: 0,
    A: 2,
    M: 0,
    P: 0,
    I: 0,
    O: 1,
    N: 0,
    S: 0,
  },
};

describe("DictationHistoryTable", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("renders rows collapsed by default", () => {
    act(() => {
      root.render(<DictationHistoryTable entries={[sampleEntry]} />);
    });

    const details = container.querySelector("details");
    expect(details).not.toBeNull();
    expect(details?.open).toBe(false);
    expect(container.textContent).toContain("Dictée B");
    expect(container.textContent).toContain("92 %");
  });

  it("shows per-category error counts without percentages when expanded", () => {
    act(() => {
      root.render(<DictationHistoryTable entries={[sampleEntry]} />);
    });

    const summary = container.querySelector("summary");

    act(() => {
      summary?.click();
    });

    const counts = container.querySelector(
      '[data-testid="category-error-counts"]'
    );
    expect(counts).not.toBeNull();
    expect(container.textContent).toContain("A");
    expect(container.textContent).toContain("2");
    for (const letter of ["C", "H", "A", "M", "P", "I", "O", "N", "S"]) {
      expect(container.textContent).toContain(letter);
    }
    expect(container.textContent).not.toMatch(/Conjugaison.*%/);
    expect(container.textContent).not.toMatch(/Accords.*%/);
  });
});
