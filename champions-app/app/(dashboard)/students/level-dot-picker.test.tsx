import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const mockUseActionState = vi.fn();
const mockRefresh = vi.fn();

vi.mock("./actions", () => ({
  assignStudentLevelAction: vi.fn(),
  overrideStudentLevelAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
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

  function mockAssignActionState(
    state: { error: string | null; changed?: boolean },
    pending = false
  ) {
    mockUseActionState
      .mockReturnValueOnce([state, vi.fn(), pending])
      .mockReturnValueOnce([{ error: null, changed: false }, vi.fn(), false]);
  }

  function mockOverrideActionState(
    state: { error: string | null; changed: boolean },
    pending = false
  ) {
    mockUseActionState
      .mockReturnValueOnce([{ error: null }, vi.fn(), false])
      .mockReturnValueOnce([state, vi.fn(), pending]);
  }

  it("renders four labeled level buttons for one student", () => {
    mockAssignActionState({ error: null });

    const html = renderToStaticMarkup(
      <LevelDotPicker studentId="770e8400-e29b-41d4-a716-446655440002" />
    );

    expect(html).toContain('name="student_id"');
    expect(html).toContain('type="submit"');
    expect(html).toContain('name="level"');
    expect(html).toContain('value="yellow"');
    expect(html).toContain("Assigner le niveau jaune");
    expect(html).toContain("Assigner le niveau vert");
    expect(html).toContain("Assigner le niveau violet");
    expect(html).toContain("Assigner le niveau or");
  });

  it("renders action errors with alert semantics", () => {
    mockAssignActionState({ error: "Le niveau est déjà assigné." });

    const html = renderToStaticMarkup(
      <LevelDotPicker studentId="770e8400-e29b-41d4-a716-446655440002" />
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain("Le niveau est déjà assigné.");
  });

  it("renders override aria labels and disables the current level", () => {
    mockOverrideActionState({ error: null, changed: false });

    const html = renderToStaticMarkup(
      <LevelDotPicker
        studentId="770e8400-e29b-41d4-a716-446655440002"
        mode="override"
        currentLevel="yellow"
      />
    );

    expect(html).toContain("Changer le niveau jaune");
    expect(html).toContain("Changer le niveau vert");
    expect(html).toContain('aria-current="true"');
    expect(html).toContain('value="yellow"');
    expect(html).toContain('disabled=""');
  });
});
