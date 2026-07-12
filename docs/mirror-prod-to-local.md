# Mirror Production → Local

Make **localhost look exactly like prod**: same theme, fonts, images, hero
slides, content copy, categories, products, everything. This copies the live
Cloud SQL database into your local Postgres in one pass.

## Why this is all you need

Every visual/config thing is stored in the **database**, not in files:

| What | Where it lives |
|---|---|
| Theme colours, radius, hero timing, fonts | `SiteTheme` / `FontAsset` tables |
| Logo, header brush, decorations | `SiteImage` table |
| Homepage carousel | `HeroSlide` table |
| Editable text/copy | `ContentBlock` table |
| Catalog, prices, stock | `Category` / `Product` / `ProductVariant` / `ProductImage` |
| Footer links | `SocialLink` |

Images are stored as **public GCS URLs** (`storage.googleapis.com/...`, already
whitelisted in `next.config.ts`) or inline `data:` URLs — either way they come
along with the DB copy and render locally with no extra steps. Static assets in
`/public` are already in git. **So the whole job = copy the prod DB → local DB.**

## Prerequisites (one-time)

- `gcloud` authenticated with **Cloud SQL Client** + **Secret Manager Secret
  Accessor** roles (see `docs/prod-db-access.md`).
- Local Postgres running with a `boutique` database reachable at the
  `DATABASE_URL` in your `.env` (default `postgresql://postgres:postgres@localhost:5432/boutique`).
- Postgres client tools **v16+** (`pg_dump` / `psql` / `pg_restore`). The prod
  server is Postgres 16 — an older `pg_dump` will refuse. On macOS:
  `brew install postgresql@16` (then use its `pg_dump`), or use the Docker
  fallback at the bottom.
- Deps installed: `npm ci`.

> **Agents / sandbox:** run every `gcloud` / proxy / `pg_*` command with
> `required_permissions: ["all"]` (they need network + `~/.config/gcloud`).

## Prod facts

| Property | Value |
|---|---|
| Instance connection name | `nadezhda-boutique:europe-west3:boutique-db` |
| Database | `boutique` |
| GCP project | `nadezhda-boutique` |
| Credentials | Secret Manager secret **`DATABASE_URL`** (never hardcode/print) |

---

## Recommended: CMS design only (themes / images / style)

If you only want the **CMS-managed look** (theme colours, fonts, images, hero
carousel, editable copy, footer links) and want to leave your local catalog,
orders, and users alone, copy just these six tables. This is the safest option —
it never touches customer data. **Verified working.**

```bash
# 1) Start the proxy on 5433 (see the download snippet in "Quick path" step 1).
/tmp/cloud-sql-proxy --port 5433 nadezhda-boutique:europe-west3:boutique-db &

# 2) Connection strings (do NOT echo — they contain the password).
RAW=$(gcloud secrets versions access latest --secret=DATABASE_URL --project nadezhda-boutique)
CREDS=${RAW#postgresql://}; CREDS=${CREDS%%@*}; NOQ=${RAW%%\?*}; DBNAME=${NOQ##*/}
PROD_URL="postgresql://${CREDS}@127.0.0.1:5433/${DBNAME}"
LOCAL_URL="postgresql://postgres:postgres@localhost:5432/boutique"

# 3) Dump the CMS/site-design tables (data only) from prod.
pg_dump "$PROD_URL" --data-only --no-owner --no-privileges \
  --table='public."SiteTheme"'  --table='public."FontAsset"' \
  --table='public."SiteImage"'  --table='public."HeroSlide"' \
  --table='public."ContentBlock"' --table='public."SocialLink"' \
  > /tmp/cms.sql

# 4) pg_dump v17+ emits `SET transaction_timeout` which a Postgres 16 server
#    rejects — strip it (harmless when the server is 17+).
grep -v '^SET transaction_timeout' /tmp/cms.sql > /tmp/cms.filtered.sql

# 5) Replace the local tables in one transaction. session_replication_role=replica
#    disables FK/trigger checks so load order doesn't matter.
{ printf 'BEGIN;\nSET session_replication_role = replica;\nTRUNCATE "SiteTheme","FontAsset","SiteImage","HeroSlide","ContentBlock","SocialLink";\n';
  cat /tmp/cms.filtered.sql;
  printf '\nCOMMIT;\n'; } | psql "$LOCAL_URL" -v ON_ERROR_STOP=1

# 6) Refresh the browser (pages are force-dynamic — no rebuild needed). Stop proxy:
kill %1 2>/dev/null || true
```

Images referenced by these rows are public GCS URLs or inline `data:` URLs, so
they render locally with no extra steps.

### Also mirror the catalog (categories / products)

To make the storefront show the **same products** as prod (product cards, prices,
variants, product images) on top of the design, add the four catalog tables to
the same recipe. FK order is handled by `session_replication_role = replica`,
which also lets you `TRUNCATE` a table that other tables reference.

