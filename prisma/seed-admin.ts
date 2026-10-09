import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ZED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ZED_ADMIN_PASSWORD;

  if (!email || !password || password.length < 16) {
    throw new Error(
      "Admin bootstrap requires ZED_ADMIN_EMAIL and a ZED_ADMIN_PASSWORD of at least 16 characters.",
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: {
      name: "ZED 2 Admin",
      role: "ADMIN",
      status: "ACTIVE",
      passwordHash,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
    create: {
      email,
      name: "ZED 2 Admin",
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: new Date(),
      passwordHash,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  console.log("Admin account bootstrap completed.");
}

main()
  .catch((error) => {
    console.error("Admin account bootstrap failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
