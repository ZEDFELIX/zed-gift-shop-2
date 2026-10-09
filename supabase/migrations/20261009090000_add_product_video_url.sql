-- Keep the deployed database aligned with prisma/schema.prisma.
ALTER TABLE "Product" ADD COLUMN "videoUrl" TEXT;
