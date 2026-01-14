import { db } from "../configs/db";
import { seed } from "drizzle-seed";
import { users } from "../schema";
import { hashPassword } from "../helpers/bcrypt";
import { logger } from "../configs/pino";

async function main() {
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
}

export function seedUsers() {
  main()
    .then(() => {
      logger.info("✅ Users seeded");
      process.exit(0);
    })
    .catch((err) => {
      logger.error("❌ Seed failed", err);
      process.exit(1);
    });
}
