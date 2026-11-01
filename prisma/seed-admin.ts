import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ZED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ZED_ADMIN_PASSWORD;

  if (!email) {
    throw new Error("Admin bootstrap requires ZED_ADMIN_EMAIL.");
  }

  if (password && password.length < 8) {
    throw new Error("ZED_ADMIN_PASSWORD must be at least 8 characters.");
  }

  let existing = await prisma.user.findUnique({ where: { email } });

  // Rename the current admin account in place when the configured login email
  // changes. This preserves its existing password hash and avoids creating a
  // second administrator during deployment.
  if (!existing && email === "zedgiftshopke@gmail.com") {
    const previousAdmin = await prisma.user.findUnique({
      where: { email: "info@zedgiftshop2.com" },
    });
    if (previousAdmin) {
      existing = await prisma.user.update({
        where: { id: previousAdmin.id },
        data: { email },
      });
      console.log("Existing admin email updated; password preserved.");
    } else if (!password) {
      // Do not block the storefront build if the old admin row is absent.
      // Creating a replacement admin still requires an explicitly configured password.
      console.warn(
        "Admin email migration skipped: previous admin account was not found and ZED_ADMIN_PASSWORD is not configured. Storefront build will continue without creating an admin account.",
      );
      return;
    }
  }

  if (existing) {
    // A deployment must not mutate an existing administrator record.
    // Preserve the password, role, status, profile, lockout counters and
    // security state. Account changes belong in the admin account workflow.
    console.log("Existing admin account preserved; deployment made no account changes.");
  } else {
    if (!password) {
      throw new Error(
        "Creating the initial admin requires ZED_ADMIN_PASSWORD of at least 8 characters.",
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
