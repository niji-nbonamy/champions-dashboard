import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import Home from "./page";
import { GET, POST } from "./api/auth/[...nextauth]/route";

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

  it("returns 501 for auth GET and POST stubs", async () => {
    const getResponse = await GET();
    expect(getResponse.status).toBe(501);
    expect(await getResponse.text()).toBe("Auth not configured");

    const postResponse = await POST();
    expect(postResponse.status).toBe(501);
    expect(await postResponse.text()).toBe("Auth not configured");
  });
});
