import crypto from "crypto";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hashedPassword: string) {
  return bcrypt.compare(password, hashedPassword);
}

export function generateApiKey(length = 32) {
  return crypto.randomBytes(length).toString("hex"); // 64 chars
}

export async function hashApiKey(apiKey: string) {
  return await bcrypt.hash(apiKey, SALT_ROUNDS);
}
