import { Hono } from "hono";
import { z } from "zod";
import { db } from "../configs/db";
import { apps } from "../schema";
import {
  ensureBucket,
  getObject,
  slugifyBucket,
  uploadObject,
} from "../helpers/minio";
import { generateApiKey, hashApiKey } from "../helpers/bcrypt";
import { appApiKeyMiddleware } from "../middlewares/apiKey";
import { accessTokenMiddleware } from "../middlewares/auth";
import { obfuscateSecret } from "../helpers/formatters";
import { eq } from "drizzle-orm";
import { Readable } from "stream";

export const minioRoutes = new Hono();

const createAppSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});

const appIdParam = z.object({
  id: z.string(),
});

minioRoutes.get("/apps", accessTokenMiddleware, async (c) => {
  const _apps = await db.select().from(apps).execute();

  const response = _apps.map((app) => ({
    id: app.id,
    name: app.name,
    description: app.description,
    bucketName: app.bucketName,
    apiKey: obfuscateSecret(app.apiKey),
    createdAt: app.createdAt,
  }));

  return c.json(response);
});

minioRoutes.post("/apps/:id/regenerate", accessTokenMiddleware, async (c) => {
  const params = appIdParam.parse(c.req.param());
  const appId = Number(params.id);

  const [app] = await db
    .select()
    .from(apps)
    .where(eq(apps.id, appId))
    .execute();

  if (!app) return c.json({ message: "App not found" }, 404);

  const newApiKeyPlain = generateApiKey();
  const newApiKeyHash = await hashApiKey(newApiKeyPlain);

  await db
    .update(apps)
    .set({ apiKey: newApiKeyHash })
    .where(eq(apps.id, appId))
    .execute();

  return c.json({
    message: "API key regenerated",
    apiKey: newApiKeyPlain,
  });
});

minioRoutes.post("/apps", accessTokenMiddleware, async (c) => {
  const body = createAppSchema.parse(await c.req.json());
  const bucketName = slugifyBucket(body.name);
  await ensureBucket(bucketName);
  const apiKeyPlain = generateApiKey();
  const apiKeyHash = await hashApiKey(apiKeyPlain);
  const [app] = await db
    .insert(apps)
    .values({
      name: body.name,
      description: body.description || "",
      bucketName,
      apiKey: apiKeyHash,
    })
    .returning()
    .execute();
  return c.json({
    bucketName,
    apiKey: apiKeyPlain,
    app: { ...app, apiKey: obfuscateSecret(app ? app.apiKey : null) },
  });
});

minioRoutes.post("/upload", appApiKeyMiddleware, async (c) => {
  try {
    const form = await c.req.formData();
    const file = form.get("file") as File;
    if (!file) return c.json({ message: "No file provided" }, 400);

    const app = c.get("app");
    if (!app) return c.json({ message: "App not found in context" }, 500);

    const nodeStream = Readable.from(file.stream());
    const success = await uploadObject(app.bucketName, file.name, nodeStream);

    if (!success) return c.json({ message: "Failed to upload file" }, 500);

    return c.json({ message: "Uploaded", fileName: success as string });
  } catch (err) {
    console.error("Upload error:", err);
    return c.json({ message: "Internal server error during upload" }, 500);
  }
});

minioRoutes.get("/download/:objectName", appApiKeyMiddleware, async (c) => {
  try {
    const objectName = c.req.param("objectName");
    const app = c.get("app");
    if (!app) return c.json({ message: "App not found in context" }, 500);

    const data = await getObject(app.bucketName, objectName);
    if (!data) return c.json({ message: "Object not found" }, 404);

    return new Response(data, {
      headers: {
        "Content-Disposition": `attachment; filename="${objectName}"`,
        "Content-Type": "application/octet-stream",
      },
    });
  } catch (err) {
    console.error("Download error:", err);
    return c.json({ message: "Internal server error during download" }, 500);
  }
});
