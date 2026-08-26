import { afterEach, describe, expect, it, vi } from "vitest";

import { wordCountMatrixRows } from "@/lib/db/schema";

const mockOrderBy = vi.fn();
const mockWhere = vi.fn(() => ({ orderBy: mockOrderBy }));
const mockFrom = vi.fn(() => ({ where: mockWhere }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

const getDb = vi.fn(() => ({
  select: mockSelect,
}));

vi.mock("@/lib/db/index", () => ({
  getDb,
}));

describe("listWordCountMatrixRows", () => {
  const classId = "660e8400-e29b-41d4-a716-446655440001";

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns rows sorted by label for the class", async () => {
    mockOrderBy.mockResolvedValueOnce([
      {
        dictationLabelKey: "Dictée A",
        wordsYellow: 10,
        wordsGreen: 12,
        wordsViolet: 14,
        wordsGold: 16,
      },
    ]);

    const { listWordCountMatrixRows } = await import(
      "./list-word-count-matrix-rows"
    );
    const rows = await listWordCountMatrixRows(classId);

    expect(rows).toEqual([
      {
        dictationLabelKey: "Dictée A",
        wordsYellow: 10,
        wordsGreen: 12,
        wordsViolet: 14,
        wordsGold: 16,
      },
    ]);
    expect(mockSelect).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalledWith(wordCountMatrixRows);
    expect(mockWhere).toHaveBeenCalled();
    expect(mockOrderBy).toHaveBeenCalled();
  });
});
