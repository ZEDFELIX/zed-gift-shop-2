import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ZED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ZED_ADMIN_PASSWORD;
  const resetExistingPassword = process.env.ZED_ADMIN_RESET_PASSWORD === "true";

  if (!email) {
    throw new Error("Admin bootstrap requires ZED_ADMIN_EMAIL.");
  }

  if (password && password.length < 16) {
    throw new Error("ZED_ADMIN_PASSWORD must be at least 16 characters.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    // Normal builds must never silently rotate the administrator's password.
    // A deliberate one-time reset requires ZED_ADMIN_RESET_PASSWORD=true and
    // a strong ZED_ADMIN_PASSWORD in the deployment environment.
    const passwordHash =
      resetExistingPassword && password
        ? await bcrypt.hash(password, 12)
        : undefined;

    await prisma.user.update({
      where: { email },
      data: {
        name: "ZED 2 Admin",
        role: "ADMIN",
        status: "ACTIVE",
        ...(passwordHash ? { passwordHash } : {}),
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
    console.log(
      resetExistingPassword && password
        ? "Admin account verified and password reset completed."
        : "Admin account verified; existing password preserved.",
    );
  } else {
    if (!password) {
      throw new Error(
        "Creating the initial admin requires ZED_ADMIN_PASSWORD of at least 16 characters.",
      );
    }

    await prisma.user.create({
      data: {
        email,
        name: "ZED 2 Admin",
        role: "ADMIN",
        status: "ACTIVE",
        emailVerified: new Date(),
        passwordHash: await bcrypt.hash(password, 12),
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
    console.log("Initial admin account created.");
  }
}

main()
  .catch((error) => {
    console.error("Admin account bootstrap failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
