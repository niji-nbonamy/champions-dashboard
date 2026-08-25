import { afterEach, describe, expect, it, vi } from "vitest";

import { LOGIN_ERROR_MESSAGE } from "@/lib/domain/authentication";

const { redirect, signIn } = vi.hoisted(() => ({
  redirect: vi.fn((url: string): never => {
    const error = new Error(`NEXT_REDIRECT:${url}`);
    throw error;
  }),
  signIn: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect,
}));

vi.mock("next/dist/client/components/redirect-error", () => ({
  isRedirectError: (error: unknown) =>
    error instanceof Error && error.message.startsWith("NEXT_REDIRECT:"),
}));

vi.mock("@/auth", () => ({
  signIn,
}));

vi.mock("next-auth", () => ({
  AuthError: class AuthError extends Error {
    constructor() {
      super("Auth error");
      this.name = "AuthError";
    }
  },
}));

describe("loginAction", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to dictations after successful sign in", async () => {
    signIn.mockImplementationOnce(() => {
      redirect("/dictations");
    });

    const { loginAction } = await import("./actions");
    const formData = new FormData();
    formData.set("email", "teacher@example.com");
    formData.set("password", "password12");

    await expect(loginAction({ error: null }, formData)).rejects.toThrow(
      "NEXT_REDIRECT:/dictations"
    );

    expect(signIn).toHaveBeenCalledWith("credentials", {
      email: "teacher@example.com",
      password: "password12",
      redirectTo: "/dictations",
    });
  });

  it("returns the generic login error when sign in resolves without redirect", async () => {
    signIn.mockResolvedValueOnce(undefined);

    const { loginAction } = await import("./actions");
    const formData = new FormData();
    formData.set("email", "teacher@example.com");
    formData.set("password", "password12");

    await expect(loginAction({ error: null }, formData)).resolves.toEqual({
      error: LOGIN_ERROR_MESSAGE,
    });
  });

  it("returns the generic login error when sign in fails", async () => {
    const { AuthError } = await import("next-auth");
    signIn.mockRejectedValueOnce(new AuthError());

    const { loginAction } = await import("./actions");
    const formData = new FormData();
    formData.set("email", "teacher@example.com");
    formData.set("password", "wrongpassword");

    await expect(loginAction({ error: null }, formData)).resolves.toEqual({
      error: LOGIN_ERROR_MESSAGE,
    });
  });

  it("returns the generic login error for unexpected sign in failures", async () => {
    signIn.mockRejectedValueOnce(new Error("network down"));

    const { loginAction } = await import("./actions");
    const formData = new FormData();
    formData.set("email", "teacher@example.com");
    formData.set("password", "password12");

    await expect(loginAction({ error: null }, formData)).resolves.toEqual({
      error: LOGIN_ERROR_MESSAGE,
    });
  });

  it("rethrows redirect errors from sign in", async () => {
    signIn.mockImplementationOnce(() => {
      redirect("/dictations");
    });

    const { loginAction } = await import("./actions");
    const formData = new FormData();
    formData.set("email", "teacher@example.com");
    formData.set("password", "password12");

    await expect(loginAction({ error: null }, formData)).rejects.toThrow(
      "NEXT_REDIRECT:/dictations"
    );
  });
});
