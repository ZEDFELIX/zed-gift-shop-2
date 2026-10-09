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

## Current status

This branch adds shared browser/server Supabase clients as a foundation. The existing app still imports Prisma; this is deliberately not a completed migration and must not be promoted to production until the remaining work and tests are finished.
