import { Hono, type Context } from "hono";
import { db } from "../configs/db";
import { apps } from "../schema";
import { isNotNull } from "drizzle-orm";
import { verifyTokenHash } from "../helpers/jwt";

export interface ApiKeyContext extends Context {
  app?: typeof apps;
}

export const appApiKeyMiddleware = async (
  c: ApiKeyContext,
  next: () => Promise<void>,
) => {
  const apiKey = c.req.header("x-api-key");
  if (!apiKey) {
    return c.json({ message: "Missing x-api-key header" }, 401);
  }

  try {
    const allApps = await db
      .select()
      .from(apps)
      .where(isNotNull(apps.apiKey))
      .execute();

    let matchedApp = null;
    for (const a of allApps) {
      if (await verifyTokenHash(apiKey, a.apiKey)) {
        matchedApp = a;
        break;
      }
    }

    if (!matchedApp) {
      return c.json({ message: "Invalid API key" }, 401);
    }

    c.set("app", matchedApp);

    await next();
  } catch (err) {
    console.error("API key validation error:", err);
    return c.json({ message: "Internal server error" }, 500);
  }
};
