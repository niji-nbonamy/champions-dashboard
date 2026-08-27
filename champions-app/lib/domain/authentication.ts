import {
  isValidEmail,
  isValidPassword,
  normalizeEmail,
} from "@/lib/domain/registration";

export const LOGIN_ERROR_MESSAGE =
  "Connexion impossible. Vérifiez vos identifiants et réessayez.";

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
