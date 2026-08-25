export const REGISTRATION_ERROR_MESSAGE =
  "Unable to create account. Please check your details and try again.";

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;
export const MAX_PASSWORD_BYTES = 72;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

export function isValidPassword(password: string): boolean {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return false;
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return false;
  }

  if (Buffer.byteLength(password, "utf8") > MAX_PASSWORD_BYTES) {
    return false;
  }

  return true;
}

export type RegistrationInput = {
  email: string;
  password: string;
};

export function validateRegistrationInput(
  email: string,
  password: string
): RegistrationInput | null {
  if (!isValidEmail(email) || !isValidPassword(password)) {
    return null;
  }

  return {
    email: normalizeEmail(email),
    password,
  };
}
