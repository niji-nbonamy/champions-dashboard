/**
 * @vitest-environment happy-dom
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  DOSSIER_PRESENTATION_RETURN_FOCUS_KEY,
  DOSSIER_PRESENTATION_TRIGGER_ID,
} from "./dossier-presentation-link";
import { PresentationReturnFocus } from "./presentation-return-focus";

describe("PresentationReturnFocus", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    sessionStorage.clear();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    sessionStorage.clear();
  });

  it("restores focus to the stored dossier trigger on mount", () => {
    const trigger = document.createElement("a");
    trigger.id = DOSSIER_PRESENTATION_TRIGGER_ID;
    trigger.href = "/students/test/present";
    trigger.textContent = "RDV parents";
    document.body.appendChild(trigger);

    sessionStorage.setItem(
      DOSSIER_PRESENTATION_RETURN_FOCUS_KEY,
      DOSSIER_PRESENTATION_TRIGGER_ID
    );

    act(() => {
      root.render(<PresentationReturnFocus />);
    });

    expect(document.activeElement).toBe(trigger);
    expect(
      sessionStorage.getItem(DOSSIER_PRESENTATION_RETURN_FOCUS_KEY)
    ).toBeNull();

    trigger.remove();
  });
});
