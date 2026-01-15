import { seedUsers } from "./user";

async function seed() {
  try {
    await seedUsers();
    process.exit(0); // exit after all seeds complete
  } catch (err) {
    console.error("❌ Seed failed", err);
    process.exit(1);
  }
}

seed();
