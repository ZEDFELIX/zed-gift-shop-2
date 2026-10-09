# Supabase-only migration (in progress)

The production database is already a Supabase-hosted PostgreSQL database, but the application still uses Prisma as its ORM and for custom-password authentication. Do not delete the Prisma schema/migrations or remove Prisma packages until every Prisma query and every build/runtime reference has been replaced and the app has passed the migration checks.

## Environment variables

Set these in Vercel and local development:

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Supabase publishable key.
- `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` may be used server-side as aliases, but the `NEXT_PUBLIC_*` values are required by browser code.
- `SUPABASE_SECRET_KEY` — server-only, for tightly controlled administrative/bootstrap tasks only. Never expose it with a `NEXT_PUBLIC_` prefix or send it to a browser.
- Keep payment provider secrets server-side.

## Migration safety

1. Back up the existing Supabase database before applying schema changes.
2. Baseline the existing schema before using Supabase CLI migrations. The current database was previously created/updated by Prisma migrations, so blindly applying a copied initial schema would fail on existing types/tables.
3. Convert query modules and transactions to Supabase/Postgres RPC where atomic multi-table operations are needed.
4. Move login to Supabase Auth and map authenticated `auth.users` identities to an application profile with an explicit role. Never trust a client-supplied role.
5. Add and verify RLS policies for customer-owned records; restrict admin operations to server-verified admin identities.
6. Replace seed scripts with idempotent Supabase-compatible scripts.
7. Only after source scans and production build pass should Prisma dependencies, scripts, schema and migrations be removed.

## Current status (2026-10-09)

- Shared Supabase browser, server, and admin clients are in place.
- Login, registration, logout, account-password changes, and password recovery routes now use Supabase Auth.
- Admin bootstrap and catalogue seed scripts use Supabase Auth/Data API.
- Added authUserId profile mapping and a default-deny RLS migration for application tables.
- The npm manifest is aligned to the committed lockfile; npm ci and TypeScript typecheck pass in a clean sandbox.
- A local Next.js production build completes, but logs show remaining Prisma queries still execute during page generation. This is not proof of a functional Supabase-only build.
- Many API routes and data-access modules still use Prisma. Checkout, product administration, and M-Pesa success flows have not been tested against the real database.

## Safe migration procedure

Do not run 20260101000000_initial_schema.sql blindly against an existing database. First inspect the live schema and migration history in Supabase. If the Prisma-created tables already exist, baseline the schema and apply only missing migrations. The 20261009110000_add_auth_user_mapping.sql and 20261009130000_enable_rls.sql migrations must be checked against the live schema before applying. After applying migrations, verify the User.authUserId column, table visibility in the Data API, and RLS state for every application table.

Do not merge this branch or promote its preview to production until all Prisma queries are converted, the remaining runtime errors are gone, and admin login, catalogue CRUD, checkout, and M-Pesa callbacks have passed integration tests.
