import "server-only";

import { Resend } from "resend";

export type TransactionalEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

function getResendApiKey(): string | undefined {
  return process.env.RESEND_API_KEY?.trim() || undefined;
}

function getEmailFrom(): string {
  const from = process.env.EMAIL_FROM?.trim();
  if (!from) {
    throw new Error(
      "EMAIL_FROM is not configured. Set it in .env.local (see .env.example)."
    );
  }
  return from;
}

export function isEmailSendingConfigured(): boolean {
  return Boolean(getResendApiKey() && process.env.EMAIL_FROM?.trim());
}

export async function sendTransactionalEmail(
  input: TransactionalEmailInput
): Promise<void> {
  const apiKey = getResendApiKey();
  const from = getEmailFrom();

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY is required in production.");
    }

    console.log("XXX", "[email:dev-fallback]", {
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    return;
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
