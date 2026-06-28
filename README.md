# Nadezhda Katsarova — Art Boutique & CMS

A bilingual (Bulgarian / English, EUR) art-boutique e-commerce store with a fully
custom admin CMS. The owner manages catalog, inventory, discounts, orders and
email campaigns from the admin — no code changes needed. Built with Next.js, runs
on Google Cloud Run.

## Stack

- **Next.js 16 (App Router, TypeScript)** — storefront + admin in one service
- **PostgreSQL + Prisma** — single source of truth (catalog, stock, orders)
- **Auth.js (NextAuth v5)** — Google, Facebook, email/password + `ADMIN` role
- **Stripe** — dynamic server-side pricing, cards + Apple Pay + Google Pay
- **Resend** — transactional emails + marketing Broadcasts (with unsubscribe)
- **Google Cloud Storage** — product image uploads
- **next-intl** — BG/EN localization
- **GA4** — ecommerce events behind a GDPR consent banner
- **Tailwind CSS v4** — warm art-boutique design system

## Features

- Catalog with categories/sub-categories, variants (size/color) and per-variant
  warehouse stock → automatic in-stock / out-of-stock on the storefront.
- Product-level sale ribbons (`-XX%`) on thumbnails and product pages.
- Discount codes (percent/fixed, min order, usage + per-user limits, expiry),
  validated server-side at checkout.
- Stripe checkout where prices are always recomputed from the database — the
  owner sets prices in the CMS; no Stripe product IDs in code. Stock is
  decremented atomically by the webhook on successful payment.
- Admin CMS at `/admin` (optionally on a dedicated host via `ADMIN_HOST`):
  dashboard, products, categories, discounts, orders, shipping zones/rates,
  subscribers, and an email campaign composer.
- Newsletter signup with consent + unsubscribe, synced to a Resend audience.

## Local development

1. Install dependencies:

```bash
npm install
```

2. Copy env and fill values:

```bash
cp .env.example .env
```

At minimum set `DATABASE_URL` and `AUTH_SECRET` (`openssl rand -base64 32`).
Stripe / Resend / GCS / OAuth are optional locally — the app degrades
gracefully (e.g. images become data URLs, emails are logged).

3. Create the schema and seed sample data:

```bash
npm run db:push      # or: npm run db:migrate
npm run db:seed
```

The seed creates an admin (default `admin@example.com` / `admin12345`),
categories, sample products with variants, a `WELCOME10` code, and shipping
zones. Change the admin credentials via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.

4. Run the dev server:

```bash
npm run dev
```

- Storefront: http://localhost:3000
- Admin: http://localhost:3000/admin (sign in with the seeded admin)

### Stripe webhook (local)

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Put the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET`.

## Deployment (Google Cloud Run via GitHub Actions)

Deployment is automated by [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
on every push to `main`:

1. Builds the container (Next.js standalone) and pushes it to Artifact Registry.
2. Runs `prisma migrate deploy` against Cloud SQL through the Cloud SQL Auth Proxy.
3. Deploys to Cloud Run with secrets from Secret Manager and the Cloud SQL
   connection attached.

### One-time GCP setup

```bash
# Enable APIs
gcloud services enable run.googleapis.com artifactregistry.googleapis.com \
  sqladmin.googleapis.com secretmanager.googleapis.com

# Artifact Registry repo
gcloud artifacts repositories create boutique --repository-format=docker --location=REGION

# Cloud SQL (Postgres)
gcloud sql instances create boutique-db --database-version=POSTGRES_16 \
  --tier=db-f1-micro --region=REGION
gcloud sql databases create boutique --instance=boutique-db
gcloud sql users create app --instance=boutique-db --password=SECRET

# Storage bucket for product images (make objects public or front with a CDN)
gcloud storage buckets create gs://YOUR_BUCKET --location=REGION

# Secret Manager secrets (repeat for each)
printf 'VALUE' | gcloud secrets create AUTH_SECRET --data-file=-
```

Create the rest of the secrets referenced in the workflow: `DATABASE_URL`,
`AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_FACEBOOK_ID`,
`AUTH_FACEBOOK_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`RESEND_API_KEY`.

> `DATABASE_URL` for Cloud Run uses the Cloud SQL unix socket:
> `postgresql://app:SECRET@localhost/boutique?host=/cloudsql/PROJECT:REGION:boutique-db`

### GitHub configuration

Add the repository **Variables** and **Secrets** listed at the top of the
workflow file. The deploy service account needs: Cloud Run Admin, Artifact
Registry Writer, Cloud SQL Client, Secret Manager Secret Accessor, Service
Account User.

### After first deploy

- Point your Stripe webhook to `https://YOUR_DOMAIN/api/stripe/webhook`.
- In Stripe, register the domain for Apple Pay / Google Pay.
- Set OAuth redirect URIs to `https://YOUR_DOMAIN/api/auth/callback/{google,facebook}`.

## Project layout

```
prisma/schema.prisma          Data model
prisma/seed.ts                Sample data
src/app/[locale]/...          Storefront (home, shop, category, product, cart, checkout, account)
src/app/admin/...             Admin CMS
src/app/api/...               Route handlers (checkout, stripe webhook, newsletter, upload, ...)
src/lib/...                   prisma, auth, stripe, resend, pricing, checkout, marketing, gcs
src/components/...            Storefront, admin, checkout, auth and UI components
messages/{bg,en}.json         Translations
```
