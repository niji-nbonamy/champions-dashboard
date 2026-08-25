import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

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
      if (user?.id && user.email) {
        token.sub = user.id;
        token.email = user.email;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub && token.email) {
        session.user.id = token.sub;
        session.user.email = token.email as string;
      }

      return session;
    },
  },
});
