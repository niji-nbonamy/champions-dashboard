/**
 * @vitest-environment happy-dom
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockUseActionState,
  mockRefresh,
  mockToastSuccess,
  mockToastError,
  assignStudentLevelAction,
  overrideStudentLevelAction,
} = vi.hoisted(() => ({
  mockUseActionState: vi.fn(),
  mockRefresh: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
  assignStudentLevelAction: vi.fn(),
  overrideStudentLevelAction: vi.fn(),
}));

vi.mock("./actions", () => ({
  assignStudentLevelAction,
  overrideStudentLevelAction,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: mockToastSuccess,
    error: mockToastError,
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

const studentId = "770e8400-e29b-41d4-a716-446655440002";

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

    const html = renderToStaticMarkup(<LevelDotPicker studentId={studentId} />);

    expect(html).toContain('name="student_id"');
    expect(html).toContain('type="submit"');
    expect(html).toContain('name="level"');
    expect(html).toContain('value="yellow"');
    expect(html).toContain("Assigner le niveau jaune");
    expect(html).toContain("Assigner le niveau vert");
    expect(html).toContain("Assigner le niveau violet");
    expect(html).toContain("Assigner le niveau or");
  });

  it("renders action errors with alert semantics in assign mode", () => {
    mockAssignActionState({ error: "Le niveau est déjà assigné." });

    const html = renderToStaticMarkup(<LevelDotPicker studentId={studentId} />);

    expect(html).toContain('role="alert"');
    expect(html).toContain("Le niveau est déjà assigné.");
  });

  it("renders override aria labels and disables the current level", () => {
    mockOverrideActionState({ error: null, changed: false });

    const html = renderToStaticMarkup(
      <LevelDotPicker
        studentId={studentId}
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

  it("does not render inline alerts for override errors", () => {
    mockOverrideActionState({
      error: "Modification impossible. Réessayez.",
      changed: false,
    });

    const html = renderToStaticMarkup(
      <LevelDotPicker
        studentId={studentId}
        mode="override"
        currentLevel="yellow"
      />
    );

    expect(html).not.toContain('role="alert"');
    expect(html).not.toContain("Modification impossible. Réessayez.");
  });

  it("wires overrideStudentLevelAction in override mode", () => {
    mockOverrideActionState({ error: null, changed: false });

    renderToStaticMarkup(
      <LevelDotPicker
        studentId={studentId}
        mode="override"
        currentLevel="yellow"
      />
    );

    expect(mockUseActionState).toHaveBeenCalledWith(
      overrideStudentLevelAction,
      { error: null, changed: false }
    );
  });
});

describe("LevelDotPicker override feedback", () => {
  let container: HTMLDivElement;
  let root: Root;
  let overrideState: { error: string | null; changed: boolean };
  let overridePending: boolean;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    overrideState = { error: null, changed: false };
    overridePending = false;

    mockUseActionState.mockImplementation((action) => {
      if (action === overrideStudentLevelAction) {
        return [overrideState, vi.fn(), overridePending];
      }

      return [{ error: null }, vi.fn(), false];
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.clearAllMocks();
  });

  async function flushPromises() {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  async function renderOverridePicker() {
    await act(async () => {
      root.render(
        <LevelDotPicker
          studentId={studentId}
          mode="override"
          currentLevel="yellow"
        />
      );
    });
  }

  async function submitForm() {
    const form = container.querySelector("form");
    await act(async () => {
      form?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true })
      );
    });
  }

  it("shows success toast and refreshes after a successful override", async () => {
    await renderOverridePicker();
    await submitForm();

    overridePending = true;
    await act(async () => {
      root.render(
        <LevelDotPicker
          studentId={studentId}
          mode="override"
          currentLevel="yellow"
        />
      );
    });

    overridePending = false;
    overrideState = { error: null, changed: true };
    await act(async () => {
      root.render(
        <LevelDotPicker
          studentId={studentId}
          mode="override"
          currentLevel="yellow"
        />
      );
      await flushPromises();
    });

    expect(mockToastSuccess).toHaveBeenCalledWith("Niveau mis à jour.");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("shows an error toast when override fails", async () => {
    await renderOverridePicker();
    await submitForm();

    overridePending = true;
    await act(async () => {
      root.render(
        <LevelDotPicker
          studentId={studentId}
          mode="override"
          currentLevel="yellow"
        />
      );
    });

    overridePending = false;
    overrideState = {
      error: "Modification impossible. Réessayez.",
      changed: false,
    };
    await act(async () => {
      root.render(
        <LevelDotPicker
          studentId={studentId}
          mode="override"
          currentLevel="yellow"
        />
      );
      await flushPromises();
    });

    expect(mockToastError).toHaveBeenCalledWith(
      "Modification impossible. Réessayez."
    );
    expect(mockToastSuccess).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("does not show feedback when the level is unchanged", async () => {
    await renderOverridePicker();
    await submitForm();

    overridePending = true;
    await act(async () => {
      root.render(
        <LevelDotPicker
          studentId={studentId}
          mode="override"
          currentLevel="yellow"
        />
      );
    });

    overridePending = false;
    overrideState = { error: null, changed: false };
    await act(async () => {
      root.render(
        <LevelDotPicker
          studentId={studentId}
          mode="override"
          currentLevel="yellow"
        />
      );
      await flushPromises();
    });

    expect(mockToastSuccess).not.toHaveBeenCalled();
    expect(mockToastError).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
