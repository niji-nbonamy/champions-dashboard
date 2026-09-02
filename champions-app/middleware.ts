import NextAuth from "next-auth";

import { runAuthMiddleware } from "@/lib/auth/middleware-handler";

import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) =>
  runAuthMiddleware(
    req.nextUrl.pathname,
    !!req.auth,
    req.nextUrl,
    req.nextUrl.search
  )
);

export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/onboarding/:path*",
    "/dictations/:path*",
    "/students/:path*",
    "/config/:path*",
    "/alerts/:path*",
  ],
};
