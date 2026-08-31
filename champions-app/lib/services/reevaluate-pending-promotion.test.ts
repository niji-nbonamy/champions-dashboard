import { afterEach, describe, expect, it, vi } from "vitest";

import { dictationEntries, pendingPromotions } from "@/lib/db/schema";

const mockLimit = vi.fn();
const mockOrderBy = vi.fn(() => ({ limit: mockLimit }));
const mockWhereSelect = vi.fn(() => ({ orderBy: mockOrderBy }));
const mockInnerJoin = vi.fn(() => ({ where: mockWhereSelect }));
const mockFromSelect = vi.fn(() => ({ innerJoin: mockInnerJoin, where: mockWhereSelect }));
const mockSelect = vi.fn(() => ({ from: mockFromSelect }));

const mockOnConflictDoNothing = vi.fn();
const mockValues = vi.fn(() => ({ onConflictDoNothing: mockOnConflictDoNothing }));
const mockInsert = vi.fn(() => ({ values: mockValues }));

const mockDeleteWhere = vi.fn();
const mockDelete = vi.fn(() => ({ where: mockDeleteWhere }));

const mockTransaction = vi.fn(
  async (callback: (tx: {
    select: typeof mockSelect;
    delete: typeof mockDelete;
    insert: typeof mockInsert;
  }) => Promise<unknown>) =>
    callback({
      select: mockSelect,
      delete: mockDelete,
      insert: mockInsert,
    })
);

const { mockEq, mockGt } = vi.hoisted(() => ({
  mockEq: vi.fn(),
  mockGt: vi.fn(),
}));

vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    eq: (...args: Parameters<typeof actual.eq>) => {
      mockEq(...args);
      return actual.eq(...args);
    },
    gt: (...args: Parameters<typeof actual.gt>) => {
      mockGt(...args);
      return actual.gt(...args);
    },
  };
});

const getDb = vi.fn(() => ({
  transaction: mockTransaction,
}));

vi.mock("@/lib/db/index", () => ({
  getDb,
}));

type MockDictationRow = {
  levelAtSave?: string;
  globalPercent: number;
  createdAt?: Date;
};

function mockNoRefusalThenDictations(
  dictationRows: Array<{ levelAtSave?: string; globalPercent: number }>
) {
  mockLimit.mockResolvedValueOnce([]).mockResolvedValueOnce(dictationRows);
}

function mockRefusalThenPostRefuseFilter(
  refusalDate: Date,
  dictationRows: MockDictationRow[]
) {
  mockLimit
    .mockResolvedValueOnce([{ occurredAt: refusalDate }])
    .mockImplementationOnce(() => {
      expect(mockGt).toHaveBeenCalledWith(
        dictationEntries.createdAt,
        refusalDate
      );
      const postRefuseRows = dictationRows
        .filter((row) => (row.createdAt ?? refusalDate) > refusalDate)
        .map(({ levelAtSave, globalPercent }) => ({
          levelAtSave: levelAtSave ?? "yellow",
          globalPercent,
        }));
      return Promise.resolve(postRefuseRows);
    });
}