```bash
# (proxy running, PROD_URL / LOCAL_URL set as in steps 1–2 above)

# Dump CMS + catalog tables together (data only).
pg_dump "$PROD_URL" --data-only --no-owner --no-privileges \
  --table='public."SiteTheme"'   --table='public."FontAsset"' \
  --table='public."SiteImage"'   --table='public."HeroSlide"' \
  --table='public."ContentBlock"' --table='public."SocialLink"' \
  --table='public."Category"'    --table='public."Product"' \
  --table='public."ProductVariant"' --table='public."ProductImage"' \
  > /tmp/cms.sql
grep -v '^SET transaction_timeout' /tmp/cms.sql > /tmp/cms.filtered.sql

{ printf 'BEGIN;\nSET session_replication_role = replica;\nTRUNCATE "SiteTheme","FontAsset","SiteImage","HeroSlide","ContentBlock","SocialLink","Category","Product","ProductVariant","ProductImage";\n';
  cat /tmp/cms.filtered.sql;
  printf '\nCOMMIT;\n'; } | psql "$LOCAL_URL" -v ON_ERROR_STOP=1
```

> **Caveat — local orders.** `OrderItem`/`Order` are **not** copied (they hold
> customer data). Because catalog rows are replaced, any existing **local** test
> orders may end up referencing product IDs that no longer exist. That's harmless
> for local dev, but if you need order↔product integrity too, use the **Full
> database** path below instead.

---

## Full database (everything: also catalog, orders, users)

Use this only when you want a complete replica including customer data.

## Quick path (copy-paste, ~1 minute)

Run these in order. **Uses proxy port 5433** so it never clashes with your local
Postgres on 5432.

```bash
# 1) Download + start the Cloud SQL Auth Proxy on 5433 (leave it running).
ARCH=$(uname -m); case "$ARCH" in arm64|aarch64) A=arm64;; *) A=amd64;; esac
curl -sL "https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.14.1/cloud-sql-proxy.darwin.$A" -o /tmp/cloud-sql-proxy
chmod +x /tmp/cloud-sql-proxy
/tmp/cloud-sql-proxy --port 5433 nadezhda-boutique:europe-west3:boutique-db &
PROXY_PID=$!
# wait until it accepts connections
for i in $(seq 1 30); do (echo > /dev/tcp/127.0.0.1/5433) >/dev/null 2>&1 && break; sleep 1; done
```

```bash
# 2) Build the prod connection string from Secret Manager (points at the proxy).
#    Do NOT echo these — they contain the password.
RAW=$(gcloud secrets versions access latest --secret=DATABASE_URL --project nadezhda-boutique)
CREDS=${RAW#postgresql://}; CREDS=${CREDS%%@*}     # user:password
NOQ=${RAW%%\?*}; DBNAME=${NOQ##*/}                 # boutique
PROD_URL="postgresql://${CREDS}@127.0.0.1:5433/${DBNAME}"

# Your LOCAL target DB (matches .env; change if yours differs).
LOCAL_URL="postgresql://postgres:postgres@localhost:5432/boutique"
```

```bash
# 3) Copy prod → local in one streamed pass (schema + data, drops old objects).
pg_dump "$PROD_URL" --no-owner --no-privileges --clean --if-exists \
  | psql "$LOCAL_URL" -v ON_ERROR_STOP=0
```

```bash
# 4) Regenerate the Prisma client and start the app.
npx prisma generate
npm run dev            # http://localhost:3000 now mirrors prod
```

```bash
# 5) Cleanup — stop the proxy.
kill "$PROXY_PID" 2>/dev/null || true
```

That's it. Localhost now shows the exact prod theme, images, carousel, catalog,
and copy.

---

## Safer path (dump to a file first)

Useful if you want a reusable snapshot or the stream errors out.

```bash
# with the proxy running and PROD_URL / LOCAL_URL set as above:
pg_dump "$PROD_URL" --format=custom --no-owner --no-privileges -f /tmp/prod.dump

# reset the local DB cleanly, then restore
psql "$LOCAL_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
pg_restore --no-owner --no-privileges --clean --if-exists -d "$LOCAL_URL" /tmp/prod.dump

npx prisma generate && npm run dev
```

## Images: nothing extra needed

- Prod image URLs are `https://storage.googleapis.com/<bucket>/...`, and that
  host is already allowed in `next.config.ts`, so `next/image` renders them
  locally with no config.
- If any image is a custom CDN domain instead, set the same value prod uses:
  add `NEXT_PUBLIC_GCS_PUBLIC_BASE="https://<that-host>"` to `.env` and restart
  `npm run dev` (it registers the host as a remote image pattern).
- `data:` URL images are embedded in the DB and just work.

## Notes & cautions

- **This copies real customer data** (orders, users, emails, newsletter). Keep
  the local dump private; delete `/tmp/prod.dump` when done. Never commit it.
- **Read-only on prod.** `pg_dump` only reads; this flow never writes to prod.
- **Secrets stay test/local.** You do *not* need prod Stripe/Auth/Resend keys to
  make it *look* like prod — leave your local test values in `.env`. Google/
  Stripe logins won't work locally unless you also configure those, but the
  storefront appearance will be identical.
- **Schema mismatch?** The dump includes the full schema, so local matches prod
  exactly. If you're on a branch with newer migrations, re-run
  `npx prisma migrate dev` afterward to re-apply local-only schema changes.
- **`pg_dump` version error** (`server version mismatch`): use a Dockerized v16
  client instead of step 3:

  ```bash
  docker run --rm --network host postgres:16 \
    bash -c 'pg_dump "$0" --no-owner --no-privileges --clean --if-exists' "$PROD_URL" \
    | psql "$LOCAL_URL"
  ```
  (On macOS/Windows Docker, replace `127.0.0.1`/`localhost` in the URLs with
  `host.docker.internal` and drop `--network host`.)
