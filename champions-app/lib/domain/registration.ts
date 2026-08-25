export const REGISTRATION_ERROR_MESSAGE =
  "Unable to create account. Please check your details and try again.";

export const MIN_PASSWORD_LENGTH = 8;

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
  return password.length >= MIN_PASSWORD_LENGTH;
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
