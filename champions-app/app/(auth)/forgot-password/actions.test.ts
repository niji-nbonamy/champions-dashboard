import { afterEach, describe, expect, it, vi } from "vitest";

const { requestPasswordReset, isAuthRateLimitAllowed, verifyRecaptchaToken, isRecaptchaRequired } =
  vi.hoisted(() => ({
    requestPasswordReset: vi.fn(async () => {}),
    isAuthRateLimitAllowed: vi.fn(async () => true),
    verifyRecaptchaToken: vi.fn(async () => true),
    isRecaptchaRequired: vi.fn(() => false),
  }));

vi.mock("@/lib/services/password-reset", () => ({
  requestPasswordReset,
}));

vi.mock("@/lib/services/auth-rate-limit", () => ({
  isAuthRateLimitAllowed,
}));

vi.mock("@/lib/services/recaptcha-verify", () => ({
  verifyRecaptchaToken,
  isRecaptchaRequired,
}));

describe("forgotPasswordAction", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("always returns submitted true for any email", async () => {
    const { forgotPasswordAction } = await import("./actions");
    const formData = new FormData();
    formData.set("email", "teacher@example.com");

    await expect(
      forgotPasswordAction({ submitted: false }, formData)
    ).resolves.toEqual({ submitted: true });

    expect(isAuthRateLimitAllowed).toHaveBeenCalledWith("password-reset");
    expect(requestPasswordReset).toHaveBeenCalledWith("teacher@example.com");
  });

  it("returns submitted true without calling reset when rate limited", async () => {
    isAuthRateLimitAllowed.mockResolvedValueOnce(false);

    const { forgotPasswordAction } = await import("./actions");
    const formData = new FormData();
    formData.set("email", "teacher@example.com");

    await expect(
      forgotPasswordAction({ submitted: false }, formData)
    ).resolves.toEqual({ submitted: true });

    expect(requestPasswordReset).not.toHaveBeenCalled();
  });

  it("returns submitted true without calling reset when recaptcha fails", async () => {
    isRecaptchaRequired.mockReturnValueOnce(true);
    verifyRecaptchaToken.mockResolvedValueOnce(false);

    const { forgotPasswordAction } = await import("./actions");
    const formData = new FormData();
    formData.set("email", "teacher@example.com");
    formData.set("recaptchaToken", "bad-token");

    await expect(
      forgotPasswordAction({ submitted: false }, formData)
    ).resolves.toEqual({ submitted: true });

    expect(requestPasswordReset).not.toHaveBeenCalled();
  });

  it("returns submitted true even when reset request throws", async () => {
    requestPasswordReset.mockRejectedValueOnce(new Error("email down"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { forgotPasswordAction } = await import("./actions");
    const formData = new FormData();
    formData.set("email", "teacher@example.com");

    await expect(
      forgotPasswordAction({ submitted: false }, formData)
    ).resolves.toEqual({ submitted: true });

    errorSpy.mockRestore();
  });

  it("returns submitted true when rate limit check throws", async () => {
    isAuthRateLimitAllowed.mockRejectedValueOnce(new Error("db down"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { forgotPasswordAction } = await import("./actions");
    const formData = new FormData();
    formData.set("email", "teacher@example.com");

    await expect(
      forgotPasswordAction({ submitted: false }, formData)
    ).resolves.toEqual({ submitted: true });

    expect(requestPasswordReset).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
