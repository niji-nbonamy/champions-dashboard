import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const mockUseActionState = vi.fn();

vi.mock("./actions", () => ({
  assignStudentLevelAction: vi.fn(),
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useActionState: (...args: unknown[]) => mockUseActionState(...args),
  };
});

import { LevelDotPicker } from "./level-dot-picker";

describe("LevelDotPicker", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders four labeled level buttons for one student", () => {
    mockUseActionState.mockReturnValueOnce([{ error: null }, vi.fn(), false]);

    const html = renderToStaticMarkup(
      <LevelDotPicker studentId="770e8400-e29b-41d4-a716-446655440002" />
    );

    expect(html).toContain('name="student_id"');
    expect(html).toContain("Assigner le niveau jaune");
    expect(html).toContain("Assigner le niveau vert");
    expect(html).toContain("Assigner le niveau violet");
    expect(html).toContain("Assigner le niveau or");
  });

  it("renders action errors with alert semantics", () => {
    mockUseActionState.mockReturnValueOnce([
      { error: "Le niveau est déjà assigné." },
      vi.fn(),
      false,
    ]);

    const html = renderToStaticMarkup(
      <LevelDotPicker studentId="770e8400-e29b-41d4-a716-446655440002" />
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain("Le niveau est déjà assigné.");
  });
});
