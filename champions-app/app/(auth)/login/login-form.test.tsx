import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { LOGIN_ERROR_MESSAGE } from "@/lib/domain/authentication";

import { LoginFormFields } from "./login-form-fields";

describe("LoginFormFields", () => {
  it("renders the generic login error with alert semantics", () => {
    const html = renderToStaticMarkup(
      <LoginFormFields
        state={{ error: LOGIN_ERROR_MESSAGE }}
        formAction={vi.fn()}
        pending={false}
      />
    );

    expect(html).toContain(LOGIN_ERROR_MESSAGE);
    expect(html).toContain('role="alert"');
  });

  it("does not render an alert when there is no error", () => {
    const html = renderToStaticMarkup(
      <LoginFormFields
        state={{ error: null }}
        formAction={vi.fn()}
        pending={false}
      />
    );

    expect(html).not.toContain(LOGIN_ERROR_MESSAGE);
    expect(html).not.toContain('role="alert"');
  });
});
