import { afterEach, describe, expect, it, vi } from "vitest";

const mockLimit = vi.fn();
const mockWhere = vi.fn(() => ({ limit: mockLimit }));
const mockFrom = vi.fn(() => ({ where: mockWhere }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

const mockReturning = vi.fn();
const mockUpdateWhere = vi.fn(() => ({ returning: mockReturning }));
const mockSet = vi.fn(() => ({ where: mockUpdateWhere }));
const mockUpdate = vi.fn(() => ({ set: mockSet }));

const mockGetYearStartWizardStatus = vi.fn();

const getDb = vi.fn(() => ({
  select: mockSelect,
  update: mockUpdate,
}));

vi.mock("@/lib/db/index", () => ({
  getDb,
}));

vi.mock("./get-year-start-wizard-status", () => ({
  getYearStartWizardStatus: mockGetYearStartWizardStatus,
}));

describe("completeYearStartWizard", () => {
  const classId = "660e8400-e29b-41d4-a716-446655440001";

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("sets the completion timestamp when the wizard is not yet complete", async () => {
    const completedAt = new Date("2026-08-26T10:00:00.000Z");

    mockLimit.mockResolvedValueOnce([{ yearStartWizardCompletedAt: null }]);
    mockGetYearStartWizardStatus.mockResolvedValueOnce({
      completed: false,
      step: 3,
      activeStudentCount: 2,
      unassignedCount: 0,
      matrixRowCount: 1,
    });
    mockReturning.mockResolvedValueOnce([
      { yearStartWizardCompletedAt: completedAt },
    ]);

    const { completeYearStartWizard } = await import(
      "./complete-year-start-wizard"
    );
    const result = await completeYearStartWizard(classId);

    expect(result.alreadyComplete).toBe(false);
    expect(result.completedAt).toEqual(completedAt);
    expect(mockSet).toHaveBeenCalledWith({
      yearStartWizardCompletedAt: expect.any(Date),
    });
  });

  it("returns the existing timestamp without updating when already complete", async () => {
    const completedAt = new Date("2026-01-01T00:00:00.000Z");

    mockLimit.mockResolvedValueOnce([
      { yearStartWizardCompletedAt: completedAt },
    ]);

    const { completeYearStartWizard } = await import(
      "./complete-year-start-wizard"
    );
    const result = await completeYearStartWizard(classId);

    expect(result).toEqual({
      completedAt,
      alreadyComplete: true,
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns the timestamp after a concurrent completion wins the update", async () => {
    const completedAt = new Date("2026-01-02T00:00:00.000Z");

    mockLimit
      .mockResolvedValueOnce([{ yearStartWizardCompletedAt: null }])
      .mockResolvedValueOnce([{ yearStartWizardCompletedAt: completedAt }]);
    mockGetYearStartWizardStatus.mockResolvedValueOnce({
      completed: false,
      step: 3,
      activeStudentCount: 2,
      unassignedCount: 0,
      matrixRowCount: 1,
    });
    mockReturning.mockResolvedValueOnce([]);

    const { completeYearStartWizard } = await import(
      "./complete-year-start-wizard"
    );
    const result = await completeYearStartWizard(classId);

    expect(result).toEqual({
      completedAt,
      alreadyComplete: true,
    });
  });

  it("rejects completion when prerequisites are not met", async () => {
    mockLimit.mockResolvedValueOnce([{ yearStartWizardCompletedAt: null }]);
    mockGetYearStartWizardStatus.mockResolvedValueOnce({
      completed: false,
      step: 3,
      activeStudentCount: 2,
      unassignedCount: 0,
      matrixRowCount: 0,
    });

    const { completeYearStartWizard } = await import(
      "./complete-year-start-wizard"
    );

    await expect(completeYearStartWizard(classId)).rejects.toThrow(
      "Enregistrez au moins une dictée complète dans la matrice."
    );
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects completion when students still lack a level", async () => {
    mockLimit.mockResolvedValueOnce([{ yearStartWizardCompletedAt: null }]);
    mockGetYearStartWizardStatus.mockResolvedValueOnce({
      completed: false,
      step: 2,
      activeStudentCount: 2,
      unassignedCount: 1,
      matrixRowCount: 1,
    });

    const { completeYearStartWizard } = await import(
      "./complete-year-start-wizard"
    );

    await expect(completeYearStartWizard(classId)).rejects.toThrow(
      "Assignez un niveau à chaque élève avant de terminer la configuration."
    );
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects completion when the roster is empty", async () => {
    mockLimit.mockResolvedValueOnce([{ yearStartWizardCompletedAt: null }]);
    mockGetYearStartWizardStatus.mockResolvedValueOnce({
      completed: false,
      step: 1,
      activeStudentCount: 0,
      unassignedCount: 0,
      matrixRowCount: 0,
    });

    const { completeYearStartWizard } = await import(
      "./complete-year-start-wizard"
    );

    await expect(completeYearStartWizard(classId)).rejects.toThrow(
      "Ajoutez au moins un élève avant de terminer la configuration."
    );
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
