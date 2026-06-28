# Autorun — start the site locally

Follow these steps in order to run the Art Boutique store + admin CMS locally.
All commands are idempotent (safe to re-run) and assume macOS with Docker
Desktop, Node 22+, and npm installed. Run everything from the repo root:
`/Users/mac/Documents/nadezhdakatsarova/nadezhdakatsarova`.

---

## TL;DR (one-shot)

```bash
# 1. Start Docker Desktop and wait until ready
open -a Docker; until docker info >/dev/null 2>&1; do sleep 2; done

# 2. Start (or reuse) the Postgres container
docker start boutique-db 2>/dev/null || \
  docker run -d --name boutique-db \
    -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=boutique \
    -p 5432:5432 postgres:16
until docker exec boutique-db pg_isready -U postgres >/dev/null 2>&1; do sleep 1; done

# 3. Install deps + env + schema + seed (first run only)
[ -d node_modules ] || npm install
[ -f .env ] || cp .env.example .env
npm run db:push
npm run db:seed

# 4. Run the dev server
npm run dev
```

Then open:
- Storefront: http://localhost:3000
- Admin CMS:  http://localhost:3000/admin  (login `admin@example.com` / `admin12345`)

---

## Step-by-step

### 1. Database (Docker Postgres)

The app expects PostgreSQL on `localhost:5432` with db `boutique`
(user `postgres`, password `postgres`). This matches `DATABASE_URL` in `.env`.

```bash
# Ensure Docker is running
open -a Docker
until docker info >/dev/null 2>&1; do echo "waiting for docker..."; sleep 2; done

# Create the container if it doesn't exist, otherwise just start it
if docker ps -a --format '{{.Names}}' | grep -q '^boutique-db$'; then
  docker start boutique-db
else
  docker run -d --name boutique-db \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_DB=boutique \
    -p 5432:5432 \
    postgres:16
fi

# Wait until Postgres accepts connections
until docker exec boutique-db pg_isready -U postgres >/dev/null 2>&1; do sleep 1; done
echo "Postgres ready."
```

### 2. Environment

```bash
[ -f .env ] || cp .env.example .env
```

The default `.env` already contains a working local config:
- `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/boutique?schema=public"`
- `AUTH_SECRET` (dev value)

Optional integrations work only when their keys are filled in (the app degrades
gracefully when they are empty):
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` — checkout/payments
- `AUTH_GOOGLE_ID/SECRET`, `AUTH_FACEBOOK_ID/SECRET` — social login
- `RESEND_API_KEY`, `RESEND_AUDIENCE_ID` — emails + campaigns
- `GCS_BUCKET`, `NEXT_PUBLIC_GCS_PUBLIC_BASE` — product image uploads (otherwise images are stored as data URLs)
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` — Google Analytics

### 3. Dependencies, schema, seed

```bash
# First run only
[ -d node_modules ] || npm install

# Create/sync tables (safe to re-run)
npm run db:push

# Seed sample data (categories, products, WELCOME10 code, shipping, admin user)
npm run db:seed
```

Seed creates an admin: **admin@example.com / admin12345**
(override with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `.env`).

### 4. Run

```bash
npm run dev
```

- Storefront (BG default): http://localhost:3000
- English: http://localhost:3000/en
- Admin CMS: http://localhost:3000/admin

---

## Verify it's working

```bash
for p in / /en /shop /category/tshirts /product/tshirt-opinion /sign-in; do
  echo "$p -> $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000$p)"
done
# /admin should return 307 (redirect to sign-in when logged out)
curl -s -o /dev/null -w '/admin -> %{http_code}\n' http://localhost:3000/admin
```

Expected: storefront paths `200`, `/admin` `307`.

---

## Useful commands

```bash
npm run db:studio     # Prisma Studio GUI to inspect/edit data
npm run db:push       # re-sync schema after editing prisma/schema.prisma
npm run db:seed       # re-seed sample data
npm run build         # production build
npm run lint          # eslint

docker stop boutique-db    # stop the database
docker start boutique-db   # start it again
docker logs boutique-db    # database logs
```

---

## Reset everything (clean slate)

```bash
docker rm -f boutique-db
# then redo Step 1 (create container), Step 3 (db:push + db:seed)
```

---

## Troubleshooting

- **`Can't reach database server at localhost:5432`** — the container isn't
  running. Run `docker start boutique-db` and wait for `pg_isready`.
- **Docker daemon not running** — `open -a Docker`, wait ~10s, retry.
- **Port 5432 already in use** — another Postgres is running. Stop it, or change
  the container port mapping (e.g. `-p 5433:5432`) and update `DATABASE_URL`.
- **Port 3000 in use** — run `npm run dev -- -p 3001`.
- **Prisma client out of date after schema change** — `npm run db:generate`.
- **Checkout returns "payments not configured"** — add Stripe test keys to `.env`
  and restart `npm run dev`.
- **Stripe webhooks locally** — `stripe listen --forward-to localhost:3000/api/stripe/webhook`
  and put the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET`.
