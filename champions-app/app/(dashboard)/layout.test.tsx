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

import DashboardLayout from "./layout";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

describe("dashboard layout", () => {
  it("redirects unauthenticated users to login", async () => {
    auth.mockResolvedValueOnce(null);

    await expect(
      DashboardLayout({ children: <div>child</div> })
    ).rejects.toThrow("NEXT_REDIRECT:/login");
  });

  it("redirects authenticated teachers without a class to onboarding", async () => {
    auth.mockResolvedValueOnce({
      user: { id: "550e8400-e29b-41d4-a716-446655440000", email: "t@example.com" },
      expires: "2099-01-01T00:00:00.000Z",
    });
    mockGetTeacherClass.mockResolvedValueOnce(null);

    await expect(
      DashboardLayout({ children: <div>child</div> })
    ).rejects.toThrow("NEXT_REDIRECT:/onboarding/class");
  });

  it("renders children when the teacher already has a class", async () => {
    auth.mockResolvedValueOnce({
      user: { id: "550e8400-e29b-41d4-a716-446655440000", email: "t@example.com" },
      expires: "2099-01-01T00:00:00.000Z",
    });
    mockGetTeacherClass.mockResolvedValueOnce({
      id: "660e8400-e29b-41d4-a716-446655440001",
      teacherId: "550e8400-e29b-41d4-a716-446655440000",
      schoolYearLabel: "2025-2026",
    });

    const result = await DashboardLayout({ children: <div>child</div> });

    expect(result).toEqual(
      <DashboardShell>
        <div>child</div>
      </DashboardShell>
    );
  });
});
