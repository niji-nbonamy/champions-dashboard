/** @vitest-environment happy-dom */

import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  CONFIG_FIRST_CTA_LABEL,
  CONFIG_FIRST_HINT_MESSAGE,
} from "@/lib/domain/dictation-readiness";
import { nextLinkMockModule } from "@/test-utils/next-mocks";

const mockUseActionState = vi.fn();

vi.mock("./actions", () => ({
  createDictationAction: vi.fn(),
}));

vi.mock("next/link", () => nextLinkMockModule);

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

import { CreateDictationDialog } from "./create-dictation-dialog";

const matrixLabelOptions = [
  { value: "Dictée 1", label: "Dictée 1" },
  { value: "Dictée 2", label: "Dictée 2" },
];

describe("CreateDictationDialog", () => {
  beforeEach(() => {
    mockUseActionState.mockReturnValue([{ error: null }, vi.fn(), false]);
  });

  it("renders the config-first hint and link to the matrix section", () => {
    const html = renderToStaticMarkup(
      <CreateDictationDialog matrixLabelOptions={matrixLabelOptions} />
    );

    expect(html).toContain(CONFIG_FIRST_HINT_MESSAGE);
    expect(html).toContain(CONFIG_FIRST_CTA_LABEL);
    expect(html).toContain('href="/config#matrice-mots"');
  });

  it("renders matrix label options in the picker", () => {
    const html = renderToStaticMarkup(
      <CreateDictationDialog matrixLabelOptions={matrixLabelOptions} />
    );

    expect(html).toContain("Dictée 1");
    expect(html).toContain("Dictée 2");
  });
});
