import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({
  handlers: {
    GET: vi.fn(async () => Response.json({})),
    POST: vi.fn(async () => new Response(null, { status: 400 })),
  },
}));

import Home from "./page";
import { GET } from "./api/auth/[...nextauth]/route";

const appRoot = path.resolve(__dirname);

describe("application shell", () => {
  it("renders the scaffold landing copy", () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain("CHAMPIONS");
    expect(html).toContain("Development environment ready");
  });

  it("documents root layout metadata", () => {
    const layoutSource = readFileSync(path.join(appRoot, "layout.tsx"), "utf8");

    expect(layoutSource).toContain('title: "CHAMPIONS"');
    expect(layoutSource).toContain(
      'description: "Dictation dashboards for primary teachers"'
    );
  });

  it("exports Auth.js route handlers instead of 501 stubs", async () => {
    const routeSource = readFileSync(
      path.join(appRoot, "api/auth/[...nextauth]/route.ts"),
      "utf8"
    );

    expect(routeSource).toContain('import { handlers } from "@/auth"');
    expect(routeSource).toContain("export const { GET, POST } = handlers");
    expect(routeSource).not.toContain("501");

    const response = await GET(
      new Request("http://localhost:3000/api/auth/session")
    );

    expect(response.status).not.toBe(501);
  });
});
