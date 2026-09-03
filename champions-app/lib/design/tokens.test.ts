import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  COLORS,
  ORANGE_BLOCKLIST,
  SPACING,
  TYPOGRAPHY,
} from "./tokens";

const testDir = dirname(fileURLToPath(import.meta.url));
const globalsCssPath = resolve(testDir, "../../app/globals.css");

function collectHexValues(value: unknown): string[] {
  if (typeof value === "string") {
    const matches = value.match(/#[0-9A-Fa-f]{3,8}/g);
    return matches ?? [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectHexValues);
  }

  if (value && typeof value === "object") {
    return Object.values(value).flatMap(collectHexValues);
  }

  return [];
}

function cssContainsHex(css: string, hex: string): boolean {
  return css.toLowerCase().includes(hex.toLowerCase());
}

function extractDarkBlock(css: string): string {
  const match = css.match(/\.dark\s*\{([\s\S]*?)\n\}/);
  return match?.[1] ?? "";
}

describe("design tokens", () => {
  it("matches canonical Theme C primary, accent, and promotion-ready colors", () => {
    expect(COLORS.primary).toBe("#059669");
    expect(COLORS.accent).toBe("#7C3AED");
    expect(COLORS.promotionReady).toBe("#2563EB");
  });

  it("defines spacing tokens per UX-DR4", () => {
    expect(SPACING.gridCellMin).toBe("44px");
    expect(SPACING.gridRowHeight).toBe("40px");
    expect(SPACING.appBarMinHeight).toBe("64px");
    expect(SPACING.logoAppBarHeight).toBe("52px");
    expect(SPACING.logoAppBarHeightMobile).toBe("40px");
    expect(SPACING.logoPresentationHeight).toBe("44px");
    expect(SPACING.navTabsHeight).toBe("41px");
    expect(SPACING.dashboardChromeHeight).toBe("105px");
    expect(SPACING.dashboardChromeHeightMobile).toBe("64px");
    expect(
      parseInt(SPACING.dashboardChromeHeight, 10)
    ).toBe(
      parseInt(SPACING.appBarMinHeight, 10) +
        parseInt(SPACING.navTabsHeight, 10)
    );
    expect(SPACING.dashboardChromeHeightMobile).toBe(SPACING.appBarMinHeight);
  });

  it("defines display and data-lg typography scales", () => {
    expect(TYPOGRAPHY.display.fontSize).toBe("28px");
    expect(TYPOGRAPHY.display.fontWeight).toBe("300");
    expect(TYPOGRAPHY.displaySm.fontSize).toBe("20px");
    expect(TYPOGRAPHY.displaySm.fontWeight).toBe("300");
    expect(TYPOGRAPHY.dataLg.fontSize).toBe("32px");
    expect(TYPOGRAPHY.dataLg.fontWeight).toBe("600");
  });

  it("contains no orange hues in token constants", () => {
    const allHex = collectHexValues(COLORS);
    for (const blocked of ORANGE_BLOCKLIST) {
      expect(allHex).not.toContain(blocked);
    }
  });

  it("globals.css theme vars contain no orange blocklist hues", () => {
    const css = readFileSync(globalsCssPath, "utf8").toLowerCase();
    for (const blocked of ORANGE_BLOCKLIST) {
      expect(css).not.toContain(blocked.toLowerCase());
    }
    expect(css).not.toContain("orange");
  });

  it("globals.css maps primary to mint and registers display typography utilities", () => {
    const css = readFileSync(globalsCssPath, "utf8");
    expect(css).toContain("--primary: #059669");
    expect(css).toContain("--accent: #7c3aed");
    expect(css).toContain(".text-display");
    expect(css).toContain(".text-data-lg");
    expect(css).toContain("var(--font-display)");
    expect(css).toContain("--spacing-grid-cell-min: 44px");
    expect(css).toContain("--spacing-grid-row-height: 40px");
    expect(css).toContain("--spacing-nav-tabs-height: 41px");
    expect(css).toContain("--spacing-safe-area-top: env(safe-area-inset-top, 0px)");
    expect(css).toContain("--spacing-dashboard-chrome-height: calc(");
    expect(css).toContain("--spacing-safe-area-top) + var(--spacing-app-bar-min-height)");
  });

  it("mirrors all COLORS hex values in globals.css", () => {
    const css = readFileSync(globalsCssPath, "utf8");
    for (const hex of collectHexValues(COLORS)) {
      expect(cssContainsHex(css, hex)).toBe(true);
    }
  });

  it("dark mode uses Theme C primary, accent, and brand tokens", () => {
    const css = readFileSync(globalsCssPath, "utf8");
    const darkBlock = extractDarkBlock(css);

    expect(darkBlock).toContain("--primary: #059669");
    expect(darkBlock).toContain("--accent: #7c3aed");
    expect(darkBlock).toContain("--level-green: #4caf50");
    expect(darkBlock).toContain("--promotion-ready: #2563eb");
    expect(darkBlock).toContain("--trend-up: #16a34a");
    expect(darkBlock).toContain("--spacing-grid-row-height: 40px");
  });

  it("typography utilities match TYPOGRAPHY constants in globals.css", () => {
    const css = readFileSync(globalsCssPath, "utf8");

    expect(css).toContain(".text-display-sm");
    expect(css).toContain(`font-size: ${TYPOGRAPHY.display.fontSize}`);
    expect(css).toContain(`font-weight: ${TYPOGRAPHY.display.fontWeight}`);
    expect(css).toContain(`font-size: ${TYPOGRAPHY.displaySm.fontSize}`);
    expect(css).toContain(`font-weight: ${TYPOGRAPHY.displaySm.fontWeight}`);
    expect(css).toContain(`font-size: ${TYPOGRAPHY.dataLg.fontSize}`);
    expect(css).toContain(`font-weight: ${TYPOGRAPHY.dataLg.fontWeight}`);
  });
});
