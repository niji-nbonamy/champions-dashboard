import { afterEach, describe, expect, it, vi } from "vitest";

import { RESET_INVALID_TOKEN_MESSAGE, RESET_PASSWORD_ERROR_MESSAGE } from "@/lib/domain/password-reset";

const VALID_PASSWORD = "Password1!";

const { redirect, completePasswordReset, findValidPasswordResetToken, PasswordResetFailedError } =
  vi.hoisted(() => {
    class MockPasswordResetFailedError extends Error {
      constructor(message = RESET_PASSWORD_ERROR_MESSAGE) {
        super(message);
        this.name = "PasswordResetFailedError";
      }
    }

    return {
      redirect: vi.fn((url: string): never => {
        throw new Error(`NEXT_REDIRECT:${url}`);
      }),
      completePasswordReset: vi.fn(),
      findValidPasswordResetToken: vi.fn(async () => ({
        tokenId: "token-id",
        teacherId: "teacher-id",
      })),
      PasswordResetFailedError: MockPasswordResetFailedError,
    };
  });

vi.mock("next/navigation", () => ({
  redirect,
}));

vi.mock("next/dist/client/components/redirect-error", () => ({
  isRedirectError: (error: unknown) =>
    error instanceof Error && error.message.startsWith("NEXT_REDIRECT:"),
}));

vi.mock("@/lib/services/password-reset", () => ({
  completePasswordReset,
  findValidPasswordResetToken,
  PasswordResetFailedError,
}));

function buildFormData(overrides?: Partial<Record<string, string>>) {
  const formData = new FormData();
  formData.set("token", overrides?.token ?? "a".repeat(64));
  formData.set("password", overrides?.password ?? VALID_PASSWORD);
  formData.set(
    "confirmPassword",
    overrides?.confirmPassword ?? VALID_PASSWORD
  );
  return formData;
}

describe("resetPasswordAction", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to login with passwordUpdated=1 after a successful reset", async () => {
    completePasswordReset.mockResolvedValueOnce(undefined);

    const { resetPasswordAction } = await import("./actions");

    await expect(
      resetPasswordAction({ error: null }, buildFormData())
    ).rejects.toThrow("NEXT_REDIRECT:/login?passwordUpdated=1");

    expect(redirect).toHaveBeenCalledWith("/login?passwordUpdated=1");
  });

  it("returns a generic error when passwords do not match", async () => {
    const { resetPasswordAction } = await import("./actions");

    await expect(
      resetPasswordAction(
        { error: null },
        buildFormData({ confirmPassword: "Password1?" })
      )
    ).resolves.toEqual({ error: RESET_PASSWORD_ERROR_MESSAGE });

    expect(completePasswordReset).not.toHaveBeenCalled();
  });

  it("returns invalid token message when completion fails and token is no longer valid", async () => {
    completePasswordReset.mockRejectedValueOnce(
      new PasswordResetFailedError()
    );
    findValidPasswordResetToken.mockResolvedValueOnce(null);

    const { resetPasswordAction } = await import("./actions");

    await expect(
      resetPasswordAction({ error: null }, buildFormData())
    ).resolves.toEqual({ error: RESET_INVALID_TOKEN_MESSAGE });
  });
});
