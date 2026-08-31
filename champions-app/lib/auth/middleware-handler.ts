import { NextResponse } from "next/server";

import { getAuthRedirectPath } from "@/lib/auth/middleware-policy";

export function runAuthMiddleware(
  pathname: string,
  isLoggedIn: boolean,
  baseUrl: URL,
  search = ""
): NextResponse {
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const redirectPath = getAuthRedirectPath(pathname, isLoggedIn, search);
  if (redirectPath) {
    return NextResponse.redirect(new URL(redirectPath, baseUrl));
  }

  return NextResponse.next();
}
