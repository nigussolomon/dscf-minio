import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const apps = pgTable("apps", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  apiKey: text("api_key").notNull(),
  bucketName: text("bucket_name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});
