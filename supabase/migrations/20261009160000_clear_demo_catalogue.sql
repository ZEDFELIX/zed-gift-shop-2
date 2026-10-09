-- Zed Gift Shop: clear the explicitly identified demo catalogue before rebuilding it on Supabase.
-- Keep customer accounts, orders, payments, settings, and historical order items intact.
-- Historical OrderItem rows are intentionally preserved for audit/history.
BEGIN;

DELETE FROM "ProductVariant";
DELETE FROM "ProductImage";
DELETE FROM "ProductCategory";
DELETE FROM "ProductCollection";
DELETE FROM "Product";

COMMIT;
