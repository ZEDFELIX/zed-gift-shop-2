# ZED Gift Shop 2

**Canonical ZED Gift Shop 2 ecommerce repository.**

Premium Kenyan gifting storefront: WooCommerce-style category trees, personalization, gift discovery, cart and checkout, M-Pesa and card payments, reviews, wishlist, delivery zones and an admin back office.

## Current stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Prisma + PostgreSQL
- M-Pesa (Daraja) and Flutterwave payments
- Supabase-ready services
- Vercel Blob-ready uploads
- SEO: metadata API, JSON-LD, sitemap, robots, manifest

## Storefront structure

Routes mirror the source storefront conventions:

| Route | Purpose |
| --- | --- |
| `/` | Homepage: featured gifts, trust bar, new arrivals, best sellers, flash sales, occasions, recipients, reviews, blog, SEO copy |
| `/product-category/[...slug]` | Nested category pages, e.g. `/product-category/men-gifts/birthday-gifts` |
| `/product/[slug]` | Product detail with personalization |
| `/shop`, `/deals`, `/search` | Catalogue listings with filters, sorting and pagination |
| `/gifts`, `/cards`, `/wholesale`, `/personalized` | Campaign landing pages |
| `/blog`, `/blog/[slug]` | Editorial content |
| `/admin`, `/account` | Back office and customer area |

## Development

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

On Windows PowerShell, use `npm.cmd` instead of `npm` if script execution is disabled.

## Database

The repository ships with a local PostgreSQL helper and a full catalogue seed.

```bash
npm run db:status   # check the local server
npm run db:setup    # create database, push schema, seed catalogue
npm run db:seed     # re-seed products, categories, collections, zones
```

The catalogue data lives in `prisma/rio-catalogue.ts`; the seed reports any category reference that does not resolve.

## Deployment

`main` is the source of truth for this codebase. Production credentials and payment callbacks must be configured through deployment environment variables; secrets must never be committed to GitHub.
