"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

const MOBILE_MEDIA_QUERY = "(max-width: 767px)";
const MOBILE_CAPTURE_PATH_PATTERN =
  /^\/dictations\/[^/]+\/mobile(?:\/|$)/;

export function isBlockedMobilePath(pathname: string): boolean {
  if (pathname === "/students" || pathname.startsWith("/students/")) {
    return true;
  }

  if (pathname === "/config" || pathname.startsWith("/config/")) {
    return true;
  }

  if (pathname === "/alerts" || pathname.startsWith("/alerts/")) {
    return true;
  }

  if (!pathname.startsWith("/dictations/")) {
    return false;
  }

  return !MOBILE_CAPTURE_PATH_PATTERN.test(pathname);
}

type MobileRouteGuardProps = {
  children: ReactNode;
};

export function MobileRouteGuard({ children }: MobileRouteGuardProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);

    function maybeRedirect() {
      if (mediaQuery.matches && isBlockedMobilePath(pathname)) {
        router.replace("/dictations");
      }
    }

    maybeRedirect();

    mediaQuery.addEventListener("change", maybeRedirect);
    return () => mediaQuery.removeEventListener("change", maybeRedirect);
  }, [pathname, router]);

  return children;
}
