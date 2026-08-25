import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";

import { validateLoginInput } from "@/lib/domain/authentication";
import { getDb } from "@/lib/db";
import { teachers } from "@/lib/db/schema";

export type AuthenticatedTeacher = {
  id: string;
  email: string;
};

/** Precomputed hash so unknown-email logins still run bcrypt.compare (NFR9 timing). */
const TIMING_SAFE_DUMMY_HASH =
  "$2b$12$7h4ZiGN2a6hCmiI3tS6il.JhdLbF3aYwTBu4iaeQGEGWyDDS3Jp32";

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
      await compare(input.password, TIMING_SAFE_DUMMY_HASH);
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
