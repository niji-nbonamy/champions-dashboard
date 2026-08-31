import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const { auth, redirect } = vi.hoisted(() => ({
  auth: vi.fn(async () => null),
  redirect: vi.fn((url: string): never => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("@/auth", () => ({
  auth,
  signIn: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect,
}));

vi.mock("next/script", () => ({
  default: () => null,
}));

vi.mock("./login/actions", () => ({
  loginAction: vi.fn(),
}));

import LoginPage from "./login/page";
import RegisterPage from "./register/page";

describe("auth pages", () => {
  it("renders the registration page with the create-account form", () => {
    const html = renderToStaticMarkup(<RegisterPage />);

    expect(html).toContain("Créer un compte");
    expect(html).toContain('name="email"');
    expect(html).toContain('name="password"');
    expect(html).toContain('name="confirmPassword"');
    expect(html).toContain("Saisissez un mot de passe comportant au moins :");
  });

  it("shows registration success message on login when registered=1", async () => {
    const html = renderToStaticMarkup(
      await LoginPage({ searchParams: Promise.resolve({ registered: "1" }) })
    );

    expect(html).toContain(
      "Compte créé avec succès. Vous pouvez vous connecter."
    );
  });

  it("shows registration success when registered is provided as an array", async () => {
    const html = renderToStaticMarkup(
      await LoginPage({
        searchParams: Promise.resolve({ registered: ["1", "0"] }),
      })
    );

    expect(html).toContain(
      "Compte créé avec succès. Vous pouvez vous connecter."
    );
  });

  it("does not show registration success without query param", async () => {
    const html = renderToStaticMarkup(
      await LoginPage({ searchParams: Promise.resolve({}) })
    );

    expect(html).not.toContain(
      "Compte créé avec succès. Vous pouvez vous connecter."
    );
  });

  it("renders the login page with the sign-in form", async () => {
    const html = renderToStaticMarkup(
      await LoginPage({ searchParams: Promise.resolve({}) })
    );

    expect(html).toContain("Connexion");
    expect(html).toContain("text-display");
    expect(html).toContain('name="email"');
    expect(html).toContain('name="password"');
    expect(html).toContain('type="password"');
    expect(html).toContain("Créer un compte");
    expect(html).toContain("Afficher le mot de passe");
  });

  it("redirects authenticated users to callbackUrl when provided", async () => {
    auth.mockResolvedValueOnce({
      user: { id: "teacher-id", email: "teacher@example.com" },
      expires: "2099-01-01T00:00:00.000Z",
    });

    await expect(
      LoginPage({
        searchParams: Promise.resolve({ callbackUrl: "/students/abc" }),
      })
    ).rejects.toThrow("NEXT_REDIRECT:/students/abc");
  });

  it("redirects authenticated users away from login", async () => {
    auth.mockResolvedValueOnce({
      user: { id: "teacher-id", email: "teacher@example.com" },
      expires: "2099-01-01T00:00:00.000Z",
    });

    await expect(
      LoginPage({ searchParams: Promise.resolve({}) })
    ).rejects.toThrow("NEXT_REDIRECT:/dictations");
  });
});
