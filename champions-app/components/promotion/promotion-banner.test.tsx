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

vi.mock("next/dist/client/components/redirect-error", () => ({
  isRedirectError: (error: unknown) =>
    error instanceof Error && error.message.startsWith("NEXT_REDIRECT:"),
}));

import { PromotionBanner } from "./promotion-banner";
import { PROMOTION_REFUSE_GENERIC_ERROR } from "@/lib/services/refuse-student-promotion";
import { PROMOTION_VALIDATE_GENERIC_ERROR } from "@/lib/services/validate-student-promotion";

function getPromotionButtons(container: HTMLDivElement) {
  const buttons = Array.from(container.querySelectorAll("button"));
  return {
    validate: buttons.find((button) =>
      button.textContent?.startsWith("Valid")
    ),
    refuse: buttons.find((button) => button.textContent?.startsWith("Refus")),
  };
}

async function flushPromises() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

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

    const refuseButton = getPromotionButtons(container).refuse;
    expect(refuseButton?.className).toContain("text-promotion-ready-foreground");
    expect(refuseButton?.className).toContain("bg-transparent");
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
    expect(mockRefresh).toHaveBeenCalled();
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
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("does not show a generic toast when validate rejects with a redirect error", async () => {
    mockValidateDossierPromotionAction.mockRejectedValueOnce(
      new Error("NEXT_REDIRECT:/login")
    );

    act(() => {
      root.render(
        <PromotionBanner studentId={studentId} targetLevel="green" />
      );
    });

    const { validate: validateButton } = getPromotionButtons(container);

    try {
      await act(async () => {
        validateButton?.click();
        await flushPromises();
      });
    } catch {
      // startTransition may surface redirect errors outside the banner handler.
    }

    expect(mockToastError).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("shows a generic error toast and refreshes when validate throws unexpectedly", async () => {
    mockValidateDossierPromotionAction.mockRejectedValueOnce(
      new Error("unexpected failure")
    );

    act(() => {
      root.render(
        <PromotionBanner studentId={studentId} targetLevel="green" />
      );
    });

    const { validate: validateButton } = getPromotionButtons(container);

    await act(async () => {
      validateButton?.click();
      await flushPromises();
    });

    expect(mockToastError).toHaveBeenCalledWith(PROMOTION_VALIDATE_GENERIC_ERROR);
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("shows a generic error toast and refreshes when refuse throws unexpectedly", async () => {
    mockRefuseDossierPromotionAction.mockRejectedValueOnce(
      new Error("unexpected failure")
    );

    act(() => {
      root.render(
        <PromotionBanner studentId={studentId} targetLevel="green" />
      );
    });

    const { refuse: refuseButton } = getPromotionButtons(container);

    await act(async () => {
      refuseButton?.click();
      await flushPromises();
    });

    expect(mockToastError).toHaveBeenCalledWith(PROMOTION_REFUSE_GENERIC_ERROR);
    expect(mockRefresh).toHaveBeenCalled();
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

    const { validate: validateButton } = getPromotionButtons(container);

    await act(async () => {
      validateButton?.click();
      await flushPromises();
    });

    const pendingButtons = getPromotionButtons(container);
    expect(pendingButtons.validate?.disabled).toBe(true);
    expect(pendingButtons.refuse?.disabled).toBe(true);
    expect(pendingButtons.validate?.textContent).toBe("Validation…");
    expect(pendingButtons.refuse?.textContent).toBe("Refuser");

    await act(async () => {
      resolveValidate?.({ error: null });
      await flushPromises();
    });
  });

  it("shows Refus… only on the refuse button while refusing", async () => {
    let resolveRefuse: ((value: { error: string | null }) => void) | undefined;
    mockRefuseDossierPromotionAction.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRefuse = resolve;
        })
    );

    act(() => {
      root.render(
        <PromotionBanner studentId={studentId} targetLevel="green" />
      );
    });

    const { refuse: refuseButton } = getPromotionButtons(container);

    await act(async () => {
      refuseButton?.click();
      await flushPromises();
    });

    const pendingButtons = getPromotionButtons(container);
    expect(pendingButtons.validate?.disabled).toBe(true);
    expect(pendingButtons.refuse?.disabled).toBe(true);
    expect(pendingButtons.validate?.textContent).toBe("Valider");
    expect(pendingButtons.refuse?.textContent).toBe("Refus…");

    await act(async () => {
      resolveRefuse?.({ error: null });
      await flushPromises();
    });
  });
});
