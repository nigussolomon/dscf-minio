import { getBearerToken } from "../helpers/https";
import { TokenType, verifyJwt, verifyTokenHash } from "../helpers/jwt";
import { db } from "../configs/db";
import { users } from "../schema";
import { eq } from "drizzle-orm";
import type { Context } from "hono";
import { users as UserType } from "../schema"; // or your TS type for user

export interface AuthContext extends Context {
  user?: typeof UserType;
  refreshToken?: string;
}

export const accessTokenMiddleware = async (
  c: AuthContext,
  next: () => Promise<void>,
) => {
  const token = getBearerToken(c);
  if (!token)
    return c.json({ message: "Authorization Bearer token required" }, 401);

  let decoded: { sub: number };
  try {
    decoded = verifyJwt(token, TokenType.ACCESS) as { sub: number };
  } catch {
    return c.json({ message: "Invalid access token" }, 401);
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, decoded.sub))
    .limit(1)
    .execute();

  if (!user || !user.accessToken) {
    return c.json({ message: "Access token revoked" }, 401);
  }

  const valid = await verifyTokenHash(token, user.accessToken);
  if (!valid) return c.json({ message: "Access token revoked" }, 401);

  c.set("user", user);

  await next();
};

export const refreshTokenMiddleware = async (
  c: AuthContext,
  next: () => Promise<void>,
) => {
  const refreshToken = getBearerToken(c);
  if (!refreshToken)
    return c.json({ message: "Authorization Bearer token required" }, 401);

  let decoded: { sub: number };
  try {
    decoded = verifyJwt(refreshToken, TokenType.REFRESH) as { sub: number };
  } catch {
    return c.json({ message: "Invalid refresh token" }, 401);
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, decoded.sub))
    .limit(1)
    .execute();

  if (!user || !user.refreshToken) {
    return c.json({ message: "Invalid refresh token" }, 401);
  }

  const valid = await verifyTokenHash(refreshToken, user.refreshToken);
  if (!valid) return c.json({ message: "Invalid refresh token" }, 401);

  c.set("user", user);
  c.set("refreshToken", refreshToken);

  await next();
};
