import { hash } from "bcryptjs";

const BCRYPT_COST_FACTOR = 12;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, BCRYPT_COST_FACTOR);
}
