import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import {
  mapJwtTokenToSession,
  mapUserToJwtToken,
} from "@/lib/auth/session-mapping";
import { getAuthSecret } from "@/lib/config/auth-secret";
import { authenticateTeacher } from "@/lib/services/authenticate-teacher";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: getAuthSecret(),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "");
        const password = String(credentials?.password ?? "");
        const teacher = await authenticateTeacher(email, password);

        if (!teacher) {
          return null;
        }

        return {
          id: teacher.id,
          email: teacher.email,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      return mapUserToJwtToken(token, user);
    },
    async session({ session, token }) {
      return mapJwtTokenToSession(session, token);
    },
  },
});
