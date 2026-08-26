import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const { completeYearStartWizardAction } = vi.hoisted(() => ({
  completeYearStartWizardAction: vi.fn(),
}));

vi.mock("./actions", () => ({
  completeYearStartWizardAction,
}));

import { WizardFinishButton } from "./wizard-finish-button";

describe("WizardFinishButton", () => {
  it("disables finish when the matrix is not ready", () => {
    const html = renderToStaticMarkup(
      <WizardFinishButton canFinish={false} />
    );

    expect(html).toContain("Terminer la configuration");
    expect(html).toContain("disabled=\"\"");
    expect(html).toContain(
      "Enregistrez au moins une dictée complète dans la matrice"
    );
  });

  it("disables finish when the matrix has unsaved changes", () => {
    const html = renderToStaticMarkup(
      <WizardFinishButton canFinish={false} isMatrixDirty />
    );

    expect(html).toContain("disabled=\"\"");
    expect(html).toContain("Enregistrez la matrice avant de terminer");
  });
});
