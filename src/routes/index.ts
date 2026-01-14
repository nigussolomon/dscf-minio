import { Hono } from "hono";
import { authRoutes } from "./auth";
import { minioRoutes } from "./minio";

const routes = new Hono();

routes.route("/auth", authRoutes);
routes.route("/minio", minioRoutes);

export default routes;
