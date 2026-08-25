import { existsSync } from "node:fs";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../..");

describe("scaffold configuration", () => {
  it("matches the architecture folder seed", () => {
    const requiredPaths = [
      "app/(auth)",
      "app/(dashboard)",
      "app/api/auth/[...nextauth]/route.ts",
      "components/ui",
      "lib/domain",
      "lib/services",
      "lib/db",
      "lib/db/queries",
      "drizzle",
    ];

    for (const relativePath of requiredPaths) {
      expect(existsSync(path.join(root, relativePath))).toBe(true);
    }
  });

  it("documents required environment variables in .env.example", () => {
    const envExample = readFileSync(path.join(root, ".env.example"), "utf8");

    expect(envExample).toContain("DATABASE_URL=");
    expect(envExample).toContain("AUTH_SECRET=");
  });

  it("targets the EU Vercel region fra1", () => {
    const vercel = JSON.parse(
      readFileSync(path.join(root, "vercel.json"), "utf8")
    ) as { regions: string[] };

    expect(vercel.regions).toEqual(["fra1"]);
  });

  it("exposes dev and build scripts for local development", () => {
    const pkg = JSON.parse(
      readFileSync(path.join(root, "package.json"), "utf8")
    ) as { scripts: Record<string, string> };

    expect(pkg.scripts.dev).toBe("next dev");
    expect(pkg.scripts.build).toBe("next build");
  });
});
