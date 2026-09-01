/** @vitest-environment happy-dom */

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DICTATION_METADATA_UPDATE_SUCCESS_MESSAGE } from "@/lib/domain/dictation-save-messages";

const {
  mockUseActionState,
  mockRouterRefresh,
  mockToastSuccess,
} = vi.hoisted(() => ({
  mockUseActionState: vi.fn(),
  mockRouterRefresh: vi.fn(),
  mockToastSuccess: vi.fn(),
}));

vi.mock("@/app/(dashboard)/dictations/actions", () => ({
  updateDictationAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRouterRefresh,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: mockToastSuccess,
  },
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

import { EditDictationMetadataDialog } from "./edit-dictation-metadata-dialog";

const dictationId = "880e8400-e29b-41d4-a716-446655440003";
const matrixLabelOptions = [
  { value: "Dictée 1", label: "Dictée 1" },
  { value: "Dictée 2", label: "Dictée 2" },
];

async function flushPromises() {
  await Promise.resolve();
}

describe("EditDictationMetadataDialog", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseActionState.mockReturnValue([{ error: null }, vi.fn(), false]);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("renders the Modifier trigger and pre-filled form fields", () => {
    const html = renderToStaticMarkup(
      <EditDictationMetadataDialog
        dictationId={dictationId}
        currentLabelKey="Dictée 1"
        currentDate="2026-08-27"
        matrixLabelOptions={matrixLabelOptions}
      />
    );

    expect(html).toContain("Modifier");
    expect(html).toContain("Modifier la dictée");
    expect(html).toContain('name="dictation_id"');
    expect(html).toContain(dictationId);
    expect(html).toContain('value="Dictée 1"');
    expect(html).toContain('value="2026-08-27"');
    expect(html).toContain("Dictée 2");
  });

  it("displays validation errors from the server action", () => {
    mockUseActionState.mockReturnValue([
      { error: "Date de dictée invalide." },
      vi.fn(),
      false,
    ]);

    const html = renderToStaticMarkup(
      <EditDictationMetadataDialog
        dictationId={dictationId}
        currentLabelKey="Dictée 1"
        currentDate="2026-08-27"
        matrixLabelOptions={matrixLabelOptions}
      />
    );

    expect(html).toContain("Date de dictée invalide.");
    expect(html).toContain("role=\"alert\"");
  });

  it("disables submit while the action is pending", () => {
    mockUseActionState.mockReturnValue([{ error: null }, vi.fn(), true]);

    const html = renderToStaticMarkup(
      <EditDictationMetadataDialog
        dictationId={dictationId}
        currentLabelKey="Dictée 1"
        currentDate="2026-08-27"
        matrixLabelOptions={matrixLabelOptions}
      />
    );

    expect(html).toContain("Enregistrement…");
    expect(html).toContain('disabled=""');
  });

  it("warns when the current label is missing from matrix options", () => {
    const html = renderToStaticMarkup(
      <EditDictationMetadataDialog
        dictationId={dictationId}
        currentLabelKey="Dictée 9"
        currentDate="2026-08-27"
        matrixLabelOptions={matrixLabelOptions}
      />
    );

    expect(html).toContain("Sélectionnez un libellé");
    expect(html).toContain("existe plus dans la matrice Config");
  });

  it("shows success toast and refreshes after a successful update", async () => {
    await act(async () => {
      root.render(
        <EditDictationMetadataDialog
          dictationId={dictationId}
          currentLabelKey="Dictée 1"
          currentDate="2026-08-27"
          matrixLabelOptions={matrixLabelOptions}
        />
      );
    });

    const form = container.querySelector("form");
    await act(async () => {
      form?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true })
      );
    });

    mockUseActionState.mockReturnValue([{ error: null }, vi.fn(), true]);
    await act(async () => {
      root.render(
        <EditDictationMetadataDialog
          dictationId={dictationId}
          currentLabelKey="Dictée 1"
          currentDate="2026-08-27"
          matrixLabelOptions={matrixLabelOptions}
        />
      );
    });

    mockUseActionState.mockReturnValue([{ error: null }, vi.fn(), false]);
    await act(async () => {
      root.render(
        <EditDictationMetadataDialog
          dictationId={dictationId}
          currentLabelKey="Dictée 2"
          currentDate="2026-09-01"
          matrixLabelOptions={matrixLabelOptions}
        />
      );
      await flushPromises();
    });

    expect(mockToastSuccess).toHaveBeenCalledWith(
      DICTATION_METADATA_UPDATE_SUCCESS_MESSAGE
    );
    expect(mockRouterRefresh).toHaveBeenCalled();
  });
});
