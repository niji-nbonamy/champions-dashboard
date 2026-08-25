import { runAuthMiddleware } from "@/lib/auth/middleware-handler";

import { auth } from "./auth";

export default auth((req) =>
  runAuthMiddleware(req.nextUrl.pathname, !!req.auth, req.nextUrl)
);

export const config = {
  matcher: [
    "/login",
    "/dictations/:path*",
    "/students/:path*",
    "/config/:path*",
    "/alerts/:path*",
  ],
};
