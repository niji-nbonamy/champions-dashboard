import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { STUDENT_ADD_SUCCESS_MESSAGE } from "@/lib/domain/student-display-name";

const mockUseActionState = vi.fn();

vi.mock("./actions", () => ({
  addStudentAction: vi.fn(),
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useActionState: (...args: unknown[]) => mockUseActionState(...args),
  };
});

import { AddStudentForm } from "./add-student-form";

describe("AddStudentForm", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders French labels and the display name field", () => {
    mockUseActionState.mockReturnValueOnce([
      { error: null, success: null },
      vi.fn(),
      false,
    ]);

    const html = renderToStaticMarkup(<AddStudentForm />);

    expect(html).toContain("Nom de l&#x27;élève");
    expect(html).toContain("Ajouter un élève");
    expect(html).toContain('name="display_name"');
    expect(html).toContain('maxLength="200"');
  });

  it("renders validation errors with alert semantics", () => {
    mockUseActionState.mockReturnValueOnce([
      { error: "Saisissez le nom de l'élève.", success: null },
      vi.fn(),
      false,
    ]);

    const html = renderToStaticMarkup(<AddStudentForm />);

    expect(html).toContain('role="alert"');
    expect(html).toContain("Saisissez le nom de l&#x27;élève.");
    expect(html).toContain('aria-invalid="true"');
  });

  it("renders success messages with status semantics", () => {
    mockUseActionState.mockReturnValueOnce([
      { error: null, success: STUDENT_ADD_SUCCESS_MESSAGE },
      vi.fn(),
      false,
    ]);

    const html = renderToStaticMarkup(<AddStudentForm />);

    expect(html).toContain('role="status"');
    expect(html).toContain(STUDENT_ADD_SUCCESS_MESSAGE);
  });
});
