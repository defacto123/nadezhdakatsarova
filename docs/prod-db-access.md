# Production Database Access

How to connect to and operate the **production** PostgreSQL database safely.
This is the live customer database — treat every write as production.

## What the prod DB is

| Property | Value |
|---|---|
| Engine | Cloud SQL for PostgreSQL 16 |
| Instance connection name | `nadezhda-boutique:europe-west3:boutique-db` |
| Database name | `boutique` |
| GCP project | `nadezhda-boutique` |
| App user / password | stored in Secret Manager secret **`DATABASE_URL`** (never hardcode) |
| ORM | Prisma (`prisma/schema.prisma`) |

The Cloud SQL instance has **no public client**; access goes through the
**Cloud SQL Auth Proxy**, which opens a local TCP port that tunnels to the
instance using your `gcloud` credentials.

## Prerequisites

- `gcloud` authenticated as an account with the **Cloud SQL Client** and
  **Secret Manager Secret Accessor** roles (currently `antonio.sotirov@gmail.com`).
- `cloud-sql-proxy` v2 binary (auto-downloaded by the snippet below).
- Node deps installed (`npm ci`) so `prisma` / `tsx` are available.

### Agents / sandbox note
`gcloud` needs to write to `~/.config/gcloud`, which the default sandbox blocks.
Run any `gcloud` / proxy command with **`required_permissions: ["all"]`**
(outside the sandbox). Network-only tasks can use `["full_network"]`.

## Step 1 — Start the Cloud SQL Auth Proxy

```bash
# Download the proxy once (macOS; use .arm64 on Apple Silicon, .amd64 on Intel)
ARCH=$(uname -m); case "$ARCH" in arm64|aarch64) A=arm64;; *) A=amd64;; esac
curl -sL "https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.14.1/cloud-sql-proxy.darwin.$A" -o /tmp/cloud-sql-proxy
chmod +x /tmp/cloud-sql-proxy

# Open the tunnel on 127.0.0.1:5432 (leave running in a terminal)
/tmp/cloud-sql-proxy --port 5432 nadezhda-boutique:europe-west3:boutique-db
```

## Step 2 — Build a local connection string from Secret Manager

The stored `DATABASE_URL` uses a Cloud SQL unix socket (for Cloud Run). For a
local proxy connection, swap the host for `127.0.0.1:5432`:

```bash
RAW=$(gcloud secrets versions access latest --secret=DATABASE_URL --project nadezhda-boutique)
CREDS=${RAW#postgresql://}; CREDS=${CREDS%%@*}      # user:password
NOQ=${RAW%%\?*}; DBNAME=${NOQ##*/}                  # boutique
export DATABASE_URL="postgresql://${CREDS}@127.0.0.1:5432/${DBNAME}"
# Do NOT echo $DATABASE_URL — it contains the password.
```

## Step 3 — Pick a tool

### A) Prisma Studio (recommended GUI viewer/editor — already in the repo)
A web-based table browser/editor. With the proxy running and `DATABASE_URL`
exported as above:

```bash
npx prisma studio        # opens http://localhost:5555
# or the repo script (reads .env, so export DATABASE_URL in that shell first):
npm run db:studio
```

### B) A desktop SQL client (TablePlus, DBeaver, pgAdmin)
With the proxy running, connect the client to:
`Host 127.0.0.1`, `Port 5432`, `Database boutique`, and the user/password from
the `DATABASE_URL` secret. TablePlus/DBeaver are the easiest to install on macOS
(`brew install --cask tableplus` or `dbeaver-community`).

### C) `psql` (CLI)
```bash
psql "$DATABASE_URL"
```

### D) One-off scripted change (best for repeatable/audited edits)
Write a small Prisma script in the repo root (so `@prisma/client` resolves),
run it, then delete it:

```ts
// _task.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  // e.g. promote a user to admin:
  await prisma.user.upsert({
    where: { email: "someone@example.com" },
    update: { role: "ADMIN" },
    create: { email: "someone@example.com", role: "ADMIN" },
  });
}
main().finally(() => prisma.$disconnect());
```

```bash
DATABASE_URL="$DATABASE_URL" npx tsx _task.ts && rm _task.ts
```

Raw SQL alternative (no result output, good for DML/DDL):
```bash
echo 'UPDATE "User" SET role='\''ADMIN'\'' WHERE email='\''someone@example.com'\'';' \
  | npx prisma db execute --url "$DATABASE_URL" --stdin
```

## Common task: make a user an admin

Roles live on `User.role` (`USER` default, `ADMIN`). Promote by email — the
upsert pre-creates the row if the person hasn't signed in yet; because the auth
providers use `allowDangerousEmailAccountLinking`, their first Google/Facebook
login with that email links to this row and inherits `ADMIN`.

## Schema changes — use migrations, not manual edits

Never alter tables/columns by hand in prod. Change `prisma/schema.prisma`, then:
```bash
npm run db:migrate          # creates a migration locally (against a dev DB)
```
Migrations are applied to prod automatically by the deploy workflow
(`prisma migrate deploy` via the proxy in `.github/workflows/deploy.yml`).

## Safety rules

- **It is production.** No `DROP`, `TRUNCATE`, or unfiltered `DELETE`/`UPDATE`.
- Always scope writes with a unique `WHERE` (e.g. `email`).
- Prefer idempotent upserts and read the row back to verify.
- Never print or commit the DB password or the `DATABASE_URL` secret.
- Stop the proxy when done; delete any temp scripts.
- For risky changes, take a snapshot first:
  `gcloud sql backups create --instance=boutique-db --project nadezhda-boutique`.
