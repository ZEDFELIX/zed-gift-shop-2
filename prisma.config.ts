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
    seed: "node --import tsx prisma/seed.ts",
  },
});
