import "dotenv/config";
import { Hono } from "hono";
import { swaggerUI } from "@hono/swagger-ui";
import { logger } from "./configs/pino";
import { openApiDoc } from "./swagger";
import routes from "./routes";

const app = new Hono();

app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;

  logger.info({
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration: `${ms}ms`,
  });
});

app.get("/doc", (c) => c.json(openApiDoc));

app.get("/ui", swaggerUI({ url: "/doc" }));

app.get("/", (c) => c.json({ message: "MinIO Dev Service API" }));
app.get("/health", (c) => c.text("OK"));
app.route("/", routes);

Bun.serve({
  hostname: "0.0.0.0",
  port: process.env.PORT || 3000,
  fetch: app.fetch,
});

logger.info("🚀 Server running at http://localhost:3000");
logger.info("📘 Swagger UI available at http://localhost:3000/ui");
