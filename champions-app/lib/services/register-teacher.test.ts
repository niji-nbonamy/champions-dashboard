import { afterEach, describe, expect, it, vi } from "vitest";

import { REGISTRATION_ERROR_MESSAGE } from "@/lib/domain/registration";

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

vi.mock("@/lib/db/index", () => ({
  getDb,
}));

describe("registerTeacher", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("creates a teacher with hashed password for valid input", async () => {
    mockLimit.mockResolvedValueOnce([]);
    mockReturning.mockResolvedValueOnce([
      { id: "teacher-uuid", email: "teacher@example.com" },
    ]);

    const { registerTeacher } = await import("./register-teacher");
    const result = await registerTeacher("Teacher@Example.com", "password12");

    expect(result).toEqual({
      id: "teacher-uuid",
      email: "teacher@example.com",
    });
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "teacher@example.com",
        passwordHash: expect.not.stringMatching(/^password12$/),
      })
    );
  });

  it("throws a generic error when email is already registered", async () => {
    mockLimit.mockResolvedValueOnce([{ id: "existing-id" }]);

    const { registerTeacher, RegistrationFailedError } = await import(
      "./register-teacher"
    );

    await expect(
      registerTeacher("teacher@example.com", "password12")
    ).rejects.toMatchObject({
      name: "RegistrationFailedError",
      message: REGISTRATION_ERROR_MESSAGE,
    });

    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("throws a generic error for invalid input without querying the database", async () => {
    const { registerTeacher, RegistrationFailedError } = await import(
      "./register-teacher"
    );

    await expect(registerTeacher("bad-email", "password12")).rejects.toThrow(
      RegistrationFailedError
    );

    expect(getDb).not.toHaveBeenCalled();
  });

  it("throws a generic error when insert returns no row", async () => {
    mockLimit.mockResolvedValueOnce([]);
    mockReturning.mockResolvedValueOnce([]);

    const { registerTeacher, RegistrationFailedError } = await import(
      "./register-teacher"
    );

    await expect(
      registerTeacher("teacher@example.com", "password12")
    ).rejects.toThrow(REGISTRATION_ERROR_MESSAGE);
  });

  it("throws a generic error when the database insert fails", async () => {
    mockLimit.mockResolvedValueOnce([]);
    mockValues.mockImplementationOnce(() => {
      throw new Error("db down");
    });

    const { registerTeacher, RegistrationFailedError } = await import(
      "./register-teacher"
    );

    await expect(
      registerTeacher("teacher@example.com", "password12")
    ).rejects.toThrow(RegistrationFailedError);
  });
});
