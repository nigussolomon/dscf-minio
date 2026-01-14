import type { Context } from "hono";

export function getBearerToken(c: Context): string | null {
  const authHeader = c.req.header("authorization");

  if (!authHeader) return null;

  const [type, token] = authHeader.split(" ");

  if (type !== "Bearer" || !token) return null;

  return token;
}
