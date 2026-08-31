import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authenticateTeacher } from "@/lib/services/authenticate-teacher";

import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
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
});
