-- Wholesale quotation requests (public form -> admin review)
CREATE TYPE "WholesaleQuoteStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'QUOTED', 'WON', 'CLOSED');

CREATE TABLE "WholesaleQuote" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "organisation" TEXT,
    "location" TEXT NOT NULL,
    "budget" INTEGER,
    "details" TEXT,
    "itemsJson" TEXT NOT NULL,
    "status" "WholesaleQuoteStatus" NOT NULL DEFAULT 'NEW',
    "adminNote" TEXT,
    "handledById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WholesaleQuote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WholesaleQuote_status_idx" ON "WholesaleQuote"("status");
CREATE INDEX "WholesaleQuote_createdAt_idx" ON "WholesaleQuote"("createdAt");
CREATE INDEX "WholesaleQuote_phone_idx" ON "WholesaleQuote"("phone");
