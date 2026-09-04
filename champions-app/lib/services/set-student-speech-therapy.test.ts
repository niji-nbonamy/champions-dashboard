import { afterEach, describe, expect, it, vi } from "vitest";

import { students } from "@/lib/db/schema";

const mockLimit = vi.fn();
const mockWhere = vi.fn(() => ({ limit: mockLimit }));
const mockFrom = vi.fn(() => ({ where: mockWhere }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

const mockUpdateSet = vi.fn();
const mockUpdateWhere = vi.fn();
const mockUpdateReturning = vi.fn();
const mockUpdate = vi.fn(() => ({
  set: mockUpdateSet.mockReturnValue({
    where: mockUpdateWhere.mockReturnValue({
      returning: mockUpdateReturning,
    }),
  }),
}));

const getDb = vi.fn(() => ({
  select: mockSelect,
  update: mockUpdate,
}));

vi.mock("@/lib/db/index", () => ({
  getDb,
}));

describe("setStudentSpeechTherapy", () => {
  const classId = "660e8400-e29b-41d4-a716-446655440001";
  const studentId = "770e8400-e29b-41d4-a716-446655440002";

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("updates speech therapy when the value changes", async () => {
    mockLimit.mockResolvedValueOnce([
      {
        id: studentId,
        hasSpeechTherapy: false,
        archived: false,
      },
    ]);
    mockUpdateReturning.mockResolvedValueOnce([
      {
        id: studentId,
        hasSpeechTherapy: true,
      },
    ]);

    const { setStudentSpeechTherapy } = await import("./set-student-speech-therapy");
    const result = await setStudentSpeechTherapy(classId, studentId, true);

    expect(result).toEqual({
      studentId,
      hasSpeechTherapy: true,
      changed: true,
    });
    expect(mockUpdateSet).toHaveBeenCalledWith({ hasSpeechTherapy: true });
  });

  it("returns changed false when the value is already set", async () => {
    mockLimit.mockResolvedValueOnce([
      {
        id: studentId,
        hasSpeechTherapy: true,
        archived: false,
      },
    ]);

    const { setStudentSpeechTherapy } = await import("./set-student-speech-therapy");
    const result = await setStudentSpeechTherapy(classId, studentId, true);

    expect(result).toEqual({
      studentId,
      hasSpeechTherapy: true,
      changed: false,
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects archived students", async () => {
    mockLimit.mockResolvedValueOnce([
      {
        id: studentId,
        hasSpeechTherapy: true,
        archived: true,
      },
    ]);

    const { setStudentSpeechTherapy, StudentArchivedError } = await import(
      "./set-student-speech-therapy"
    );

    await expect(
      setStudentSpeechTherapy(classId, studentId, false)
    ).rejects.toBeInstanceOf(StudentArchivedError);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects unknown students", async () => {
    mockLimit.mockResolvedValueOnce([]);

    const { setStudentSpeechTherapy, StudentNotFoundError } = await import(
      "./set-student-speech-therapy"
    );

    await expect(
      setStudentSpeechTherapy(classId, studentId, true)
    ).rejects.toBeInstanceOf(StudentNotFoundError);
  });
});
