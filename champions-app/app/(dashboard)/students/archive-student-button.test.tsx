/** @vitest-environment happy-dom */

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  STUDENT_ARCHIVE_GENERIC_ERROR,
  STUDENT_ARCHIVE_NOT_FOUND_ERROR,
} from "@/lib/domain/student-display-name";

const mockUseActionState = vi.fn();
const mockConfirm = vi.fn();

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
    vi.stubGlobal("confirm", mockConfirm);
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
    vi.unstubAllGlobals();
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

  it("asks for confirmation with the student name before archiving", () => {
    mockConfirm.mockReturnValueOnce(true);

    act(() => {
      root.render(
        <ArchiveStudentButton
          studentId={studentId}
          displayName="DUPONT Marie"
          filter="active"
        />
      );
    });

    const submitButton = container.querySelector('button[type="submit"]');
    expect(submitButton).not.toBeNull();

    act(() => {
      submitButton!.click();
    });

    expect(mockConfirm).toHaveBeenCalledWith(
      "Archiver DUPONT Marie ? L'élève sera retiré de la liste active."
    );
  });

  it("blocks submit when confirmation is declined", () => {
    mockConfirm.mockReturnValueOnce(false);

    act(() => {
      root.render(
        <ArchiveStudentButton
          studentId={studentId}
          displayName="DUPONT Marie"
          filter="active"
        />
      );
    });

    const form = container.querySelector("form");
    expect(form).not.toBeNull();

    const submitEvent = new Event("submit", { bubbles: true, cancelable: true });
    const preventDefault = vi.spyOn(submitEvent, "preventDefault");

    act(() => {
      form!.dispatchEvent(submitEvent);
    });

    expect(mockConfirm).toHaveBeenCalledOnce();
    expect(preventDefault).toHaveBeenCalled();
  });
});
