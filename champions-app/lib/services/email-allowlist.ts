import { normalizeEmail } from "@/lib/domain/registration";

function isAllowlistBypassed(): boolean {
  if (process.env.CI === "true") {
    return true;
  }

  return process.env.E2E_BYPASS_ALLOWLIST === "true";
}

function parseAllowedEmails(): Set<string> {
  const raw = process.env.ALLOWED_EMAILS?.trim();
  if (!raw) {
    return new Set();
  }

  return new Set(
    raw
      .split(",")
      .map((entry) => normalizeEmail(entry))
      .filter((email) => email.length > 0)
  );
}

export function isEmailAllowlistEnforced(): boolean {
  if (isAllowlistBypassed()) {
    return false;
  }

  return parseAllowedEmails().size > 0;
}

export function isEmailAllowed(email: string): boolean {
  if (!isEmailAllowlistEnforced()) {
    return true;
  }

  const normalized = normalizeEmail(email);
  if (!normalized) {
    return false;
  }

  return parseAllowedEmails().has(normalized);
}
