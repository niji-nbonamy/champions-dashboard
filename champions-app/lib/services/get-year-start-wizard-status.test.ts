import { afterEach, describe, expect, it, vi } from "vitest";

const {
  mockLimit,
  mockWhere,
  mockFrom,
  mockSelect,
  mockCountActiveStudents,
  mockCountUnassignedActiveStudents,
  mockListWordCountMatrixRows,
} = vi.hoisted(() => {
  const mockLimit = vi.fn();
  const mockWhere = vi.fn(() => ({ limit: mockLimit }));
  const mockFrom = vi.fn(() => ({ where: mockWhere }));
  const mockSelect = vi.fn(() => ({ from: mockFrom }));

  return {
    mockLimit,
    mockWhere,
    mockFrom,
    mockSelect,
    mockCountActiveStudents: vi.fn(),
    mockCountUnassignedActiveStudents: vi.fn(),
    mockListWordCountMatrixRows: vi.fn(),
  };
});

vi.mock("@/lib/db/index", () => ({
  getDb: () => ({ select: mockSelect }),
}));

vi.mock("./count-active-students", () => ({
  countActiveStudents: mockCountActiveStudents,
}));

vi.mock("./count-unassigned-active-students", () => ({
  countUnassignedActiveStudents: mockCountUnassignedActiveStudents,
}));

vi.mock("./list-word-count-matrix-rows", () => ({
  listWordCountMatrixRows: mockListWordCountMatrixRows,
}));

import {
  getYearStartWizardStatus,
  resolveEarliestIncompleteWizardStep,
} from "./get-year-start-wizard-status";

describe("resolveEarliestIncompleteWizardStep", () => {
  it("returns step 1 when there are no active students", () => {
    expect(resolveEarliestIncompleteWizardStep(0, 0, 0)).toBe(1);
    expect(resolveEarliestIncompleteWizardStep(0, 2, 3)).toBe(1);
  });

  it("returns step 2 when students exist but some lack a level", () => {
    expect(resolveEarliestIncompleteWizardStep(3, 2, 0)).toBe(2);
    expect(resolveEarliestIncompleteWizardStep(1, 1, 5)).toBe(2);
  });

  it("returns step 3 when all students are leveled but the matrix is empty", () => {
    expect(resolveEarliestIncompleteWizardStep(4, 0, 0)).toBe(3);
  });

  it("returns step 3 when prerequisites are satisfied so the teacher can finish", () => {
    expect(resolveEarliestIncompleteWizardStep(4, 0, 2)).toBe(3);
  });
});

describe("getYearStartWizardStatus", () => {
  const classId = "660e8400-e29b-41d4-a716-446655440001";

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("marks the wizard complete when the class timestamp is set", async () => {
    mockLimit.mockResolvedValueOnce([
      { yearStartWizardCompletedAt: new Date("2026-01-01T00:00:00.000Z") },
    ]);
    mockCountActiveStudents.mockResolvedValueOnce(3);
    mockCountUnassignedActiveStudents.mockResolvedValueOnce(0);
    mockListWordCountMatrixRows.mockResolvedValueOnce([
      {
        dictationLabelKey: "dictée 1",
        wordsYellow: 10,
        wordsGreen: 12,
        wordsViolet: 14,
        wordsGold: 16,
      },
    ]);

    const status = await getYearStartWizardStatus(classId);

    expect(status.completed).toBe(true);
    expect(status.step).toBe(3);
    expect(status.activeStudentCount).toBe(3);
    expect(status.unassignedCount).toBe(0);
    expect(status.matrixRowCount).toBe(1);
  });

  it("counts only matrix rows with all four word counts greater than zero", async () => {
    mockLimit.mockResolvedValueOnce([{ yearStartWizardCompletedAt: null }]);
    mockCountActiveStudents.mockResolvedValueOnce(2);
    mockCountUnassignedActiveStudents.mockResolvedValueOnce(0);
    mockListWordCountMatrixRows.mockResolvedValueOnce([
      {
        dictationLabelKey: "complete",
        wordsYellow: 10,
        wordsGreen: 12,
        wordsViolet: 14,
        wordsGold: 16,
      },
      {
        dictationLabelKey: "partial",
        wordsYellow: 10,
        wordsGreen: 0,
        wordsViolet: 14,
        wordsGold: 16,
      },
    ]);

    const status = await getYearStartWizardStatus(classId);

    expect(status.completed).toBe(false);
    expect(status.matrixRowCount).toBe(1);
    expect(status.step).toBe(3);
  });
});
