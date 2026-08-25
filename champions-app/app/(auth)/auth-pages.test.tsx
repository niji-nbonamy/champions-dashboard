import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import LoginPage from "./login/page";

const authRoot = path.resolve(__dirname);

describe("auth pages", () => {
  it("documents registration route markup in register page source", () => {
    const source = readFileSync(
      path.join(authRoot, "register/page.tsx"),
      "utf8"
    );

    expect(source).toContain("Create account");
    expect(source).toContain("RegisterForm");
  });

  it("shows registration success message on login when registered=1", async () => {
    const html = renderToStaticMarkup(
      await LoginPage({ searchParams: Promise.resolve({ registered: "1" }) })
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
