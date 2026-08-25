import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";

import {
  REGISTRATION_ERROR_MESSAGE,
  validateRegistrationInput,
} from "@/lib/domain/registration";
import { getDb } from "@/lib/db";
import { teachers } from "@/lib/db/schema";

export class RegistrationFailedError extends Error {
  constructor() {
    super(REGISTRATION_ERROR_MESSAGE);
    this.name = "RegistrationFailedError";
  }
}

export type RegisteredTeacher = {
  id: string;
  email: string;
};

export async function registerTeacher(
  email: string,
  password: string
): Promise<RegisteredTeacher> {
  const input = validateRegistrationInput(email, password);
  if (!input) {
    throw new RegistrationFailedError();
  }

  const db = getDb();

  const existing = await db
    .select({ id: teachers.id })
    .from(teachers)
    .where(eq(teachers.email, input.email))
    .limit(1);

  if (existing.length > 0) {
    throw new RegistrationFailedError();
  }

  const passwordHash = await hash(input.password, 12);

  try {
    const [teacher] = await db
      .insert(teachers)
      .values({
        email: input.email,
        passwordHash,
      })
      .returning({ id: teachers.id, email: teachers.email });

    if (!teacher) {
      throw new RegistrationFailedError();
    }

    return teacher;
  } catch (error) {
    if (error instanceof RegistrationFailedError) {
      throw error;
    }

    throw new RegistrationFailedError();
  }
}
