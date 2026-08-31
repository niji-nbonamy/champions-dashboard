/** @vitest-environment happy-dom */

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  STUDENT_ARCHIVE_CONFIRM_MESSAGE,
  STUDENT_ARCHIVE_GENERIC_ERROR,
  STUDENT_ARCHIVE_NOT_FOUND_ERROR,
  formatStudentArchiveConfirmTitle,
} from "@/lib/domain/student-display-name";

const mockUseActionState = vi.fn();

vi.mock("./actions", () => ({
  archiveStudentAction: vi.fn(),
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

import { ArchiveStudentButton } from "./archive-student-button";

const studentId = "770e8400-e29b-41d4-a716-446655440002";

describe("ArchiveStudentButton", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    mockUseActionState.mockReturnValue([{ error: null }, vi.fn(), false]);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.clearAllMocks();
  });

  it("renders archive errors with alert semantics", () => {
    mockUseActionState.mockReturnValueOnce([
      { error: STUDENT_ARCHIVE_NOT_FOUND_ERROR },
      vi.fn(),
      false,
    ]);

    const html = renderToStaticMarkup(
      <ArchiveStudentButton
        studentId={studentId}
        displayName="DUPONT Marie"
        filter="active"
      />
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain(STUDENT_ARCHIVE_NOT_FOUND_ERROR);
    expect(html).toContain(
      formatStudentArchiveConfirmTitle("DUPONT Marie")
    );
    expect(html).toContain("retiré de la liste active");
  });

  it("renders generic archive errors with alert semantics", () => {
    mockUseActionState.mockReturnValueOnce([
      { error: STUDENT_ARCHIVE_GENERIC_ERROR },
      vi.fn(),
      false,
    ]);

    const html = renderToStaticMarkup(
      <ArchiveStudentButton
        studentId={studentId}
        displayName="DUPONT Marie"
        filter="active"
      />
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain(STUDENT_ARCHIVE_GENERIC_ERROR);
  });

  it("opens a confirmation dialog instead of submitting immediately", () => {
    act(() => {
      root.render(
        <ArchiveStudentButton
          studentId={studentId}
          displayName="DUPONT Marie"
          filter="active"
        />
      );
    });

    const openButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Archiver"
    );
    expect(openButton).toBeDefined();

    act(() => {
      openButton!.click();
    });

    const dialog = container.querySelector("dialog");
    expect(dialog).not.toBeNull();
    expect(dialog?.open).toBe(true);
    expect(container.textContent).toContain(
      formatStudentArchiveConfirmTitle("DUPONT Marie")
    );
    expect(container.textContent).toContain(STUDENT_ARCHIVE_CONFIRM_MESSAGE);
    expect(container.textContent).toContain("Confirmer l'archivage");
    expect(container.textContent).toContain("Annuler");
  });

  it("closes the dialog when Annuler is clicked", () => {
    act(() => {
      root.render(
        <ArchiveStudentButton
          studentId={studentId}
          displayName="DUPONT Marie"
          filter="active"
        />
      );
    });

    const openButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Archiver"
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
