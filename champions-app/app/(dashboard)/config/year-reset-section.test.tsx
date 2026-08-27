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
    expect(html).toContain('aria-invalid="true"');
    expect(html).toMatch(/Indiquez l.*année scolaire/);
  });

  it("does not close the dialog when cancel is clicked while reset is pending", async () => {
    mockUseActionState.mockReturnValue([{ error: null }, vi.fn(), true]);

    await act(async () => {
      root.render(
        <YearResetSection currentSchoolYearLabel={currentSchoolYearLabel} />
      );
    });

    const cancelButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Annuler"
    ) as HTMLButtonElement;
    expect(cancelButton).not.toBeNull();
    expect(cancelButton.disabled).toBe(true);

    await act(async () => {
      cancelButton.click();
    });

    expect(mockClose).not.toHaveBeenCalled();
  });

  it("does not close the dialog when the backdrop is clicked while reset is pending", async () => {
    mockUseActionState.mockReturnValue([{ error: null }, vi.fn(), true]);

    await act(async () => {
      root.render(
        <YearResetSection currentSchoolYearLabel={currentSchoolYearLabel} />
      );
    });

    const dialog = container.querySelector("dialog") as HTMLDialogElement;
    expect(dialog).not.toBeNull();

    await act(async () => {
      dialog.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true })
      );
    });

    expect(mockClose).not.toHaveBeenCalled();
  });

  it("closes the dialog when the backdrop is clicked", async () => {
    await act(async () => {
      root.render(
        <YearResetSection currentSchoolYearLabel={currentSchoolYearLabel} />
      );
    });

    const dialog = container.querySelector("dialog") as HTMLDialogElement;
    expect(dialog).not.toBeNull();

    await act(async () => {
      dialog.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true })
      );
    });

    expect(mockClose).toHaveBeenCalled();
  });

  it("prevents escape from closing the dialog while reset is pending", async () => {
    mockUseActionState.mockReturnValue([{ error: null }, vi.fn(), true]);

    await act(async () => {
      root.render(
        <YearResetSection currentSchoolYearLabel={currentSchoolYearLabel} />
      );
    });

    const dialog = container.querySelector("dialog") as HTMLDialogElement;
    const cancelEvent = new Event("cancel", { cancelable: true });
    dialog.dispatchEvent(cancelEvent);

    expect(cancelEvent.defaultPrevented).toBe(true);
    expect(mockClose).not.toHaveBeenCalled();
  });

  it("submits the form with the optional school year label", async () => {
    const mockFormAction = vi.fn();
    mockUseActionState.mockReturnValue([{ error: null }, mockFormAction, false]);

    await act(async () => {
      root.render(
        <YearResetSection currentSchoolYearLabel={currentSchoolYearLabel} />
      );
    });

    const input = container.querySelector(
      "#reset_school_year_label"
    ) as HTMLInputElement;
    expect(input).not.toBeNull();
    input.value = "2026-2027";

    const form = container.querySelector("form") as HTMLFormElement;
    expect(form).not.toBeNull();

    await act(async () => {
      form.requestSubmit();
    });

    expect(mockFormAction).toHaveBeenCalledTimes(1);
    const submittedFormData = mockFormAction.mock.calls[0][0] as FormData;
    expect(submittedFormData.get("school_year_label")).toBe("2026-2027");
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
