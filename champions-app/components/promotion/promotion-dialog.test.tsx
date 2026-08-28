/**
 * @vitest-environment happy-dom
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PromotionDialog } from "./promotion-dialog";

describe("PromotionDialog", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("renders the target level in the title", () => {
    act(() => {
      root.render(
        <PromotionDialog
          open
          studentFirstName="Marie"
          targetLevel="green"
          pending={false}
          onClose={vi.fn()}
          onValidate={vi.fn()}
          onRefuse={vi.fn()}
        />
      );
    });

    expect(container.textContent).toContain("Prêt à monter → vert");
  });

  it("calls onValidate when Valider is clicked", () => {
    const onValidate = vi.fn();

    act(() => {
      root.render(
        <PromotionDialog
          open
          studentFirstName="Marie"
          targetLevel="green"
          pending={false}
          onClose={vi.fn()}
          onValidate={onValidate}
          onRefuse={vi.fn()}
        />
      );
    });

    const validateButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Valider"
    );

    act(() => {
      validateButton?.click();
    });

    expect(onValidate).toHaveBeenCalledOnce();
  });
});
