import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import LoginPage from "./login/page";
import RegisterPage from "./register/page";

describe("auth pages", () => {
  it("renders the registration page with the create-account form", () => {
    const html = renderToStaticMarkup(<RegisterPage />);

    expect(html).toContain("Create account");
    expect(html).toContain('name="email"');
    expect(html).toContain('name="password"');
  });

  it("shows registration success message on login when registered=1", async () => {
    const html = renderToStaticMarkup(
      await LoginPage({ searchParams: Promise.resolve({ registered: "1" }) })
    );

    expect(html).toContain("Account created successfully");
  });

  it("shows registration success when registered is provided as an array", async () => {
    const html = renderToStaticMarkup(
      await LoginPage({
        searchParams: Promise.resolve({ registered: ["1", "0"] }),
      })
    );

    expect(html).toContain("Account created successfully");
  });

  it("does not show registration success without query param", async () => {
    const html = renderToStaticMarkup(
      await LoginPage({ searchParams: Promise.resolve({}) })
    );

    expect(html).not.toContain("Account created successfully");
  });
});
