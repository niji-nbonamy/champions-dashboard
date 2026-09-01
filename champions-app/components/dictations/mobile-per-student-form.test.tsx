/** @vitest-environment happy-dom */

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockSaveDictationStudentEntryAction = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

vi.mock("@/app/(dashboard)/dictations/actions", () => ({
  saveDictationStudentEntryAction: (...args: unknown[]) =>
    mockSaveDictationStudentEntryAction(...args),
}));

import { MobilePerStudentForm } from "./mobile-per-student-form";

const dictationId = "880e8400-e29b-41d4-a716-446655440003";
const studentIds = [
  "770e8400-e29b-41d4-a716-446655440002",
  "770e8400-e29b-41d4-a716-446655440004",
  "770e8400-e29b-41d4-a716-446655440006",
];

describe("MobilePerStudentForm", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    mockPush.mockReset();
    mockRefresh.mockReset();
    mockSaveDictationStudentEntryAction.mockReset();
    mockSaveDictationStudentEntryAction.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.clearAllMocks();
  });

  function renderForm(studentId = studentIds[1]) {
    act(() => {
      root.render(
        <MobilePerStudentForm
          dictationId={dictationId}
          studentId={studentId}
          displayName="MARTIN Paul"
          wordDenominator={50}
          initialCounts={{
            C: 2,
            H: 0,
            A: 0,
            M: 0,
            P: 0,
            I: 0,
            O: 0,
            N: 0,
            S: 0,
          }}
          orderedStudentIds={studentIds}
        />
      );
    });
  }

  it("pre-fills counts and enables prev/next navigation links", () => {
    renderForm();

    expect(container.textContent).toContain("MARTIN Paul");
    expect(container.textContent).toContain("2");

    const previousLink = container.querySelector(
      `a[href="/dictations/${dictationId}/mobile/${studentIds[0]}"]`
    );
    const nextLink = container.querySelector(
      `a[href="/dictations/${dictationId}/mobile/${studentIds[2]}"]`
    );

    expect(previousLink).not.toBeNull();
    expect(previousLink?.getAttribute("aria-label")).toBe("Élève précédent");
    expect(nextLink).not.toBeNull();
    expect(nextLink?.getAttribute("aria-label")).toBe("Élève suivant");
  });

  it("disables previous navigation on the first student", () => {
    renderForm(studentIds[0]);

    const disabledPrevious = container.querySelector(
      'button[aria-label="Élève précédent"]'
    );

    expect(disabledPrevious?.hasAttribute("disabled")).toBe(true);
  });

  it("disables next navigation on the last student", () => {
    renderForm(studentIds[2]);

    const disabledNext = container.querySelector(
      'button[aria-label="Élève suivant"]'
    );

    expect(disabledNext?.hasAttribute("disabled")).toBe(true);
  });

  it("saves and returns to the picker on success", async () => {
    renderForm();

    const saveButton = [...container.querySelectorAll("button")].find(
      (button) => button.textContent === "Enregistrer"
    );

    await act(async () => {
      saveButton!.click();
      await Promise.resolve();
    });

    expect(mockSaveDictationStudentEntryAction).toHaveBeenCalledWith(
      dictationId,
      studentIds[1],
      expect.objectContaining({ C: 2 })
    );
    expect(mockPush).toHaveBeenCalledWith(
      `/dictations/${dictationId}/mobile`
    );
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("shows a server error and stays on the form when save fails", async () => {
    mockSaveDictationStudentEntryAction.mockResolvedValueOnce({
      error: "Impossible d'enregistrer la saisie.",
    });
    renderForm();

    const saveButton = [...container.querySelectorAll("button")].find(
      (button) => button.textContent === "Enregistrer"
    );

    await act(async () => {
      saveButton!.click();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Impossible d'enregistrer la saisie.");
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows a validation message when counts exceed the word total", () => {
    act(() => {
      root.render(
        <MobilePerStudentForm
          dictationId={dictationId}
          studentId={studentIds[1]}
          displayName="MARTIN Paul"
          wordDenominator={5}
          initialCounts={{
            C: 6,
            H: 0,
            A: 0,
            M: 0,
            P: 0,
            I: 0,
            O: 0,
            N: 0,
            S: 0,
          }}
          orderedStudentIds={studentIds}
        />
      );
    });

    expect(container.textContent).toContain(
      "Σ erreurs (6) > total mots (5) pour MARTIN Paul"
    );

    const saveButton = [...container.querySelectorAll("button")].find(
      (button) => button.textContent === "Enregistrer"
    );
    expect(saveButton?.hasAttribute("disabled")).toBe(true);
  });
});
