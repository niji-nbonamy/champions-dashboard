import {
  isValidEmail,
  isValidPassword,
  normalizeEmail,
} from "@/lib/domain/registration";

export const LOGIN_ERROR_MESSAGE =
  "Unable to sign in. Please check your credentials and try again.";

export type LoginInput = {
  email: string;
  password: string;
};

export function validateLoginInput(
  email: string,
  password: string
): LoginInput | null {
  if (!isValidEmail(email) || !isValidPassword(password)) {
    return null;
  }

  return {
    email: normalizeEmail(email),
    password,
  };
}
