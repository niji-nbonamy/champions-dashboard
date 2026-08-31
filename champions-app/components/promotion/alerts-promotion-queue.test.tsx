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

import { AlertsPromotionQueue } from "./alerts-promotion-queue";

async function flushPromises() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("AlertsPromotionQueue", () => {
  let container: HTMLDivElement;
  let root: Root;

  const items = [
    {
      studentId: "770e8400-e29b-41d4-a716-446655440002",
      displayName: "Alice Martin",
      targetLevel: "green" as const,
    },
    {
      studentId: "770e8400-e29b-41d4-a716-446655440003",
      displayName: "Bruno Dupont",
      targetLevel: "violet" as const,
    },
  ];

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    mockValidateDossierPromotionAction.mockResolvedValue({ error: null });
    mockRefuseDossierPromotionAction.mockResolvedValue({ error: null });
    HTMLDialogElement.prototype.showModal = vi.fn(function showModal(
      this: HTMLDialogElement
    ) {
      this.open = true;
    });
    HTMLDialogElement.prototype.close = vi.fn(function closeDialog(
      this: HTMLDialogElement
    ) {
      this.open = false;
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.clearAllMocks();
  });

  it("renders queue rows for each pending student", () => {
    act(() => {
      root.render(<AlertsPromotionQueue items={items} />);
    });

    expect(container.textContent).toContain("Alice Martin");
    expect(container.textContent).toContain("Bruno Dupont");
    expect(container.textContent).toContain("Prêt à monter → vert");
    expect(
      container.querySelector('[data-testid="alerts-promotion-queue"]')
    ).not.toBeNull();
  });

  it("opens the promotion dialog when a row is tapped", () => {
    act(() => {
      root.render(<AlertsPromotionQueue items={items} />);
    });

    const rowButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Alice Martin")
    );

    act(() => {
      rowButton?.click();
    });

    expect(container.textContent).toContain(
      "Alice Martin peut passer au niveau vert."
    );
  });

  it("validates a promotion from the dialog", async () => {
    act(() => {
      root.render(<AlertsPromotionQueue items={items} />);
    });

    const rowButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Alice Martin")
    );

    act(() => {
      rowButton?.click();
    });

    const validateButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Valider"
    );

    await act(async () => {
      validateButton?.click();
      await flushPromises();
    });

    expect(mockValidateDossierPromotionAction).toHaveBeenCalledWith(
      items[0].studentId
    );
    expect(mockToastSuccess).toHaveBeenCalledWith("Niveau mis à jour.");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("refuses a promotion from the dialog", async () => {
    act(() => {
      root.render(<AlertsPromotionQueue items={items} />);
    });

    const rowButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Bruno Dupont")
    );

    act(() => {
      rowButton?.click();
    });

    const refuseButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Refuser"
    );

    await act(async () => {
      refuseButton?.click();
      await flushPromises();
    });

    expect(mockRefuseDossierPromotionAction).toHaveBeenCalledWith(
      items[1].studentId
    );
    expect(mockToastSuccess).toHaveBeenCalledWith("Promotion refusée.");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("disables queue rows while a mutation is pending", async () => {
    let resolveValidate: ((value: { error: null }) => void) | undefined;
    mockValidateDossierPromotionAction.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveValidate = resolve;
        })
    );

    act(() => {
      root.render(<AlertsPromotionQueue items={items} />);
    });

    const rowButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Alice Martin")
    );

    act(() => {
      rowButton?.click();
    });

    const validateButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Valider"
    );

    await act(async () => {
      validateButton?.click();
      await flushPromises();
    });

    const queueButtons = Array.from(
      container.querySelectorAll(
        '[data-testid="alerts-promotion-queue"] button'
      )
    );
    expect(queueButtons.every((button) => button.hasAttribute("disabled"))).toBe(
      true
    );

    await act(async () => {
      resolveValidate?.({ error: null });
      await flushPromises();
    });
  });

  it("keeps the dialog open when validation returns an error", async () => {
    mockValidateDossierPromotionAction.mockResolvedValueOnce({
      error: "Validation impossible. Réessayez.",
    });

    act(() => {
      root.render(<AlertsPromotionQueue items={items} />);
    });

    const rowButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Alice Martin")
    );

    act(() => {
      rowButton?.click();
    });

    const validateButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Valider"
    );

    await act(async () => {
      validateButton?.click();
      await flushPromises();
    });

    expect(mockToastError).toHaveBeenCalledWith(
      "Validation impossible. Réessayez."
    );
    expect(container.querySelector("dialog")?.open).toBe(true);
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("keeps the dialog open when refusal returns an error", async () => {
    mockRefuseDossierPromotionAction.mockResolvedValueOnce({
      error: "Refus impossible. Réessayez.",
    });

    act(() => {
      root.render(<AlertsPromotionQueue items={items} />);
    });

    const rowButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Bruno Dupont")
    );

    act(() => {
      rowButton?.click();
    });

    const refuseButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Refuser"
    );

    await act(async () => {
      refuseButton?.click();
      await flushPromises();
    });

    expect(mockToastError).toHaveBeenCalledWith("Refus impossible. Réessayez.");
    expect(container.querySelector("dialog")?.open).toBe(true);
    expect(mockRefresh).toHaveBeenCalled();
  });
});
