/**
 * @vitest-environment happy-dom
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockPush } = vi.hoisted(() => ({
  mockPush: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    className,
    width,
    height,
  }: {
    src: string;
    alt: string;
    className?: string;
    width: number;
    height: number;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} width={width} height={height} />
  ),
}));

import { PresentationMode } from "./presentation-mode";
import type { StudentDictationHistoryEntry } from "@/lib/services/get-student-dictation-history";

const studentId = "770e8400-e29b-41d4-a716-446655440002";

function makeEntry(
  overrides: Partial<StudentDictationHistoryEntry> & {
    globalPercent: number;
  }
): StudentDictationHistoryEntry {
  return {
    entryId: "aa0e8400-e29b-41d4-a716-446655440010",
    dictationId: "880e8400-e29b-41d4-a716-446655440003",
    label: "Dictée A",
    dictationDate: "2026-08-20",
    levelAtSave: "yellow",
    wordDenominator: 40,
    categoryErrors: {
      C: 0,
      H: 0,
      A: 0,
      M: 0,
      P: 0,
      I: 0,
      O: 0,
      N: 0,
      S: 0,
    },
    ...overrides,
  };
}

describe("PresentationMode", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.clearAllMocks();
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

  it("opens the fullscreen dialog on mount", () => {
    act(() => {
      root.render(
        <PresentationMode
          studentId={studentId}
          displayName="DUPONT Marie"
          level="green"
          history={[makeEntry({ globalPercent: 87 })]}
        />
      );
    });

    const dialog = container.querySelector("dialog");
    expect(dialog).not.toBeNull();
    expect(dialog?.open).toBe(true);
  });

  it("announces the screen reader label with the student first name", () => {
    act(() => {
      root.render(
        <PresentationMode
          studentId={studentId}
          displayName="DUPONT Marie"
          level="green"
          history={[]}
        />
      );
    });

    const dialog = container.querySelector("dialog");
    expect(dialog?.getAttribute("aria-label")).toBe("Mode RDV parents, Marie");
  });

  it("navigates back to the dossier when Escape is pressed", () => {
    act(() => {
      root.render(
        <PresentationMode
          studentId={studentId}
          displayName="DUPONT Marie"
          level="green"
          history={[]}
        />
      );
    });

    const dialog = container.querySelector("dialog");
    expect(dialog).not.toBeNull();

    act(() => {
      dialog?.dispatchEvent(
        new Event("cancel", { bubbles: true, cancelable: true })
      );
    });

    expect(mockPush).toHaveBeenCalledWith(`/students/${studentId}`);
  });

  it("navigates back to the dossier when Fermer is clicked", () => {
    act(() => {
      root.render(
        <PresentationMode
          studentId={studentId}
          displayName="DUPONT Marie"
          level="green"
          history={[]}
        />
      );
    });

    const closeButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Fermer"
    );

    act(() => {
      closeButton?.click();
    });

    expect(mockPush).toHaveBeenCalledWith(`/students/${studentId}`);
  });

  it("renders the presentation brand logo", () => {
    act(() => {
      root.render(
        <PresentationMode
          studentId={studentId}
          displayName="DUPONT Marie"
          level="green"
          history={[]}
        />
      );
    });

    expect(container.innerHTML).toContain('src="/logo-champions-wordmark.jpg"');
    expect(container.innerHTML).toContain("fixed right-6 bottom-6");
  });

  it("renders the curve placeholder when history is empty", () => {
    act(() => {
      root.render(
        <PresentationMode
          studentId={studentId}
          displayName="DUPONT Marie"
          level="green"
          history={[]}
        />
      );
    });

    expect(container.querySelector('[data-testid="curve-placeholder"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="global-success-curve"]')).toBeNull();
  });

  it("renders presentation highlights in the shell", () => {
    act(() => {
      root.render(
        <PresentationMode
          studentId={studentId}
          displayName="DUPONT Marie"
          level="green"
          history={[
            makeEntry({ globalPercent: 87 }),
            makeEntry({
              entryId: "bb0e8400-e29b-41d4-a716-446655440011",
              globalPercent: 82,
            }),
          ]}
        />
      );
    });

    expect(
      container.querySelector('[data-testid="presentation-highlights"]')
    ).not.toBeNull();
    expect(container.textContent).toContain("87 %");
    expect(container.textContent).toContain("+5 %");
  });

  it("renders the category detail toggle with per-category counts", () => {
    act(() => {
      root.render(
        <PresentationMode
          studentId={studentId}
          displayName="DUPONT Marie"
          level="green"
          history={[
            makeEntry({
              globalPercent: 87,
              categoryErrors: {
                C: 2,
                H: 0,
                A: 1,
                M: 0,
                P: 0,
                I: 0,
                O: 0,
                N: 0,
                S: 0,
              },
            }),
          ]}
        />
      );
    });

    const summary = Array.from(container.querySelectorAll("summary")).find(
      (element) => element.textContent === "Détail par catégorie"
    );
    expect(summary).not.toBeUndefined();

    act(() => {
      summary?.click();
    });

    expect(container.textContent).toContain("C");
    expect(container.textContent).toContain("2");
  });
});
