import type { NextAuthConfig } from "next-auth";

import {
  mapJwtTokenToSession,
  mapUserToJwtToken,
} from "@/lib/auth/session-mapping";
import { getAuthSecret } from "@/lib/config/auth-secret";

export const authConfig = {
  secret: getAuthSecret(),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      return mapUserToJwtToken(token, user);
    },
    session({ session, token }) {
      return mapJwtTokenToSession(session, token);
    },
  },
} satisfies NextAuthConfig;
