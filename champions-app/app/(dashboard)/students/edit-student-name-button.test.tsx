/** @vitest-environment happy-dom */

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  STUDENT_DISPLAY_NAME_UPDATE_DIALOG_TITLE,
} from "@/lib/domain/student-display-name";

const mockRefresh = vi.fn();
const mockUseActionState = vi.fn();
const { mockToastSuccess } = vi.hoisted(() => ({
  mockToastSuccess: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: mockToastSuccess,
  },
}));

vi.mock("./actions", () => ({
  updateStudentDisplayNameAction: vi.fn(),
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

import { EditStudentNameButton } from "./edit-student-name-button";

const studentId = "770e8400-e29b-41d4-a716-446655440002";

describe("EditStudentNameButton", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    mockUseActionState.mockReturnValue([{ error: null, changed: false }, vi.fn(), false]);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.clearAllMocks();
  });

  it("renders validation errors with alert semantics", () => {
    mockUseActionState.mockReturnValueOnce([
      { error: "Saisissez le nom de l'élève.", changed: false },
      vi.fn(),
      false,
    ]);

    const html = renderToStaticMarkup(
      <EditStudentNameButton
        studentId={studentId}
        displayName="DUPONT Marie"
      />
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain("Saisissez le nom de l");
    expect(html).toContain(STUDENT_DISPLAY_NAME_UPDATE_DIALOG_TITLE);
  });

  it("opens a dialog with the current name pre-filled", () => {
    act(() => {
      root.render(
        <EditStudentNameButton
          studentId={studentId}
          displayName="DUPONT Marie"
        />
      );
    });

    const openButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Modifier"
    );
    expect(openButton).toBeDefined();

    act(() => {
      openButton!.click();
    });

    const dialog = container.querySelector("dialog");
    const input = container.querySelector("input[name='display_name']");

    expect(dialog).not.toBeNull();
    expect(dialog?.open).toBe(true);
    expect(input?.getAttribute("value")).toBe("DUPONT Marie");
    expect(container.textContent).toContain("Enregistrer");
    expect(container.textContent).toContain("Annuler");
  });

  it("closes the dialog when Annuler is clicked", () => {
    act(() => {
      root.render(
        <EditStudentNameButton
          studentId={studentId}
          displayName="DUPONT Marie"
        />
      );
    });

    const openButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Modifier"
    );

    act(() => {
      openButton!.click();
    });

    const cancelButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Annuler"
    );
    expect(cancelButton).toBeDefined();

    act(() => {
      cancelButton!.click();
    });

    const dialog = container.querySelector("dialog");
    expect(dialog?.open).toBe(false);
  });
});
