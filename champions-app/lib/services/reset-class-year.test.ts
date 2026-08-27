import { afterEach, describe, expect, it, vi } from "vitest";

import {
  classes,
  dictations,
  levelHistoryEntries,
  students,
  wordCountMatrixRows,
} from "@/lib/db/schema";

const callOrder: string[] = [];

const mockClassSelectLimit = vi.fn();
const mockClassSelectWhere = vi.fn(() => ({ limit: mockClassSelectLimit }));
const mockClassSelectFrom = vi.fn(() => ({ where: mockClassSelectWhere }));
const mockClassSelect = vi.fn(() => ({ from: mockClassSelectFrom }));

const mockStudentSelectWhere = vi.fn();
const mockStudentSelectFrom = vi.fn(() => ({ where: mockStudentSelectWhere }));
const mockStudentSelect = vi.fn(() => ({ from: mockStudentSelectFrom }));

const mockDeleteLevelWhere = vi.fn();
const mockDeleteLevel = vi.fn(() => {
  callOrder.push("delete-level-history");
  return { where: mockDeleteLevelWhere };
});

const mockDeleteStudentsWhere = vi.fn();
const mockDeleteStudents = vi.fn(() => {
  callOrder.push("delete-students");
  return { where: mockDeleteStudentsWhere };
});

const mockDeleteMatrixWhere = vi.fn();
const mockDeleteMatrix = vi.fn(() => {
  callOrder.push("delete-matrix");
  return { where: mockDeleteMatrixWhere };
});

const mockDeleteDictationsWhere = vi.fn();
const mockDeleteDictations = vi.fn(() => {
  callOrder.push("delete-dictations");
  return { where: mockDeleteDictationsWhere };
});

const mockReturning = vi.fn();
const mockUpdateWhere = vi.fn(() => {
  callOrder.push("update-class");
  return { returning: mockReturning };
});
const mockSet = vi.fn(() => ({ where: mockUpdateWhere }));
const mockUpdate = vi.fn(() => ({ set: mockSet }));

const mockTransaction = vi.fn(
  async (callback: (tx: {
    select: typeof mockStudentSelect;
    delete: typeof mockDeleteLevel;
    update: typeof mockUpdate;
  }) => Promise<unknown>) => {
    const txDelete = vi.fn((table: unknown) => {
      if (table === levelHistoryEntries) {
        return mockDeleteLevel();
      }
      if (table === students) {
        return mockDeleteStudents();
      }
      if (table === dictations) {
        return mockDeleteDictations();
      }
      if (table === wordCountMatrixRows) {
        return mockDeleteMatrix();
      }
      throw new Error(`Unexpected delete table: ${String(table)}`);
    });

    mockStudentSelectWhere.mockImplementationOnce(() => {
      callOrder.push("select-students");
      return Promise.resolve([
        { id: "770e8400-e29b-41d4-a716-446655440002" },
      ]);
    });

    return callback({
      select: mockStudentSelect,
      delete: txDelete,
      update: mockUpdate,
    });
  }
);

const { mockEq, mockInArray } = vi.hoisted(() => ({
  mockEq: vi.fn(),
  mockInArray: vi.fn(),
}));

vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    eq: (...args: Parameters<typeof actual.eq>) => {
      mockEq(...args);
      return actual.eq(...args);
    },
    inArray: (...args: Parameters<typeof actual.inArray>) => {
      mockInArray(...args);
      return actual.inArray(...args);
    },
  };
});

const getDb = vi.fn(() => ({
  select: mockClassSelect,
  transaction: mockTransaction,
}));

vi.mock("@/lib/db/index", () => ({
  getDb,
}));

