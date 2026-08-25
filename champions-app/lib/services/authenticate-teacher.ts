import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";

import { validateLoginInput } from "@/lib/domain/authentication";
import { getDb } from "@/lib/db";
import { teachers } from "@/lib/db/schema";

export type AuthenticatedTeacher = {
  id: string;
  email: string;
};

export async function authenticateTeacher(
  email: string,
  password: string
): Promise<AuthenticatedTeacher | null> {
  const input = validateLoginInput(email, password);
  if (!input) {
    return null;
  }

  const db = getDb();

  try {
    const [teacher] = await db
      .select({
        id: teachers.id,
        email: teachers.email,
        passwordHash: teachers.passwordHash,
      })
      .from(teachers)
      .where(eq(teachers.email, input.email))
      .limit(1);

    if (!teacher) {
      return null;
    }

    const passwordMatches = await compare(input.password, teacher.passwordHash);
    if (!passwordMatches) {
      return null;
    }

    return {
      id: teacher.id,
      email: teacher.email,
    };
  } catch {
    return null;
  }
}
