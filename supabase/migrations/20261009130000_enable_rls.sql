-- Default-deny browser access for application tables.
-- The application currently performs trusted data operations server-side with
-- the Supabase service-role client or the database owner connection. Add
-- narrowly scoped policies in later migrations if direct client access is
-- intentionally introduced. The service_role bypasses RLS; anon/authenticated
-- clients do not receive blanket access to customer, order, payment, or admin data.
DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'User',
    'PasswordReset',
    'Address',
    'Notification',
    'Category',
    'Collection',
    'Product',
    'ProductVariant',
    'ProductImage',
    'ProductCategory',
    'ProductCollection',
    'Cart',
    'CartItem',
    'Wishlist',
    'WishlistItem',
    'Order',
    'OrderItem',
    'Personalization',
    'GiftMessage',
    'GiftWrap',
    'Payment',
    'PaymentEvent',
    'Refund',
    'AuditLog',
    'Coupon',
    'DeliveryZone',
    'Review',
    'OccasionReminder',
    'InventoryTransaction',
    'AdminSetting',
    'CustomerGroup',
    'CustomerGroupMember',
    'Campaign',
    'Promotion',
    'ProductView',
    '_CouponCategories',
    '_CouponCollections',
    '_CouponProducts'
  ]
  LOOP
    EXECUTE format('ALTER TABLE IF EXISTS public.%I ENABLE ROW LEVEL SECURITY', table_name);
  END LOOP;
END
$$;

-- Make PostgREST reload its schema cache after table/column migrations.
NOTIFY pgrst, 'reload schema';
