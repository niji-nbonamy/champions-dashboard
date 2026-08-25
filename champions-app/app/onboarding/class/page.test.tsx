import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const { auth, redirect, mockGetTeacherClass } = vi.hoisted(() => ({
  auth: vi.fn(),
  redirect: vi.fn((url: string): never => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  mockGetTeacherClass: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth,
}));

vi.mock("next/navigation", () => ({
  redirect,
}));

vi.mock("@/lib/services/get-teacher-class", () => ({
  getTeacherClass: mockGetTeacherClass,
}));

vi.mock("./class-form", () => ({
  ClassForm: () => <div data-testid="class-form" />,
}));

import OnboardingClassPage from "./page";

describe("onboarding class page", () => {
  it("redirects unauthenticated users to login", async () => {
    auth.mockResolvedValueOnce(null);

    await expect(OnboardingClassPage()).rejects.toThrow("NEXT_REDIRECT:/login");
  });

  it("redirects teachers with an existing class to dictations", async () => {
    auth.mockResolvedValueOnce({
      user: { id: "550e8400-e29b-41d4-a716-446655440000", email: "t@example.com" },
      expires: "2099-01-01T00:00:00.000Z",
    });
    mockGetTeacherClass.mockResolvedValueOnce({
      id: "660e8400-e29b-41d4-a716-446655440001",
      teacherId: "550e8400-e29b-41d4-a716-446655440000",
      schoolYearLabel: "2025-2026",
    });

    await expect(OnboardingClassPage()).rejects.toThrow("NEXT_REDIRECT:/dictations");
  });

  it("renders the French onboarding heading when no class exists", async () => {
    auth.mockResolvedValueOnce({
      user: { id: "550e8400-e29b-41d4-a716-446655440000", email: "t@example.com" },
      expires: "2099-01-01T00:00:00.000Z",
    });
    mockGetTeacherClass.mockResolvedValueOnce(null);

    const html = renderToStaticMarkup(await OnboardingClassPage());

    expect(html).toContain("Créer votre classe");
    expect(html).toContain("data-testid=\"class-form\"");
  });
});
