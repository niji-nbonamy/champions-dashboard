import { afterEach, describe, expect, it, vi } from "vitest";

import { REGISTRATION_ERROR_MESSAGE } from "@/lib/domain/registration";

const VALID_REGISTRATION_PASSWORD = "Password1!";

const { redirect, registerTeacher, RegistrationFailedError, verifyRecaptchaToken, isRecaptchaRequired, isAuthRateLimitAllowed } =
  vi.hoisted(() => {
    class MockRegistrationFailedError extends Error {
      constructor() {
        super(
          "Impossible de créer le compte. Vérifiez vos informations et réessayez."
        );
        this.name = "RegistrationFailedError";
      }
    }

    return {
      redirect: vi.fn((url: string): never => {
        const error = new Error(`NEXT_REDIRECT:${url}`);
        throw error;
      }),
      registerTeacher: vi.fn(),
      RegistrationFailedError: MockRegistrationFailedError,
      verifyRecaptchaToken: vi.fn(async () => true),
      isRecaptchaRequired: vi.fn(() => true),
      isAuthRateLimitAllowed: vi.fn(async () => true),
    };
  });

vi.mock("next/navigation", () => ({
  redirect,
}));

vi.mock("next/dist/client/components/redirect-error", () => ({
  isRedirectError: (error: unknown) =>
    error instanceof Error && error.message.startsWith("NEXT_REDIRECT:"),
}));

vi.mock("@/lib/services/register-teacher", () => ({
  registerTeacher,
  RegistrationFailedError,
}));

vi.mock("@/lib/services/recaptcha-verify", () => ({
  verifyRecaptchaToken,
  isRecaptchaRequired,
}));

vi.mock("@/lib/services/auth-rate-limit", () => ({
  isAuthRateLimitAllowed,
}));

function buildFormData(overrides?: Partial<Record<string, string>>) {
  const formData = new FormData();
  formData.set("email", overrides?.email ?? "teacher@example.com");
  formData.set("password", overrides?.password ?? VALID_REGISTRATION_PASSWORD);
  formData.set(
    "confirmPassword",
    overrides?.confirmPassword ?? VALID_REGISTRATION_PASSWORD
  );
  formData.set("recaptchaToken", overrides?.recaptchaToken ?? "token-123");
  return formData;
}

describe("registerAction", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to login with registered=1 after successful registration", async () => {
    registerTeacher.mockResolvedValueOnce({
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "teacher@example.com",
    });

    const { registerAction } = await import("./actions");

    await expect(
      registerAction({ error: null }, buildFormData())
    ).rejects.toThrow("NEXT_REDIRECT:/login?registered=1");

    expect(redirect).toHaveBeenCalledWith("/login?registered=1");
    expect(verifyRecaptchaToken).toHaveBeenCalledWith("token-123");
  });

  it("returns the generic registration error when passwords do not match", async () => {
    const { registerAction } = await import("./actions");

    await expect(
      registerAction(
        { error: null },
        buildFormData({ confirmPassword: "Password1?" })
      )
    ).resolves.toEqual({ error: REGISTRATION_ERROR_MESSAGE });

    expect(registerTeacher).not.toHaveBeenCalled();
  });

  it("returns the generic registration error when recaptcha verification fails", async () => {
    isRecaptchaRequired.mockReturnValueOnce(true);
    verifyRecaptchaToken.mockResolvedValueOnce(false);

    const { registerAction } = await import("./actions");

    await expect(
      registerAction({ error: null }, buildFormData())
    ).resolves.toEqual({ error: REGISTRATION_ERROR_MESSAGE });

    expect(registerTeacher).not.toHaveBeenCalled();
  });

  it("skips recaptcha verification when recaptcha is not configured", async () => {
    isRecaptchaRequired.mockReturnValueOnce(false);
    registerTeacher.mockResolvedValueOnce({
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "teacher@example.com",
    });

    const { registerAction } = await import("./actions");

    await expect(
      registerAction(
        { error: null },
        buildFormData({ recaptchaToken: "" })
      )
    ).rejects.toThrow("NEXT_REDIRECT:/login?registered=1");

    expect(verifyRecaptchaToken).not.toHaveBeenCalled();
  });

  it("returns the generic registration error when rate limited", async () => {
    isAuthRateLimitAllowed.mockResolvedValueOnce(false);

    const { registerAction } = await import("./actions");

    await expect(
      registerAction({ error: null }, buildFormData())
    ).resolves.toEqual({ error: REGISTRATION_ERROR_MESSAGE });

    expect(registerTeacher).not.toHaveBeenCalled();
  });

  it("returns the generic registration error when registration fails", async () => {
    registerTeacher.mockRejectedValueOnce(new RegistrationFailedError());

    const { registerAction } = await import("./actions");

    await expect(
      registerAction({ error: null }, buildFormData())
    ).resolves.toEqual({ error: REGISTRATION_ERROR_MESSAGE });
  });
});
