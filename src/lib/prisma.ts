import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getDatabaseUrl() {
 const url = process.env.zedgiftshop2_PRISMA_DATABASE_URL ?? process.env.DATABASE_URL;
 if (!url) return undefined;

 const separator = url.includes("?") ? "&" : "?";
 // Vercel serverless functions can otherwise exhaust Prisma's default
 // connection pool when multiple requests hit the same instance.
 return `${url}${separator}connection_limit=1&pool_timeout=20`;
}

const databaseUrl = getDatabaseUrl();

export const prisma =
 globalForPrisma.prisma ??
 new PrismaClient({
  ...(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : {}),
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
 });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
