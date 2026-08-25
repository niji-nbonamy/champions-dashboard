import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

type JwtUserInput = {
  id?: string;
  email?: string | null;
};

export function mapUserToJwtToken(
  token: JWT,
  user?: JwtUserInput | null
): JWT {
  if (user?.id && user.email) {
    token.sub = user.id;
    token.email = user.email;
  }

  return token;
}

export function mapJwtTokenToSession(
  session: Session,
  token: JWT
): Session {
  if (session.user && token.sub && token.email) {
    session.user.id = token.sub;
    session.user.email = token.email as string;
  }

  return session;
}
