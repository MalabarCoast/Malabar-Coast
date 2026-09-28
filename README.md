# Malabar Coast

A Next.js website and online ordering system for Malabar Coast, a Kerala-inspired restaurant.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router, Webpack build)
- React 19, TypeScript
- Tailwind CSS
- GSAP + Lenis for scroll and motion
- Supabase for durable order storage
- Stripe for hosted card payments

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Copy `.env.example` to `.env.local` and fill in test credentials. See [PAYMENTS.md](./PAYMENTS.md) for checkout providers and [SUPABASE.md](./SUPABASE.md) for the database and administrator-auth deployment contract.

In development only, orders fall back to `.data/orders.json` when Supabase is not configured. Production refuses new orders without Supabase.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm start` | Start the production server |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run database, authentication, payment and security contract tests |
| `pnpm handover:allergen-register` | Recreate the 195-item allergen working register from the checked-in catalogue |
| `pnpm sanity:sync-menu-catalogue` | Preview the menu/CMS catalogue synchronisation; add `-- --apply` only after review |
| `pnpm sanity:sync-faqs` | Preview the maintained FAQ synchronisation; add `-- --apply` only after review |
| `pnpm sanity:sync-restaurant-gallery` | Preview the restaurant gallery synchronisation; add `-- --apply` only after review |

## Project structure

```
app/            Routes, pages, API handlers, menu and checkout logic
public/         Static assets (images, robots.txt, sitemap, manifest)
supabase/       Database schema
```

## Restaurant operations portal

The private portal begins at `/admin` and includes:

- a live overview of confirmed sales, orders due and kitchen workload;
- a complete searchable order register with payment-safe status advancement;
- a kitchen board for new, accepted, making, ready and delivery stages;
- daily collection, monthly sales, order-mix and dish-performance reporting;
- per-order customer, basket, audit history and staff-only operations notes; and
- a published-content command centre for menu, offers, pages and Studio CRUD workflows; and
- a read-only deployment and security readiness page.

Run the current `supabase/schema.sql` before deploying the matching application build. Supabase Auth verifies staff identity; the private `admin_profiles` table applies least-privilege roles. The portal uses a server-only Supabase secret key (or legacy service-role key) for protected operations and never connects a browser directly to private order or administrator tables.

## Documentation

- [docs/CLIENT_PRODUCT_DELIVERY_REPORT.md](./docs/CLIENT_PRODUCT_DELIVERY_REPORT.md) — single master product, operations, allergen and production-acceptance handover
- [docs/Malabar_Coast_Complete_Product_Delivery_Report.docx](./docs/Malabar_Coast_Complete_Product_Delivery_Report.docx) — client-ready Word edition of the same master handover
- [docs/MENU_ALLERGEN_REGISTER.csv](./docs/MENU_ALLERGEN_REGISTER.csv) — item-by-item working register for restaurant confirmation
- [PAYMENTS.md](./PAYMENTS.md) — orders and Stripe integration notes
- [SUPABASE.md](./SUPABASE.md) — database schema, administrator roles, provisioning and deployment verification
- [SECURITY.md](./SECURITY.md) — admin access, private order routes, headers and launch checklist
- [BOOKINGS_AND_EMAIL.md](./BOOKINGS_AND_EMAIL.md) — table capacity, hall workflow, Brevo setup and deployment order
- [LESSONS.md](./LESSONS.md) — responsive design and editorial composition notes
- [progress.txt](./progress.txt) — build log
