import { PASSWORD_RESET_EMAIL_SUBJECT } from "@/lib/domain/password-reset";

import { sendTransactionalEmail } from "./send-transactional-email";

function getAuthBaseUrl(): string {
  const authUrl = process.env.AUTH_URL?.trim().replace(/\/$/, "");
  if (authUrl) {
    return authUrl;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_URL is required in production.");
  }

  return "http://localhost:3000";
}

function buildResetUrl(rawToken: string): string {
  return `${getAuthBaseUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`;
}

export function buildPasswordResetEmailContent(rawToken: string): {
  subject: string;
  html: string;
  text: string;
} {
  const resetUrl = buildResetUrl(rawToken);

  return {
    subject: PASSWORD_RESET_EMAIL_SUBJECT,
    html: `
      <p>Bonjour,</p>
      <p>Vous avez demandé la réinitialisation de votre mot de passe CHAMPIONS.</p>
      <p><a href="${resetUrl}">Réinitialiser mon mot de passe</a></p>
      <p>Ce lien est valable 60 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
    `.trim(),
    text: [
      "Bonjour,",
      "",
      "Vous avez demandé la réinitialisation de votre mot de passe CHAMPIONS.",
      "",
      `Réinitialiser mon mot de passe : ${resetUrl}`,
      "",
      "Ce lien est valable 60 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.",
    ].join("\n"),
  };
}

export async function sendPasswordResetEmail(
  to: string,
  rawToken: string
): Promise<void> {
  const { subject, html, text } = buildPasswordResetEmailContent(rawToken);

  await sendTransactionalEmail({
    to,
    subject,
    html,
    text,
  });
}
