import { compare, hash } from "bcrypt";
import "dotenv/config";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "7d";

export interface JwtPayload {
  sub: number;
  username: string;
}

export enum TokenType {
  ACCESS = "access",
  REFRESH = "refresh",
}

export function signAccessToken(payload: JwtPayload) {
  return jwt.sign({ ...payload, type: TokenType.ACCESS }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });
}

export function signRefreshToken(payload: Pick<JwtPayload, "sub">) {
  return jwt.sign({ ...payload, type: TokenType.REFRESH }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_TTL,
  });
}

export async function hashToken(token: string) {
  return await hash(token, 10);
}

export async function verifyTokenHash(token: string, hashValue: string) {
  return await compare(token, hashValue);
}

export function verifyJwt(
  token: string,
  type: TokenType,
): JwtPayload | { sub: number } {
  const decoded = jwt.verify(token, JWT_SECRET);

  if (typeof decoded === "string" || decoded.type !== type) {
    throw new Error("Invalid JWT payload");
  }

  return decoded as any;
}
