import { afterEach, describe, expect, it, vi } from "vitest";

import { REGISTRATION_ERROR_MESSAGE } from "@/lib/domain/registration";

const { redirect, registerTeacher, RegistrationFailedError } = vi.hoisted(() => {
  class MockRegistrationFailedError extends Error {
    constructor() {
      super("Unable to create account. Please check your details and try again.");
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
    const formData = new FormData();
    formData.set("email", "teacher@example.com");
    formData.set("password", "password12");

    await expect(
      registerAction({ error: null }, formData)
    ).rejects.toThrow("NEXT_REDIRECT:/login?registered=1");

    expect(redirect).toHaveBeenCalledWith("/login?registered=1");
  });

  it("returns the generic registration error when registration fails", async () => {
    registerTeacher.mockRejectedValueOnce(new RegistrationFailedError());

    const { registerAction } = await import("./actions");
    const formData = new FormData();
    formData.set("email", "teacher@example.com");
    formData.set("password", "password12");

    await expect(
      registerAction({ error: null }, formData)
    ).resolves.toEqual({ error: REGISTRATION_ERROR_MESSAGE });
  });
});
