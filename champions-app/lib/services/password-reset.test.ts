import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";

const VALID_PASSWORD = "Password1!";

const mockLimit = vi.fn();
const mockWhere = vi.fn(() => ({ limit: mockLimit }));
const mockFrom = vi.fn(() => ({ where: mockWhere }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

const mockInsertReturning = vi.fn();
const mockUpdateReturning = vi.fn();
const mockDeleteWhere = vi.fn().mockResolvedValue(undefined);
const mockDelete = vi.fn(() => ({ where: mockDeleteWhere }));
const mockValues = vi.fn(() => ({ returning: mockInsertReturning }));
const mockInsert = vi.fn(() => ({ values: mockValues }));

const mockSet = vi.fn(() => ({ where: vi.fn(() => ({ returning: mockUpdateReturning })) }));
const mockUpdate = vi.fn(() => ({ set: mockSet }));

const mockTransaction = vi.fn();

const getDb = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
  transaction: mockTransaction,
}));

const sendPasswordResetEmail = vi.fn(async () => {});
const isEmailSendingConfigured = vi.fn(() => true);

vi.mock("@/lib/db/index", () => ({
  getDb,
}));

vi.mock("./send-transactional-email", () => ({
  isEmailSendingConfigured,
  sendTransactionalEmail: vi.fn(),
}));

vi.mock("./send-password-reset-email", () => ({
  sendPasswordResetEmail,
}));

