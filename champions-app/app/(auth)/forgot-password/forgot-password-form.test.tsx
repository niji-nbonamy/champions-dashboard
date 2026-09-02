import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FORGOT_PASSWORD_SUCCESS_MESSAGE } from "@/lib/domain/password-reset";

import { ForgotPasswordForm } from "./forgot-password-form";

describe("ForgotPasswordForm", () => {
  it("shows the generic success message after submission", () => {
    const html = renderToStaticMarkup(
      <ForgotPasswordForm initialSubmitted />
    );

    expect(html).toContain(FORGOT_PASSWORD_SUCCESS_MESSAGE);
    expect(html).not.toContain('name="email"');
  });
});
