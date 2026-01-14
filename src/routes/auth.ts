import { Hono } from "hono";
import { z } from "zod";
import { db } from "../configs/db";
import { verifyPassword } from "../helpers/bcrypt";
import { hashToken, signAccessToken, signRefreshToken } from "../helpers/jwt";
import { users } from "../schema";
import { eq } from "drizzle-orm";
import {
  accessTokenMiddleware,
  refreshTokenMiddleware,
} from "../middlewares/auth";

export const authRoutes = new Hono();

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

authRoutes.post("/login", async (c) => {
  const body = loginSchema.parse(await c.req.json());

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, body.username))
    .limit(1)
    .execute();

  if (!user) {
    return c.json({ message: "Invalid credentials" }, 401);
  }

  const valid = await verifyPassword(body.password, user.password);

  if (!valid) {
    return c.json({ message: "Invalid credentials" }, 401);
  }

  const payload = {
    sub: user.id,
    username: user.username,
  };

  const accessTokenPlain = signAccessToken(payload);
  const accessTokenHash = await hashToken(accessTokenPlain);

  const refreshTokenPlain = signRefreshToken({ sub: user.id });
  const refreshTokenHash = await hashToken(refreshTokenPlain);

  await db
    .update(users)
    .set({ refreshToken: refreshTokenHash, accessToken: accessTokenHash })
    .where(eq(users.id, user.id))
    .execute();

  return c.json({
    accessToken: accessTokenPlain,
    refreshToken: refreshTokenPlain,
  });
});

authRoutes.post("/refresh", refreshTokenMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ message: "User not found" }, 401);

  const accessTokenPlain = signAccessToken({
    sub: user.id,
    username: user.username,
  });
  const accessTokenHash = await hashToken(accessTokenPlain);

  const newRefreshToken = signRefreshToken({ sub: user.id });
  const newRefreshTokenHash = await hashToken(newRefreshToken);

  await db
    .update(users)
    .set({ refreshToken: newRefreshTokenHash, accessToken: accessTokenHash })
    .where(eq(users.id, user.id))
    .execute();

  return c.json({
    accessToken: accessTokenPlain,
    refreshToken: newRefreshToken,
  });
});

authRoutes.post("/logout", accessTokenMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ message: "User not found" }, 401);

  await db
    .update(users)
    .set({ refreshToken: null, accessToken: null })
    .where(eq(users.id, user.id))
    .execute();

  return c.json({ message: "Logged out" });
});