describe("resetClassYear", () => {
  const classId = "660e8400-e29b-41d4-a716-446655440001";
  const studentId = "770e8400-e29b-41d4-a716-446655440002";

  afterEach(() => {
    vi.clearAllMocks();
    callOrder.length = 0;
  });

  it("deletes level history before students inside one transaction", async () => {
    mockClassSelectLimit.mockResolvedValueOnce([{ id: classId }]);
    mockDeleteLevelWhere.mockResolvedValueOnce(undefined);
    mockDeleteStudentsWhere.mockResolvedValueOnce(undefined);
    mockDeleteDictationsWhere.mockResolvedValueOnce(undefined);
    mockDeleteMatrixWhere.mockResolvedValueOnce(undefined);
    mockReturning.mockResolvedValueOnce([{ id: classId }]);

    const { resetClassYear } = await import("./reset-class-year");
    await resetClassYear(classId, null);

    expect(mockTransaction).toHaveBeenCalled();
    expect(callOrder).toEqual([
      "select-students",
      "delete-level-history",
      "delete-students",
      "delete-dictations",
      "delete-matrix",
      "update-class",
    ]);
    expect(mockInArray).toHaveBeenCalledWith(
      levelHistoryEntries.studentId,
      [studentId]
    );
    expect(mockEq).toHaveBeenCalledWith(students.classId, classId);
    expect(mockEq).toHaveBeenCalledWith(dictations.classId, classId);
    expect(mockEq).toHaveBeenCalledWith(wordCountMatrixRows.classId, classId);
    expect(mockEq).toHaveBeenCalledWith(classes.id, classId);
  });

  it("updates the school year label when a new label is provided", async () => {
    mockClassSelectLimit.mockResolvedValueOnce([{ id: classId }]);
    mockDeleteLevelWhere.mockResolvedValueOnce(undefined);
    mockDeleteStudentsWhere.mockResolvedValueOnce(undefined);
    mockDeleteDictationsWhere.mockResolvedValueOnce(undefined);
    mockDeleteMatrixWhere.mockResolvedValueOnce(undefined);
    mockReturning.mockResolvedValueOnce([{ id: classId }]);

    const { resetClassYear } = await import("./reset-class-year");
    await resetClassYear(classId, "2026-2027");

    expect(mockSet).toHaveBeenCalledWith({
      yearStartRosterConfirmedAt: null,
      yearStartWizardCompletedAt: null,
      schoolYearLabel: "2026-2027",
    });
  });

  it("keeps the existing school year label when no new label is provided", async () => {
    mockClassSelectLimit.mockResolvedValueOnce([{ id: classId }]);
    mockDeleteLevelWhere.mockResolvedValueOnce(undefined);
    mockDeleteStudentsWhere.mockResolvedValueOnce(undefined);
    mockDeleteDictationsWhere.mockResolvedValueOnce(undefined);
    mockDeleteMatrixWhere.mockResolvedValueOnce(undefined);
    mockReturning.mockResolvedValueOnce([{ id: classId }]);

    const { resetClassYear } = await import("./reset-class-year");
    await resetClassYear(classId, null);

    expect(mockSet).toHaveBeenCalledWith({
      yearStartRosterConfirmedAt: null,
      yearStartWizardCompletedAt: null,
    });
    expect(mockSet).not.toHaveBeenCalledWith(
      expect.objectContaining({ schoolYearLabel: expect.any(String) })
    );
  });

  it("throws ClassNotFoundError when the class does not exist", async () => {
    mockClassSelectLimit.mockResolvedValueOnce([]);

    const { resetClassYear, ClassNotFoundError } = await import(
      "./reset-class-year"
    );

    await expect(resetClassYear(classId, null)).rejects.toThrow(
      ClassNotFoundError
    );
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("propagates transaction failures for rollback", async () => {
    mockClassSelectLimit.mockResolvedValueOnce([{ id: classId }]);
    mockTransaction.mockRejectedValueOnce(new Error("database down"));

    const { resetClassYear } = await import("./reset-class-year");

    await expect(resetClassYear(classId, null)).rejects.toThrow(
      "database down"
    );
  });

  it("throws ClassNotFoundError when the class row disappears during update", async () => {
    mockClassSelectLimit.mockResolvedValueOnce([{ id: classId }]);
    mockDeleteLevelWhere.mockResolvedValueOnce(undefined);
    mockDeleteStudentsWhere.mockResolvedValueOnce(undefined);
    mockDeleteDictationsWhere.mockResolvedValueOnce(undefined);
    mockDeleteMatrixWhere.mockResolvedValueOnce(undefined);
    mockReturning.mockResolvedValueOnce([]);

    const { resetClassYear, ClassNotFoundError } = await import(
      "./reset-class-year"
    );

    await expect(resetClassYear(classId, null)).rejects.toThrow(
      ClassNotFoundError
    );
  });

  it("succeeds for an empty class without deleting level history", async () => {
    mockClassSelectLimit.mockResolvedValueOnce([{ id: classId }]);
    mockTransaction.mockImplementationOnce(
      async (callback: (tx: {
        select: typeof mockStudentSelect;
        delete: ReturnType<typeof vi.fn>;
        update: typeof mockUpdate;
      }) => Promise<unknown>) => {
        const txDelete = vi.fn((table: unknown) => {
          if (table === students) {
            return mockDeleteStudents();
          }
          if (table === dictations) {
            return mockDeleteDictations();
          }
          if (table === wordCountMatrixRows) {
            return mockDeleteMatrix();
          }
          throw new Error(`Unexpected delete table: ${String(table)}`);
        });

        mockStudentSelectWhere.mockImplementationOnce(() => {
          callOrder.push("select-students");
          return Promise.resolve([]);
        });

        return callback({
          select: mockStudentSelect,
          delete: txDelete,
          update: mockUpdate,
        });
      }
    );
    mockDeleteStudentsWhere.mockResolvedValueOnce(undefined);
    mockDeleteDictationsWhere.mockResolvedValueOnce(undefined);
    mockDeleteMatrixWhere.mockResolvedValueOnce(undefined);
    mockReturning.mockResolvedValueOnce([{ id: classId }]);

    const { resetClassYear } = await import("./reset-class-year");
    await resetClassYear(classId, null);

    expect(callOrder).toEqual([
      "select-students",
      "delete-students",
      "delete-dictations",
      "delete-matrix",
      "update-class",
    ]);
    expect(mockDeleteLevel).not.toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledWith(classes);
    expect(mockEq).toHaveBeenCalledWith(classes.id, classId);
  });
});
