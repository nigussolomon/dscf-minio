import { db } from "../configs/db";
import { seed } from "drizzle-seed";
import { users } from "../schema";
import { hashPassword } from "../helpers/bcrypt";
import { logger } from "../configs/pino";
import { eq } from "drizzle-orm";

export async function seedUsers() {
  try {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, "admin"))
      .limit(1);

    if (existing.length > 0) {
      logger.info("ℹ️ Admin user already exists, skipping seed");
      return;
    }
    const hashedPassword = await hashPassword("password123");

    await seed(db, { users }).refine((f) => ({
      users: {
        count: 1,
        columns: {
          username: f.default({ defaultValue: "admin" }),
          password: f.default({ defaultValue: hashedPassword }),
        },
      },
    }));

    logger.info("✅ Users seeded");
  } catch (err) {
    console.error("❌ Users seed failed", err);
    throw err;
  }
}
