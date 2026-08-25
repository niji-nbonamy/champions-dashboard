export const DASHBOARD_ROUTE_PREFIXES = [
  "/dictations",
  "/students",
  "/config",
  "/alerts",
] as const;

// Keep in sync with `middleware.ts` config.matcher (Next.js requires literals there).
export const AUTH_MIDDLEWARE_MATCHER = [
  "/login",
  "/dictations/:path*",
  "/students/:path*",
  "/config/:path*",
  "/alerts/:path*",
];

export function getAuthMiddlewareMatcher(): string[] {
  return [...AUTH_MIDDLEWARE_MATCHER];
}

export function isDashboardRoute(pathname: string): boolean {
  return DASHBOARD_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function getAuthRedirectPath(
  pathname: string,
  isLoggedIn: boolean
): "/dictations" | "/login" | null {
  if (isLoggedIn && pathname === "/login") {
    return "/dictations";
  }

  if (isDashboardRoute(pathname) && !isLoggedIn) {
    return "/login";
  }

  return null;
}
