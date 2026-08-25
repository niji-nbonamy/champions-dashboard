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
  });

  it("defines display and data-lg typography scales", () => {
    expect(TYPOGRAPHY.display.fontSize).toBe("28px");
    expect(TYPOGRAPHY.display.fontWeight).toBe("300");
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
  });
});