describe("password reset service", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    delete process.env.NODE_ENV;
  });

  it("generates a 64-character hex token", async () => {
    const { generateRawResetToken } = await import("./password-reset");

    expect(generateRawResetToken()).toMatch(/^[a-f0-9]{64}$/);
  });

  it("stores only the SHA-256 hash when requesting a reset for a known teacher", async () => {
    process.env.NODE_ENV = "development";
    mockLimit.mockResolvedValueOnce([
      { id: "teacher-id", email: "teacher@example.com" },
    ]);
    mockUpdateReturning.mockResolvedValueOnce(undefined);
    mockInsertReturning.mockResolvedValueOnce([{ id: "token-id" }]);

    const { requestPasswordReset } = await import("./password-reset");

    await requestPasswordReset("teacher@example.com");

    const rawToken = sendPasswordResetEmail.mock.calls[0]?.[1] as string;
    const expectedHash = createHash("sha256").update(rawToken).digest("hex");

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        teacherId: "teacher-id",
        tokenHash: expectedHash,
        expiresAt: expect.any(Date),
      })
    );
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(
      "teacher@example.com",
      rawToken
    );
  });

  it("does not create a token for unknown emails", async () => {
    mockLimit.mockResolvedValueOnce([]);

    const { requestPasswordReset } = await import("./password-reset");

    await requestPasswordReset("unknown@example.com");

    expect(mockInsert).not.toHaveBeenCalled();
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("does not create a token in production when email sending is not configured", async () => {
    process.env.NODE_ENV = "production";
    isEmailSendingConfigured.mockReturnValueOnce(false);

    mockLimit.mockResolvedValueOnce([
      { id: "teacher-id", email: "teacher@example.com" },
    ]);

    const { requestPasswordReset } = await import("./password-reset");

    await requestPasswordReset("teacher@example.com");

    expect(mockInsert).not.toHaveBeenCalled();
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("returns null for an empty token", async () => {
    const { findValidPasswordResetToken } = await import("./password-reset");

    await expect(findValidPasswordResetToken("")).resolves.toBeNull();
    expect(mockLimit).not.toHaveBeenCalled();
  });

  it("expires reset tokens after 60 minutes", async () => {
    const { getResetTokenExpiry } = await import("./password-reset");
    const now = new Date("2026-01-01T00:00:00.000Z");

    expect(getResetTokenExpiry(now)).toEqual(
      new Date("2026-01-01T01:00:00.000Z")
    );
  });

  it("rejects weak passwords during completion", async () => {
    const { completePasswordReset, PasswordResetFailedError } = await import(
      "./password-reset"
    );

    await expect(
      completePasswordReset("a".repeat(64), "short", "short")
    ).rejects.toThrow(PasswordResetFailedError);
  });

  it("returns null when no matching token row exists", async () => {
    mockLimit.mockResolvedValueOnce([]);

    const { findValidPasswordResetToken } = await import("./password-reset");

    await expect(findValidPasswordResetToken("bad-token")).resolves.toBeNull();
  });

  it("returns a valid token record when hash, expiry, and usage match", async () => {
    const rawToken = "a".repeat(64);
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");

    mockLimit.mockResolvedValueOnce([
      { tokenId: "token-id", teacherId: "teacher-id" },
    ]);

    const { findValidPasswordResetToken } = await import("./password-reset");
    const result = await findValidPasswordResetToken(rawToken);

    expect(result).toEqual({
      tokenId: "token-id",
      teacherId: "teacher-id",
    });
    expect(mockWhere).toHaveBeenCalled();
    expect(tokenHash).toHaveLength(64);
  });

  it("completes a password reset and marks the token used", async () => {
    const rawToken = "b".repeat(64);

    mockLimit.mockResolvedValueOnce([
      { tokenId: "token-id", teacherId: "teacher-id" },
    ]);

    const tokenUpdateReturning = vi
      .fn()
      .mockResolvedValueOnce([{ id: "token-id" }]);
    const teacherUpdateReturning = vi
      .fn()
      .mockResolvedValueOnce([{ id: "teacher-id" }]);
    const tokenUpdateWhere = vi.fn(() => ({ returning: tokenUpdateReturning }));
    const teacherUpdateWhere = vi.fn(() => ({
      returning: teacherUpdateReturning,
    }));
    const tokenUpdateSet = vi.fn(() => ({ where: tokenUpdateWhere }));
    const teacherUpdateSet = vi.fn(() => ({ where: teacherUpdateWhere }));
    const invalidateWhere = vi.fn().mockResolvedValueOnce(undefined);
    const invalidateSet = vi.fn(() => ({ where: invalidateWhere }));

    mockTransaction.mockImplementationOnce(async (callback) =>
      callback({
        update: vi
          .fn()
          .mockImplementationOnce(() => ({ set: tokenUpdateSet }))
          .mockImplementationOnce(() => ({ set: teacherUpdateSet }))
          .mockImplementationOnce(() => ({ set: invalidateSet })),
      })
    );

    const { completePasswordReset } = await import("./password-reset");

    await completePasswordReset(rawToken, VALID_PASSWORD, VALID_PASSWORD);

    expect(mockTransaction).toHaveBeenCalled();
    expect(tokenUpdateSet).toHaveBeenCalledWith({ usedAt: expect.any(Date) });
    expect(teacherUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        passwordHash: expect.any(String),
      })
    );
  });

  it("deletes the token when email delivery fails", async () => {
    process.env.NODE_ENV = "development";
    mockLimit.mockResolvedValueOnce([
      { id: "teacher-id", email: "teacher@example.com" },
    ]);
    mockInsertReturning.mockResolvedValueOnce([{ id: "token-id" }]);
    sendPasswordResetEmail.mockRejectedValueOnce(new Error("send failed"));

    const { requestPasswordReset } = await import("./password-reset");

    await expect(
      requestPasswordReset("teacher@example.com")
    ).rejects.toThrow("send failed");

    expect(mockDelete).toHaveBeenCalled();
    expect(mockDeleteWhere).toHaveBeenCalled();
  });

  it("throws when passwords do not match", async () => {
    const { completePasswordReset, PasswordResetFailedError } = await import(
      "./password-reset"
    );

    await expect(
      completePasswordReset("token", VALID_PASSWORD, "Password1?")
    ).rejects.toThrow(PasswordResetFailedError);
  });
});
