-- Track whether the post-delivery review-request email was sent for an order.
ALTER TABLE "Order" ADD COLUMN "reviewRequestedAt" TIMESTAMP(3);
