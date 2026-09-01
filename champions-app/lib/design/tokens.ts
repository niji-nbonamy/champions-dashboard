/**
 * Canonical Theme C (Menthe Douce) design tokens from DESIGN.md.
 * Used for tests and documentation — runtime styling uses CSS variables in globals.css.
 */

export const COLORS = {
  primary: "#059669",
  primaryForeground: "#FFFFFF",
  accent: "#7C3AED",
  accentForeground: "#FFFFFF",
  levelYellow: "#F5D547",
  levelYellowForeground: "#3D3200",
  levelGreen: "#4CAF50",
  levelGreenForeground: "#0A2E0C",
  levelViolet: "#7E57C2",
  levelVioletForeground: "#FFFFFF",
  levelGold: "#FFB300",
  levelGoldForeground: "#3D2800",
  promotionReady: "#2563EB",
  promotionReadyForeground: "#FFFFFF",
  trendUp: "#16A34A",
  trendDown: "#DC2626",
  trendFlat: "#6B7280",
} as const;

export const SPACING = {
  gridCellMin: "44px",
  gridRowHeight: "40px",
  logoAppBarHeight: "52px",
  logoAppBarHeightMobile: "40px",
  logoPresentationHeight: "44px",
  appBarMinHeight: "64px",
  navTabsHeight: "41px",
  dashboardChromeHeight: "105px",
  dashboardChromeHeightMobile: "64px",
} as const;

export const TYPOGRAPHY = {
  display: {
    fontSize: "28px",
    fontWeight: "300",
    lineHeight: "1.2",
    letterSpacing: "0.01em",
  },
  displaySm: {
    fontSize: "20px",
    fontWeight: "300",
    lineHeight: "1.25",
  },
  dataLg: {
    fontSize: "32px",
    fontWeight: "600",
    lineHeight: "1",
    letterSpacing: "-0.02em",
  },
} as const;

/** Hex hues that must not appear in UI tokens (UX-DR1 — no orange in UI). */
export const ORANGE_BLOCKLIST = [
  "#F97316",
  "#EA580C",
  "#FF8C00",
  "#FB923C",
  "#F59E0B",
] as const;

export type ChampionsLevel = "yellow" | "green" | "violet" | "gold";
