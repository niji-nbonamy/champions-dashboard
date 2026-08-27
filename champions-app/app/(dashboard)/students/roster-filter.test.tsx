/** @vitest-environment happy-dom */

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockPush = vi.fn();
let currentSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => currentSearchParams,
}));

import { RosterFilter } from "./roster-filter";

describe("RosterFilter", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    currentSearchParams = new URLSearchParams();
    mockPush.mockReset();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.clearAllMocks();
  });

  function clickFilter(label: string) {
    const button = [...container.querySelectorAll("button")].find(
      (element) => element.textContent === label
    );
    expect(button).toBeDefined();
    act(() => {
      button!.click();
    });
  }

  it("navigates to the archived filter", () => {
    act(() => {
      root.render(<RosterFilter current="active" />);
    });

    clickFilter("Archivés");

    expect(mockPush).toHaveBeenCalledWith("/students?filter=archived");
  });

  it("navigates to the all filter", () => {
    act(() => {
      root.render(<RosterFilter current="active" />);
    });

    clickFilter("Tous");

    expect(mockPush).toHaveBeenCalledWith("/students?filter=all");
  });

  it("clears the filter param when returning to active students", () => {
    currentSearchParams = new URLSearchParams("filter=all");

    act(() => {
      root.render(<RosterFilter current="all" />);
    });

    clickFilter("Actifs");

    expect(mockPush).toHaveBeenCalledWith("/students");
  });

  it("clears the success notice when changing filter", () => {
    currentSearchParams = new URLSearchParams("notice=archived&filter=all");

    act(() => {
      root.render(<RosterFilter current="all" />);
    });

    clickFilter("Actifs");

    expect(mockPush).toHaveBeenCalledWith("/students");
  });

  it("preserves unrelated query params", () => {
    currentSearchParams = new URLSearchParams("foo=bar");

    act(() => {
      root.render(<RosterFilter current="active" />);
    });

    clickFilter("Tous");

    expect(mockPush).toHaveBeenCalledWith("/students?foo=bar&filter=all");
  });
});
