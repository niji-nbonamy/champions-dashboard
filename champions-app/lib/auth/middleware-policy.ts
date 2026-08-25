export const DASHBOARD_ROUTE_PREFIXES = [
  "/dictations",
  "/students",
  "/config",
  "/alerts",
] as const;

export function getAuthMiddlewareMatcher(): string[] {
  return [
    "/login",
    ...DASHBOARD_ROUTE_PREFIXES.map((prefix) => `${prefix}/:path*`),
  ];
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