describe("reevaluatePendingPromotionForCurrentLevel", () => {
  const classId = "660e8400-e29b-41d4-a716-446655440001";
  const studentId = "770e8400-e29b-41d4-a716-446655440002";

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("creates a pending promotion when recent dictations qualify from the new level", async () => {
    mockNoRefusalThenDictations([
      { globalPercent: 92 },
      { globalPercent: 91 },
    ]);
    mockDeleteWhere.mockResolvedValueOnce(undefined);
    mockOnConflictDoNothing.mockResolvedValueOnce(undefined);

    const { reevaluatePendingPromotionForCurrentLevel } = await import(
      "./reevaluate-pending-promotion"
    );

    await getDb().transaction(async (tx) => {
      await reevaluatePendingPromotionForCurrentLevel(
        tx,
        classId,
        studentId,
        "yellow"
      );
    });

    expect(mockDelete).toHaveBeenCalledOnce();
    expect(mockEq).toHaveBeenCalledWith(pendingPromotions.studentId, studentId);
    expect(mockValues).toHaveBeenCalledWith({
      studentId,
      targetLevel: "green",
    });
  });

  it("clears pending promotion when recent dictations do not qualify", async () => {
    mockNoRefusalThenDictations([
      { globalPercent: 90 },
      { globalPercent: 91 },
    ]);
    mockDeleteWhere.mockResolvedValueOnce(undefined);

    const { reevaluatePendingPromotionForCurrentLevel } = await import(
      "./reevaluate-pending-promotion"
    );

    await getDb().transaction(async (tx) => {
      await reevaluatePendingPromotionForCurrentLevel(
        tx,
        classId,
        studentId,
        "yellow"
      );
    });

    expect(mockDelete).toHaveBeenCalledOnce();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("does not recreate pending promotion from pre-refuse dictations (FR31)", async () => {
    const refusalDate = new Date("2026-03-15T12:00:00Z");
    mockRefusalThenPostRefuseFilter(refusalDate, [
      {
        levelAtSave: "yellow",
        globalPercent: 92,
        createdAt: new Date("2026-03-10T12:00:00Z"),
      },
      {
        levelAtSave: "yellow",
        globalPercent: 91,
        createdAt: new Date("2026-03-12T12:00:00Z"),
      },
    ]);
    mockDeleteWhere.mockResolvedValueOnce(undefined);

    const { reevaluatePendingPromotionForCurrentLevel } = await import(
      "./reevaluate-pending-promotion"
    );

    await getDb().transaction(async (tx) => {
      await reevaluatePendingPromotionForCurrentLevel(
        tx,
        classId,
        studentId,
        "yellow"
      );
    });

    expect(mockDelete).toHaveBeenCalledOnce();
    expect(mockInsert).not.toHaveBeenCalled();
  });
});

describe("reevaluatePendingPromotionFromDictationHistory", () => {
  const classId = "660e8400-e29b-41d4-a716-446655440001";
  const studentId = "770e8400-e29b-41d4-a716-446655440002";

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("uses levelAtSave from the most recent dictation entry", async () => {
    mockNoRefusalThenDictations([
      { levelAtSave: "yellow", globalPercent: 96 },
      { levelAtSave: "yellow", globalPercent: 95 },
    ]);
    mockDeleteWhere.mockResolvedValueOnce(undefined);
    mockOnConflictDoNothing.mockResolvedValueOnce(undefined);

    const { reevaluatePendingPromotionFromDictationHistory } = await import(
      "./reevaluate-pending-promotion"
    );

    await getDb().transaction(async (tx) => {
      await reevaluatePendingPromotionFromDictationHistory(
        tx,
        classId,
        studentId
      );
    });

    expect(mockValues).toHaveBeenCalledWith({
      studentId,
      targetLevel: "green",
    });
  });

  it("promotes green to violet when two post-refuse dictations qualify", async () => {
    mockNoRefusalThenDictations([
      { levelAtSave: "green", globalPercent: 92 },
      { levelAtSave: "green", globalPercent: 91 },
    ]);
    mockDeleteWhere.mockResolvedValueOnce(undefined);
    mockOnConflictDoNothing.mockResolvedValueOnce(undefined);

    const { reevaluatePendingPromotionFromDictationHistory } = await import(
      "./reevaluate-pending-promotion"
    );

    await getDb().transaction(async (tx) => {
      await reevaluatePendingPromotionFromDictationHistory(
        tx,
        classId,
        studentId
      );
    });

    expect(mockValues).toHaveBeenCalledWith({
      studentId,
      targetLevel: "violet",
    });
  });

  it("clears pending promotion when fewer than two dictations exist", async () => {
    mockNoRefusalThenDictations([{ levelAtSave: "yellow", globalPercent: 96 }]);
    mockDeleteWhere.mockResolvedValueOnce(undefined);

    const { reevaluatePendingPromotionFromDictationHistory } = await import(
      "./reevaluate-pending-promotion"
    );

    await getDb().transaction(async (tx) => {
      await reevaluatePendingPromotionFromDictationHistory(
        tx,
        classId,
        studentId
      );
    });

    expect(mockDelete).toHaveBeenCalledOnce();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("does not recreate pending promotion from pre-refuse dictations (FR31)", async () => {
    const refusalDate = new Date("2026-03-15T12:00:00Z");
    mockRefusalThenPostRefuseFilter(refusalDate, [
      {
        levelAtSave: "yellow",
        globalPercent: 92,
        createdAt: new Date("2026-03-10T12:00:00Z"),
      },
      {
        levelAtSave: "yellow",
        globalPercent: 91,
        createdAt: new Date("2026-03-12T12:00:00Z"),
      },
    ]);
    mockDeleteWhere.mockResolvedValueOnce(undefined);

    const { reevaluatePendingPromotionFromDictationHistory } = await import(
      "./reevaluate-pending-promotion"
    );

    await getDb().transaction(async (tx) => {
      await reevaluatePendingPromotionFromDictationHistory(
        tx,
        classId,
        studentId
      );
    });

    expect(mockDelete).toHaveBeenCalledOnce();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("uses the most recent refused history entry as FR31 cutoff", async () => {
    const latestRefusal = new Date("2026-03-15T12:00:00Z");
    mockRefusalThenPostRefuseFilter(latestRefusal, [
      {
        levelAtSave: "yellow",
        globalPercent: 92,
        createdAt: new Date("2026-03-10T12:00:00Z"),
      },
      {
        levelAtSave: "yellow",
        globalPercent: 91,
        createdAt: new Date("2026-03-12T12:00:00Z"),
      },
    ]);
    mockDeleteWhere.mockResolvedValueOnce(undefined);

    const { reevaluatePendingPromotionFromDictationHistory } = await import(
      "./reevaluate-pending-promotion"
    );

    await getDb().transaction(async (tx) => {
      await reevaluatePendingPromotionFromDictationHistory(
        tx,
        classId,
        studentId
      );
    });

    expect(mockGt).toHaveBeenCalledWith(
      dictationEntries.createdAt,
      latestRefusal
    );
    expect(mockDelete).toHaveBeenCalledOnce();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("recreates pending promotion after two new post-refuse qualifying dictations", async () => {
    const refusalDate = new Date("2026-03-15T12:00:00Z");
    mockRefusalThenPostRefuseFilter(refusalDate, [
      {
        levelAtSave: "yellow",
        globalPercent: 92,
        createdAt: new Date("2026-03-20T12:00:00Z"),
      },
      {
        levelAtSave: "yellow",
        globalPercent: 91,
        createdAt: new Date("2026-03-18T12:00:00Z"),
      },
    ]);
    mockDeleteWhere.mockResolvedValueOnce(undefined);
    mockOnConflictDoNothing.mockResolvedValueOnce(undefined);

    const { reevaluatePendingPromotionFromDictationHistory } = await import(
      "./reevaluate-pending-promotion"
    );

    await getDb().transaction(async (tx) => {
      await reevaluatePendingPromotionFromDictationHistory(
        tx,
        classId,
        studentId
      );
    });

    expect(mockValues).toHaveBeenCalledWith({
      studentId,
      targetLevel: "green",
    });
  });

  it("promotes violet to gold when two consecutive scores exceed 95%", async () => {
    mockNoRefusalThenDictations([
      { levelAtSave: "violet", globalPercent: 96 },
      { levelAtSave: "violet", globalPercent: 97 },
    ]);
    mockDeleteWhere.mockResolvedValueOnce(undefined);
    mockOnConflictDoNothing.mockResolvedValueOnce(undefined);

    const { reevaluatePendingPromotionFromDictationHistory } = await import(
      "./reevaluate-pending-promotion"
    );

    await getDb().transaction(async (tx) => {
      await reevaluatePendingPromotionFromDictationHistory(
        tx,
        classId,
        studentId
      );
    });

    expect(mockValues).toHaveBeenCalledWith({
      studentId,
      targetLevel: "gold",
    });
  });

  it("never creates pending promotion for gold students", async () => {
    mockNoRefusalThenDictations([
      { levelAtSave: "gold", globalPercent: 100 },
      { levelAtSave: "gold", globalPercent: 100 },
    ]);
    mockDeleteWhere.mockResolvedValueOnce(undefined);

    const { reevaluatePendingPromotionFromDictationHistory } = await import(
      "./reevaluate-pending-promotion"
    );

    await getDb().transaction(async (tx) => {
      await reevaluatePendingPromotionFromDictationHistory(
        tx,
        classId,
        studentId
      );
    });

    expect(mockDelete).toHaveBeenCalledOnce();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("does not promote with only one post-refuse dictation", async () => {
    mockLimit
      .mockResolvedValueOnce([{ occurredAt: new Date("2026-03-15T12:00:00Z") }])
      .mockResolvedValueOnce([{ levelAtSave: "yellow", globalPercent: 92 }]);
    mockDeleteWhere.mockResolvedValueOnce(undefined);

    const { reevaluatePendingPromotionFromDictationHistory } = await import(
      "./reevaluate-pending-promotion"
    );

    await getDb().transaction(async (tx) => {
      await reevaluatePendingPromotionFromDictationHistory(
        tx,
        classId,
        studentId
      );
    });

    expect(mockDelete).toHaveBeenCalledOnce();
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
