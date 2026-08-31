/**
 * @vitest-environment happy-dom
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockReplace, mockPathname } = vi.hoisted(() => ({
  mockReplace: vi.fn(),
  mockPathname: vi.fn(() => "/dictations"),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  usePathname: () => mockPathname(),
}));

import { MobileRouteGuard } from "./mobile-route-guard";

function mockMatchMedia(matches: boolean) {
  const listeners = new Map<string, Set<() => void>>();

  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: (
      eventName: string,
      listener: EventListenerOrEventListenerObject
    ) => {
      if (eventName !== "change" || typeof listener !== "function") {
        return;
      }

      const eventListeners = listeners.get(query) ?? new Set();
      eventListeners.add(listener);
      listeners.set(query, eventListeners);
    },
    removeEventListener: (
      eventName: string,
      listener: EventListenerOrEventListenerObject
    ) => {
      if (eventName !== "change" || typeof listener !== "function") {
        return;
      }

      listeners.get(query)?.delete(listener);
    },
  })) as typeof window.matchMedia;
}

describe("MobileRouteGuard redirect", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.mockReturnValue("/dictations");
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

  async function renderGuard() {
    await act(async () => {
      root.render(
        <MobileRouteGuard>
          <div>child content</div>
        </MobileRouteGuard>
      );
    });
  }

  it("redirects blocked paths to the dictation hub on mobile viewports", async () => {
    mockMatchMedia(true);
    mockPathname.mockReturnValue("/students");

    await renderGuard();

    expect(mockReplace).toHaveBeenCalledWith("/dictations");
  });

  it("redirects the class grid route on mobile viewports", async () => {
    mockMatchMedia(true);
    mockPathname.mockReturnValue(
      "/dictations/880e8400-e29b-41d4-a716-446655440003"
    );

    await renderGuard();

    expect(mockReplace).toHaveBeenCalledWith("/dictations");
  });

  it("does not redirect allowed mobile capture routes", async () => {
    mockMatchMedia(true);
    mockPathname.mockReturnValue(
      "/dictations/880e8400-e29b-41d4-a716-446655440003/mobile"
    );

    await renderGuard();

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("does not redirect on tablet or desktop viewports", async () => {
    mockMatchMedia(false);
    mockPathname.mockReturnValue("/students");

    await renderGuard();

    expect(mockReplace).not.toHaveBeenCalled();
  });
});
