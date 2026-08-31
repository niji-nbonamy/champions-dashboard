import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  auth,
  redirect,
  mockGetTeacherClass,
  mockListPendingPromotionQueueForClass,
} = vi.hoisted(() => ({
  auth: vi.fn(),
  redirect: vi.fn((url: string): never => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  mockGetTeacherClass: vi.fn(),
  mockListPendingPromotionQueueForClass: vi.fn(),
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

vi.mock("@/lib/services/list-pending-promotion-queue", () => ({
  listPendingPromotionQueueForClass: mockListPendingPromotionQueueForClass,
}));

vi.mock("@/components/promotion/alerts-promotion-queue", () => ({
  AlertsPromotionQueue: ({
    items,
  }: {
    items: Array<{ studentId: string; displayName: string; targetLevel: string }>;
  }) => (
    <div
      data-testid="alerts-promotion-queue"
      data-count={items.length}
      data-students={items.map((item) => item.displayName).join(",")}
    />
  ),
}));

import AlertsPage from "./page";

describe("AlertsPage", () => {
  const classId = "660e8400-e29b-41d4-a716-446655440001";

  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockResolvedValue({
      user: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        email: "t@example.com",
      },
      expires: "2099-01-01T00:00:00.000Z",
    });
    mockGetTeacherClass.mockResolvedValue({
      id: classId,
      teacherId: "550e8400-e29b-41d4-a716-446655440000",
      schoolYearLabel: "2025-2026",
    });
  });

  it("redirects unauthenticated users to login", async () => {
    auth.mockResolvedValueOnce(null);

    await expect(AlertsPage()).rejects.toThrow("NEXT_REDIRECT:/login");
  });

  it("redirects teachers without a class to onboarding", async () => {
    mockGetTeacherClass.mockResolvedValueOnce(null);

    await expect(AlertsPage()).rejects.toThrow(
      "NEXT_REDIRECT:/onboarding/class"
    );
  });

  it("renders the promotion queue when pending students exist", async () => {
    mockListPendingPromotionQueueForClass.mockResolvedValueOnce([
      {
        studentId: "770e8400-e29b-41d4-a716-446655440002",
        displayName: "Alice Martin",
        targetLevel: "green",
      },
      {
        studentId: "770e8400-e29b-41d4-a716-446655440003",
        displayName: "Bruno Dupont",
        targetLevel: "violet",
      },
    ]);

    const page = await AlertsPage();
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Alertes");
    expect(html).toContain('data-testid="alerts-promotion-queue"');
    expect(html).toContain('data-count="2"');
    expect(html).toContain("Alice Martin");
    expect(html).not.toContain("prochaine version");
    expect(mockListPendingPromotionQueueForClass).toHaveBeenCalledWith(classId);
  });

  it("renders an empty state when no pending promotions exist", async () => {
    mockListPendingPromotionQueueForClass.mockResolvedValueOnce([]);

    const page = await AlertsPage();
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Aucun élève prêt à monter de niveau.");
    expect(html).not.toContain('data-testid="alerts-promotion-queue"');
    expect(html).not.toContain("prochaine version");
  });
});
