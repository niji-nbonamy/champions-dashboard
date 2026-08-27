import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { RegisterForm } from "./register-form";

vi.mock("next/script", () => ({
  default: () => null,
}));

describe("RegisterForm", () => {
  it("renders French registration UI elements", () => {
    const html = renderToStaticMarkup(
      <RegisterForm recaptchaSiteKey={null} recaptchaRequired={false} />
    );

    expect(html).toContain("Confirmation du mot de passe");
    expect(html).toContain("Saisissez un mot de passe comportant au moins :");
    expect(html).toContain("Créer mon compte");
    expect(html).toContain("Afficher le mot de passe");
  });
});
