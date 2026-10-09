-- Link the existing application user records to Supabase Auth identities.
-- This is additive: existing orders and user IDs remain unchanged.
ALTER TABLE public."User"
  ADD COLUMN IF NOT EXISTS "authUserId" uuid;

CREATE UNIQUE INDEX IF NOT EXISTS "User_authUserId_key"
  ON public."User" ("authUserId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'User_authUserId_fkey'
      AND conrelid = 'public."User"'::regclass
  ) THEN
    ALTER TABLE public."User"
      ADD CONSTRAINT "User_authUserId_fkey"
      FOREIGN KEY ("authUserId")
      REFERENCES auth.users(id)
      ON DELETE SET NULL;
  END IF;
END
$$;
