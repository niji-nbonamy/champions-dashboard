import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { FORGOT_PASSWORD_SUCCESS_MESSAGE } from "@/lib/domain/password-reset";

import { ForgotPasswordForm } from "./forgot-password-form";

vi.mock("./actions", () => ({
  forgotPasswordAction: vi.fn(async () => ({ submitted: true })),
}));

describe("ForgotPasswordForm", () => {
  const defaultProps = {
    recaptchaSiteKey: null,
    recaptchaRequired: false,
  };

  it("shows the generic success message after submission", () => {
    const html = renderToStaticMarkup(
      <ForgotPasswordForm initialSubmitted {...defaultProps} />
    );

    expect(html).toContain(FORGOT_PASSWORD_SUCCESS_MESSAGE);
    expect(html).not.toContain('name="email"');
  });

  it("renders the email form before submission", () => {
    const html = renderToStaticMarkup(
      <ForgotPasswordForm {...defaultProps} />
    );

    expect(html).toContain('name="email"');
    expect(html).toContain('type="email"');
    expect(html).not.toContain(FORGOT_PASSWORD_SUCCESS_MESSAGE);
  });

  it("renders recaptcha when a site key is configured", () => {
    const html = renderToStaticMarkup(
      <ForgotPasswordForm
        {...defaultProps}
        recaptchaSiteKey="site-key"
        recaptchaRequired
      />
    );

    expect(html).toContain('name="recaptchaToken"');
  });
});
