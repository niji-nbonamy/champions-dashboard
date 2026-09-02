import { createHash, randomBytes } from "node:crypto";

import { and, eq, gt, isNull } from "drizzle-orm";

import { RESET_PASSWORD_ERROR_MESSAGE } from "@/lib/domain/password-reset";
import {
  isValidEmail,
  isValidRegistrationPassword,
  normalizeEmail,
  passwordsMatch,
} from "@/lib/domain/registration";
import { getDb } from "@/lib/db";
import { passwordResetTokens, teachers } from "@/lib/db/schema";

import { hashPassword } from "./password-hash";
import { isEmailSendingConfigured } from "./send-transactional-email";
import { sendPasswordResetEmail } from "./send-password-reset-email";

const TOKEN_LIFETIME_MS = 60 * 60 * 1000;

export class PasswordResetFailedError extends Error {
  constructor(message = RESET_PASSWORD_ERROR_MESSAGE) {
    super(message);
    this.name = "PasswordResetFailedError";
  }
}

export type ValidPasswordResetToken = {
  tokenId: string;
  teacherId: string;
};

function hashResetToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export function generateRawResetToken(): string {
  return randomBytes(32).toString("hex");
}

export function getResetTokenExpiry(now = new Date()): Date {
  return new Date(now.getTime() + TOKEN_LIFETIME_MS);
}

async function invalidateActiveTokensForTeacher(
  teacherId: string,
  usedAt: Date
): Promise<void> {
  const db = getDb();

  await db
    .update(passwordResetTokens)
    .set({ usedAt })
    .where(
      and(
        eq(passwordResetTokens.teacherId, teacherId),
        isNull(passwordResetTokens.usedAt)
      )
    );
}

export async function requestPasswordReset(email: string): Promise<void> {
  const normalizedEmail = normalizeEmail(email);

  if (!isValidEmail(normalizedEmail)) {
    return;
  }

  const db = getDb();
  const [teacher] = await db
    .select({ id: teachers.id, email: teachers.email })
    .from(teachers)
    .where(eq(teachers.email, normalizedEmail))
    .limit(1);

  if (!teacher) {
    return;
  }

  if (
    process.env.NODE_ENV === "production" &&
    !isEmailSendingConfigured()
  ) {
    console.error(
      "XXX",
      "[password-reset] Email sending is not configured in production."
    );
    return;
  }

  const rawToken = generateRawResetToken();
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = getResetTokenExpiry();
  const now = new Date();

  await invalidateActiveTokensForTeacher(teacher.id, now);

  const [tokenRow] = await db
    .insert(passwordResetTokens)
    .values({
      teacherId: teacher.id,
      tokenHash,
      expiresAt,
    })
    .returning({ id: passwordResetTokens.id });

  if (!tokenRow) {
    throw new Error("Failed to create password reset token.");
  }

  try {
    await sendPasswordResetEmail(teacher.email, rawToken);
  } catch (error) {
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.id, tokenRow.id));
    throw error;
  }
}

export async function findValidPasswordResetToken(
  rawToken: string,
  now = new Date()
): Promise<ValidPasswordResetToken | null> {
  const normalizedToken = rawToken.trim();
  if (!normalizedToken) {
    return null;
  }

  const tokenHash = hashResetToken(normalizedToken);
  const db = getDb();

  const [tokenRow] = await db
    .select({
      tokenId: passwordResetTokens.id,
      teacherId: passwordResetTokens.teacherId,
    })
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, now)
      )
    )
    .limit(1);

  if (!tokenRow) {
    return null;
  }

  return tokenRow;
}

export async function completePasswordReset(
  rawToken: string,
  password: string,
  confirmPassword: string
): Promise<void> {
  if (!passwordsMatch(password, confirmPassword)) {
    throw new PasswordResetFailedError();
  }

  if (!isValidRegistrationPassword(password)) {
    throw new PasswordResetFailedError();
  }

  const token = await findValidPasswordResetToken(rawToken);
  if (!token) {
    throw new PasswordResetFailedError();
  }

  const passwordHash = await hashPassword(password);
  const db = getDb();
  const usedAt = new Date();

  await db.transaction(async (tx) => {
    const [updatedToken] = await tx
      .update(passwordResetTokens)
      .set({ usedAt })
      .where(
        and(
          eq(passwordResetTokens.id, token.tokenId),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, usedAt)
        )
      )
      .returning({ id: passwordResetTokens.id });

    if (!updatedToken) {
      throw new PasswordResetFailedError();
    }

    const [updatedTeacher] = await tx
      .update(teachers)
      .set({ passwordHash })
      .where(eq(teachers.id, token.teacherId))
      .returning({ id: teachers.id });

    if (!updatedTeacher) {
      throw new PasswordResetFailedError();
    }

    await tx
      .update(passwordResetTokens)
      .set({ usedAt })
      .where(
        and(
          eq(passwordResetTokens.teacherId, token.teacherId),
          isNull(passwordResetTokens.usedAt)
        )
      );
  });
}
