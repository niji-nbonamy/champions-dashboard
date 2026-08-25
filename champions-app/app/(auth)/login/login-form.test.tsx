import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { LOGIN_ERROR_MESSAGE } from "@/lib/domain/authentication";

vi.mock("./actions", () => ({
  loginAction: vi.fn(),
}));

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");

  return {
    ...actual,
    useActionState: () => [{ error: LOGIN_ERROR_MESSAGE }, vi.fn(), false],
  };
});

import { LoginForm } from "./login-form";

describe("LoginForm", () => {
  it("renders the generic login error with alert semantics", () => {
    const html = renderToStaticMarkup(<LoginForm />);

    expect(html).toContain(LOGIN_ERROR_MESSAGE);
    expect(html).toContain('role="alert"');
  });
});
