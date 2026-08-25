import { NextResponse } from "next/server";

import { getAuthRedirectPath } from "@/lib/auth/middleware-policy";

import { auth } from "./auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const redirectPath = getAuthRedirectPath(pathname, isLoggedIn);
  if (redirectPath) {
    return NextResponse.redirect(new URL(redirectPath, req.nextUrl));
  }

  return NextResponse.next();
});

// Keep in sync with DASHBOARD_ROUTE_PREFIXES in lib/auth/middleware-policy.ts
export const config = {
  matcher: [
    "/login",
    "/dictations/:path*",
    "/students/:path*",
    "/config/:path*",
    "/alerts/:path*",
  ],
};
