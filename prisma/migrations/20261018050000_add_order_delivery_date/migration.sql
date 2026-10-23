-- Customer-requested delivery date for scheduled / send-later orders.
ALTER TABLE "Order" ADD COLUMN "deliveryDate" TIMESTAMP(3);
