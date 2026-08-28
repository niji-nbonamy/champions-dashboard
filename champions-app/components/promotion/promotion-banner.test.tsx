/**
 * @vitest-environment happy-dom
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockRefresh,
  mockValidateDossierPromotionAction,
  mockRefuseDossierPromotionAction,
  mockToastSuccess,
  mockToastError,
} = vi.hoisted(() => ({
  mockRefresh: vi.fn(),
  mockValidateDossierPromotionAction: vi.fn(),
  mockRefuseDossierPromotionAction: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

vi.mock("@/app/(dashboard)/students/actions", () => ({
  validateDossierPromotionAction: mockValidateDossierPromotionAction,
  refuseDossierPromotionAction: mockRefuseDossierPromotionAction,
}));

vi.mock("sonner", () => ({
  toast: {
    success: mockToastSuccess,
    error: mockToastError,
  },
}));

import { PromotionBanner } from "./promotion-banner";

describe("PromotionBanner", () => {
  let container: HTMLDivElement;
  let root: Root;

  const studentId = "770e8400-e29b-41d4-a716-446655440002";

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    mockValidateDossierPromotionAction.mockResolvedValue({ error: null });
    mockRefuseDossierPromotionAction.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.clearAllMocks();
  });

  it("renders the target level with role alert and promotion-ready styling", () => {
    act(() => {
      root.render(
        <PromotionBanner studentId={studentId} targetLevel="green" />
      );
    });

    const banner = container.querySelector('[data-testid="promotion-banner"]');
    expect(banner).not.toBeNull();
    expect(banner?.getAttribute("role")).toBe("alert");
    expect(banner?.className).toContain("bg-promotion-ready");
    expect(banner?.className).toContain("text-promotion-ready-foreground");
    expect(container.textContent).toContain("Prêt à monter → vert");
  });

  it("calls validate action and refreshes on Valider", async () => {
    act(() => {
      root.render(
        <PromotionBanner studentId={studentId} targetLevel="green" />
      );
    });

    const validateButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Valider"
    );

    await act(async () => {
      validateButton?.click();
      await Promise.resolve();
    });

    expect(mockValidateDossierPromotionAction).toHaveBeenCalledWith(studentId);
    expect(mockToastSuccess).toHaveBeenCalledWith("Niveau mis à jour.");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("calls refuse action and refreshes on Refuser", async () => {
    act(() => {
      root.render(
        <PromotionBanner studentId={studentId} targetLevel="green" />
      );
    });

    const refuseButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Refuser"
    );

    await act(async () => {
      refuseButton?.click();
      await Promise.resolve();
    });

    expect(mockRefuseDossierPromotionAction).toHaveBeenCalledWith(studentId);
    expect(mockToastSuccess).toHaveBeenCalledWith("Promotion refusée.");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("shows an error toast when validate fails", async () => {
    mockValidateDossierPromotionAction.mockResolvedValueOnce({
      error: "Validation impossible. Réessayez.",
    });

    act(() => {
      root.render(
        <PromotionBanner studentId={studentId} targetLevel="green" />
      );
    });

    const validateButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Valider"
    );

    await act(async () => {
      validateButton?.click();
      await Promise.resolve();
    });

    expect(mockToastError).toHaveBeenCalledWith(
      "Validation impossible. Réessayez."
    );
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("shows an error toast when refuse fails", async () => {
    mockRefuseDossierPromotionAction.mockResolvedValueOnce({
      error: "Refus impossible. Réessayez.",
    });

    act(() => {
      root.render(
        <PromotionBanner studentId={studentId} targetLevel="green" />
      );
    });

    const refuseButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Refuser"
    );

    await act(async () => {
      refuseButton?.click();
      await Promise.resolve();
    });

    expect(mockToastError).toHaveBeenCalledWith("Refus impossible. Réessayez.");
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("disables both buttons while a promotion action is pending", async () => {
    let resolveValidate: ((value: { error: string | null }) => void) | undefined;
    mockValidateDossierPromotionAction.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveValidate = resolve;
        })
    );

    act(() => {
      root.render(
        <PromotionBanner studentId={studentId} targetLevel="green" />
      );
    });

    const validateButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Valider"
    );
    const refuseButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Refuser"
    );

    await act(async () => {
      validateButton?.click();
      await Promise.resolve();
    });

    expect(validateButton?.disabled).toBe(true);
    expect(refuseButton?.disabled).toBe(true);
    expect(validateButton?.textContent).toBe("Validation…");

    await act(async () => {
      resolveValidate?.({ error: null });
      await Promise.resolve();
    });
  });
});
