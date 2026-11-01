import { defineConfig } from "prisma/config";

for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // No local env file (e.g. on Vercel, where real environment variables are injected).
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    // Use the safe, additive bootstrap seed. The legacy seed.ts contains
    // demo catalogue upserts and must never run against production data.
    seed: "node --import tsx prisma/seed-catalogue.ts",
  },
});
