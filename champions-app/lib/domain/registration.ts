export const REGISTRATION_ERROR_MESSAGE =
  "Impossible de créer le compte. Vérifiez vos informations et réessayez.";

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;
export const MAX_PASSWORD_BYTES = 72;

function getUtf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

export type PasswordRequirementId =
  | "length"
  | "digit"
  | "lowercase"
  | "uppercase"
  | "special"
  | "match";

export type PasswordRequirementStatus = Record<PasswordRequirementId, boolean>;

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

export function getPasswordRequirementStatus(
  password: string,
  confirmPassword: string
): PasswordRequirementStatus {
  return {
    length: password.length >= MIN_PASSWORD_LENGTH,
    digit: /\d/.test(password),
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
    match: password.length > 0 && password === confirmPassword,
  };
}

export function isValidRegistrationPassword(password: string): boolean {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return false;
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return false;
  }

  if (getUtf8ByteLength(password) > MAX_PASSWORD_BYTES) {
    return false;
  }

  const requirements = getPasswordRequirementStatus(password, password);

  return (
    requirements.length &&
    requirements.digit &&
    requirements.lowercase &&
    requirements.uppercase &&
    requirements.special
  );
}

/** Length and byte limits only — used for login credential shape checks. */
export function isValidPassword(password: string): boolean {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return false;
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return false;
  }

  if (getUtf8ByteLength(password) > MAX_PASSWORD_BYTES) {
    return false;
  }

  return true;
}

export function passwordsMatch(password: string, confirmPassword: string): boolean {
  return password.length > 0 && password === confirmPassword;
}

export type RegistrationInput = {
  email: string;
  password: string;
};

export function validateRegistrationInput(
  email: string,
  password: string
): RegistrationInput | null {
  if (!isValidEmail(email) || !isValidRegistrationPassword(password)) {
    return null;
  }

  return {
    email: normalizeEmail(email),
    password,
  };
}
