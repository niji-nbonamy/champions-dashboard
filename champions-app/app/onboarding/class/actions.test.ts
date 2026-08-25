import { afterEach, describe, expect, it, vi } from "vitest";

import { CLASS_ONBOARDING_ERROR_MESSAGE } from "@/lib/domain/class";

const { redirect, mockCreateClass, mockAuth, mockGetTeacherClass } = vi.hoisted(() => ({
  redirect: vi.fn((url: string): never => {
    const error = new Error(`NEXT_REDIRECT:${url}`);
    throw error;
  }),
  mockCreateClass: vi.fn(),
  mockAuth: vi.fn(),
  mockGetTeacherClass: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect,
}));

vi.mock("next/dist/client/components/redirect-error", () => ({
  isRedirectError: (error: unknown) =>
    error instanceof Error && error.message.startsWith("NEXT_REDIRECT:"),
}));

vi.mock("@/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/services/create-class", () => ({
  ClassCreationFailedError: class ClassCreationFailedError extends Error {
    constructor() {
      super(CLASS_ONBOARDING_ERROR_MESSAGE);
      this.name = "ClassCreationFailedError";
    }
  },
  createClass: mockCreateClass,
}));

vi.mock("@/lib/services/get-teacher-class", () => ({
  getTeacherClass: mockGetTeacherClass,
}));

describe("createClassAction", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated users to login", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { createClassAction } = await import("./actions");

    await expect(
      createClassAction({ error: null }, new FormData())
    ).rejects.toThrow("NEXT_REDIRECT:/login");

    expect(mockCreateClass).not.toHaveBeenCalled();
  });

  it("returns a French validation error for an empty label", async () => {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        email: "t@example.com",
      },
    });

    const { createClassAction } = await import("./actions");
    const result = await createClassAction({ error: null }, new FormData());

    expect(result.error).toBe("Indiquez l'année scolaire.");
    expect(mockCreateClass).not.toHaveBeenCalled();
  });

  it("redirects to dictations after successful class creation", async () => {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        email: "t@example.com",
      },
    });
    mockCreateClass.mockResolvedValueOnce({
      id: "660e8400-e29b-41d4-a716-446655440001",
      teacherId: "550e8400-e29b-41d4-a716-446655440000",
      schoolYearLabel: "2025-2026",
    });

    const { createClassAction } = await import("./actions");
    const formData = new FormData();
    formData.set("school_year_label", "2025-2026");

    await expect(
      createClassAction({ error: null }, formData)
    ).rejects.toThrow("NEXT_REDIRECT:/dictations");
  });

  it("returns a French error when class creation fails", async () => {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        email: "t@example.com",
      },
    });
    const { ClassCreationFailedError: ServiceError } = await import(
      "@/lib/services/create-class"
    );
    mockCreateClass.mockRejectedValueOnce(new ServiceError());
    mockGetTeacherClass.mockResolvedValueOnce(null);

    const { createClassAction } = await import("./actions");
    const formData = new FormData();
    formData.set("school_year_label", "2025-2026");

    const result = await createClassAction({ error: null }, formData);

    expect(result.error).toBe(CLASS_ONBOARDING_ERROR_MESSAGE);
  });

  it("redirects to dictations when creation fails but class already exists", async () => {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        email: "t@example.com",
      },
    });
    const { ClassCreationFailedError: ServiceError } = await import(
      "@/lib/services/create-class"
    );
    mockCreateClass.mockRejectedValueOnce(new ServiceError());
    mockGetTeacherClass.mockResolvedValueOnce({
      id: "660e8400-e29b-41d4-a716-446655440001",
      teacherId: "550e8400-e29b-41d4-a716-446655440000",
      schoolYearLabel: "2025-2026",
    });

    const { createClassAction } = await import("./actions");
    const formData = new FormData();
    formData.set("school_year_label", "2025-2026");

    await expect(
      createClassAction({ error: null }, formData)
    ).rejects.toThrow("NEXT_REDIRECT:/dictations");
  });
});
