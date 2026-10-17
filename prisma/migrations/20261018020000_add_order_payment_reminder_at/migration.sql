-- Track whether an abandoned-checkout reminder email was sent for an order.
ALTER TABLE "Order" ADD COLUMN "paymentReminderAt" TIMESTAMP(3);
