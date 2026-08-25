import { afterEach, describe, expect, it, vi } from "vitest";

import { CLASS_ONBOARDING_ERROR_MESSAGE } from "@/lib/domain/class";

const mockLimit = vi.fn();
const mockWhere = vi.fn(() => ({ limit: mockLimit }));
const mockFrom = vi.fn(() => ({ where: mockWhere }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

const mockReturning = vi.fn();
const mockValues = vi.fn(() => ({ returning: mockReturning }));
const mockInsert = vi.fn(() => ({ values: mockValues }));

const getDb = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
}));

const mockGetTeacherClass = vi.fn();

vi.mock("@/lib/db/index", () => ({
  getDb,
}));

vi.mock("./get-teacher-class", () => ({
  getTeacherClass: mockGetTeacherClass,
}));

describe("createClass", () => {
  const teacherId = "550e8400-e29b-41d4-a716-446655440000";
  const classId = "660e8400-e29b-41d4-a716-446655440001";

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("creates a class for a teacher without one", async () => {
    mockGetTeacherClass.mockResolvedValueOnce(null);
    mockReturning.mockResolvedValueOnce([
      {
        id: classId,
        teacherId,
        schoolYearLabel: "2025-2026",
      },
    ]);

    const { createClass } = await import("./create-class");
    const result = await createClass(teacherId, "  2025-2026  ");

    expect(result).toEqual({
      id: classId,
      teacherId,
      schoolYearLabel: "2025-2026",
    });
    expect(mockValues).toHaveBeenCalledWith({
      teacherId,
      schoolYearLabel: "2025-2026",
    });
  });

  it("throws when the school year label is empty", async () => {
    const { createClass, ClassCreationFailedError } = await import(
      "./create-class"
    );

    await expect(createClass(teacherId, "   ")).rejects.toMatchObject({
      name: "ClassCreationFailedError",
      message: CLASS_ONBOARDING_ERROR_MESSAGE,
    });

    expect(mockGetTeacherClass).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("throws when the teacher already has a class", async () => {
    mockGetTeacherClass.mockResolvedValueOnce({
      id: classId,
      teacherId,
      schoolYearLabel: "2024-2025",
    });

    const { createClass, ClassCreationFailedError } = await import(
      "./create-class"
    );

    await expect(createClass(teacherId, "2025-2026")).rejects.toMatchObject({
      name: "ClassCreationFailedError",
      message: CLASS_ONBOARDING_ERROR_MESSAGE,
    });

    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("throws a generic error when insert fails and a class already exists", async () => {
    mockGetTeacherClass.mockResolvedValueOnce(null);
    mockReturning.mockRejectedValueOnce(new Error("duplicate key"));
    mockLimit.mockResolvedValueOnce([{ id: classId }]);

    const { createClass, ClassCreationFailedError } = await import(
      "./create-class"
    );

    await expect(createClass(teacherId, "2025-2026")).rejects.toMatchObject({
      name: "ClassCreationFailedError",
      message: CLASS_ONBOARDING_ERROR_MESSAGE,
    });
  });
});
