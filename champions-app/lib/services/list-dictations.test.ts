import { afterEach, describe, expect, it, vi } from "vitest";

import { dictations } from "@/lib/db/schema";

const mockLimit = vi.fn();
const mockOrderBy = vi.fn();
const mockWhere = vi.fn(() => ({ orderBy: mockOrderBy, limit: mockLimit }));
const mockFrom = vi.fn(() => ({ where: mockWhere }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

const { mockAsc, mockDesc, mockEq, mockAnd } = vi.hoisted(() => ({
  mockAsc: vi.fn(),
  mockDesc: vi.fn(),
  mockEq: vi.fn(),
  mockAnd: vi.fn(),
}));

vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    asc: (...args: Parameters<typeof actual.asc>) => {
      mockAsc(...args);
      return actual.asc(...args);
    },
    desc: (...args: Parameters<typeof actual.desc>) => {
      mockDesc(...args);
      return actual.desc(...args);
    },
    eq: (...args: Parameters<typeof actual.eq>) => {
      mockEq(...args);
      return actual.eq(...args);
    },
    and: (...args: Parameters<typeof actual.and>) => {
      mockAnd(...args);
      return actual.and(...args);
    },
  };
});

const getDb = vi.fn(() => ({
  select: mockSelect,
}));

vi.mock("@/lib/db/index", () => ({
  getDb,
}));

describe("listDictations", () => {
  const classId = "660e8400-e29b-41d4-a716-446655440001";

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("orders dictations by date descending then label ascending", async () => {
    mockOrderBy.mockResolvedValueOnce([
      {
        id: "880e8400-e29b-41d4-a716-446655440003",
        label: "Dictée B",
        dictationLabelKey: "dictée b",
        dictationDate: "2026-08-27",
      },
      {
        id: "770e8400-e29b-41d4-a716-446655440002",
        label: "Dictée A",
        dictationLabelKey: "dictée a",
        dictationDate: "2026-08-27",
      },
    ]);

    const { listDictations } = await import("./list-dictations");
    const result = await listDictations(classId);

    expect(mockSelect).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalledWith(dictations);
    expect(mockWhere).toHaveBeenCalled();
    expect(mockDesc).toHaveBeenCalledWith(dictations.dictationDate);
    expect(mockAsc).toHaveBeenCalledWith(dictations.label);
    expect(result).toEqual([
      {
        id: "880e8400-e29b-41d4-a716-446655440003",
        label: "Dictée B",
        dictationLabelKey: "dictée b",
        dictationDate: "2026-08-27",
      },
      {
        id: "770e8400-e29b-41d4-a716-446655440002",
        label: "Dictée A",
        dictationLabelKey: "dictée a",
        dictationDate: "2026-08-27",
      },
    ]);
  });
});

describe("getDictationById", () => {
  const classId = "660e8400-e29b-41d4-a716-446655440001";
  const dictationId = "880e8400-e29b-41d4-a716-446655440003";

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("scopes lookups to the authenticated class", async () => {
    mockLimit.mockResolvedValueOnce([
      {
        id: dictationId,
        label: "Dictée 1",
        dictationLabelKey: "dictée 1",
        dictationDate: "2026-08-27",
      },
    ]);

    const { getDictationById } = await import("./list-dictations");
    const result = await getDictationById(classId, dictationId);

    expect(mockAnd).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith(dictations.classId, classId);
    expect(mockEq).toHaveBeenCalledWith(dictations.id, dictationId);
    expect(result).toEqual({
      id: dictationId,
      label: "Dictée 1",
      dictationLabelKey: "dictée 1",
      dictationDate: "2026-08-27",
    });
  });

  it("returns null when the dictation is not in the class", async () => {
    mockLimit.mockResolvedValueOnce([]);

    const { getDictationById } = await import("./list-dictations");
    const result = await getDictationById(classId, dictationId);

    expect(result).toBeNull();
  });
});
