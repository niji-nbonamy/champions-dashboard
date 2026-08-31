import {
  buildLoginRedirectPath,
  DEFAULT_POST_AUTH_REDIRECT,
  sanitizeCallbackUrl,
} from "@/lib/domain/auth-redirect";

export const DASHBOARD_ROUTE_PREFIXES = [
  "/dictations",
  "/students",
  "/config",
  "/alerts",
] as const;

export const ONBOARDING_ROUTE_PREFIX = "/onboarding";

// Keep in sync with `middleware.ts` config.matcher (Next.js requires literals there).
export const AUTH_MIDDLEWARE_MATCHER = [
  "/",
  "/login",
  "/register",
  "/onboarding/:path*",
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

export function isOnboardingRoute(pathname: string): boolean {
  return (
    pathname === ONBOARDING_ROUTE_PREFIX ||
    pathname.startsWith(`${ONBOARDING_ROUTE_PREFIX}/`)
  );
}

export function getAuthRedirectPath(
  pathname: string,
  isLoggedIn: boolean,
  search = ""
): string | null {
  if (
    isLoggedIn &&
    (pathname === "/" || pathname === "/login" || pathname === "/register")
  ) {
    if (pathname === "/login") {
      const callbackUrl = new URLSearchParams(search).get("callbackUrl");
      return sanitizeCallbackUrl(callbackUrl);
    }

    return DEFAULT_POST_AUTH_REDIRECT;
  }

  if (!isLoggedIn && (isDashboardRoute(pathname) || isOnboardingRoute(pathname))) {
    return buildLoginRedirectPath(`${pathname}${search}`);
  }

  return null;
}
