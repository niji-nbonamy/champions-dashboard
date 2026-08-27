/** @vitest-environment happy-dom */

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockUseActionState = vi.fn();
const mockShowModal = vi.fn();
const mockClose = vi.fn();

vi.mock("./actions", () => ({
  resetClassYearAction: vi.fn(),
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useActionState: (...args: unknown[]) => mockUseActionState(...args),
  };
});

vi.mock("react-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-dom")>();
  return {
    ...actual,
    useFormStatus: () => ({ pending: false }),
  };
});

import { YearResetSection } from "./year-reset-section";

const currentSchoolYearLabel = "2025-2026";

describe("YearResetSection", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    mockUseActionState.mockReturnValue([{ error: null }, vi.fn(), false]);

    HTMLDialogElement.prototype.showModal = mockShowModal;
    HTMLDialogElement.prototype.close = mockClose;
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.clearAllMocks();
  });

  it("renders the FR43 irreversibility warning in the modal", () => {
    const html = renderToStaticMarkup(
      <YearResetSection currentSchoolYearLabel={currentSchoolYearLabel} />
    );

    expect(html).toContain("Remettre à zéro pour la nouvelle année");
    expect(html).toContain(
      "Tous les élèves, dictées, niveaux et paramètres seront définitivement supprimés. Cette action est irréversible."
    );
    expect(html).toContain(`Année scolaire actuelle : ${currentSchoolYearLabel}`);
  });

  it("renders validation errors with alert semantics", () => {
    mockUseActionState.mockReturnValueOnce([
      { error: "Indiquez l'année scolaire." },
      vi.fn(),
      false,
    ]);

    const html = renderToStaticMarkup(
      <YearResetSection currentSchoolYearLabel={currentSchoolYearLabel} />
    );

    expect(html).toContain('role="alert"');
    expect(html).toMatch(/Indiquez l.*année scolaire/);
  });

  it("opens the dialog when the reset button is clicked", async () => {
    await act(async () => {
      root.render(
        <YearResetSection currentSchoolYearLabel={currentSchoolYearLabel} />
      );
    });

    const trigger = container.querySelector(
      'button[type="button"]'
    ) as HTMLButtonElement;
    expect(trigger).not.toBeNull();

    await act(async () => {
      trigger.click();
    });

    expect(mockShowModal).toHaveBeenCalled();
  });

  it("closes the dialog when cancel is clicked", async () => {
    await act(async () => {
      root.render(
        <YearResetSection currentSchoolYearLabel={currentSchoolYearLabel} />
      );
    });

    const cancelButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Annuler"
    ) as HTMLButtonElement;
    expect(cancelButton).not.toBeNull();

    await act(async () => {
      cancelButton.click();
    });

    expect(mockClose).toHaveBeenCalled();
  });
});
