import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => null),
  handlers: {
    GET: vi.fn(async () => Response.json({})),
    POST: vi.fn(async () => new Response(null, { status: 400 })),
  },
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    className,
    width,
    height,
  }: {
    src: string;
    alt: string;
    className?: string;
    width: number;
    height: number;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} width={width} height={height} />
  ),
}));

import Home from "./page";
import { GET } from "./api/auth/[...nextauth]/route";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

const appRoot = path.resolve(__dirname);

describe("application shell", () => {
  it("renders the public landing page with hero and auth CTAs", async () => {
    const html = renderToStaticMarkup(await Home());

    expect(html).toContain('src="/logo-champions-method-full.jpg"');
    expect(html).toContain("La méthode CHAMPIONS");
    expect(html).toContain('class="sr-only"');
    expect(html).toContain('href="/login"');
    expect(html).toContain("Se connecter");
    expect(html).toContain('href="/register"');
    expect(html).toContain("Créer un compte");
    expect(html).not.toContain("Development environment ready");
  });

  it("redirects authenticated users to dictations", async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: "teacher-1", email: "teacher@example.com" },
    } as Awaited<ReturnType<typeof auth>>);

    await expect(Home()).rejects.toThrow("REDIRECT:/dictations");
    expect(redirect).toHaveBeenCalledWith("/dictations");
  });

  it("documents root layout metadata", () => {
    const layoutSource = readFileSync(path.join(appRoot, "layout.tsx"), "utf8");

    expect(layoutSource).toContain('title: "CHAMPIONS"');
    expect(layoutSource).toContain(
      'description: "Dictation dashboards for primary teachers"'
    );
  });

  it("loads DM Sans as the display font variable on root layout", () => {
    const layoutSource = readFileSync(path.join(appRoot, "layout.tsx"), "utf8");

    expect(layoutSource).toContain("DM_Sans");
    expect(layoutSource).toContain("variable: \"--font-display\"");
    expect(layoutSource).toContain("${dmSans.variable}");
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
