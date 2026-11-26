# Status

_Updated: 2026-11-26_

## Now

- Boutique mode is merged but OFF in prod (no `SITE_MODE` there). Classic shop is live.
- PR #20 (header brush cap 96px → 141px) open, awaiting approval.

## Done

- Boutique mode: `SITE_MODE=boutique` switch, blog-like single-catalog feed, admin `/admin/boutique` (add/remove/reorder), `Product.inBoutique` + `boutiqueSortOrder`; wider site container (1600px) and more spacing — PR #21.
- Header brush height fixes — PR #16, #18.

## Next

- To turn boutique on in prod: add `SITE_MODE=${{ vars.SITE_MODE }}` to `--set-env-vars` in `.github/workflows/deploy.yml`, set repo variable `SITE_MODE=boutique`, redeploy.
- Fill the boutique with real items in the CMS (demo seed `prisma/seed-boutique.ts` is local-only).

## Decisions

- Boutique items are normal `Product` rows flagged `inBoutique` — cart, checkout, orders, stock work unchanged.
- Items created from the Boutique screen go to a hidden inactive category `boutique` (`categoryId` is required).
- In boutique mode `/shop`, `/category/*`, `/search` redirect to `/`; non-boutique products 404.

## Traps

- `deploy.yml` uses `--set-env-vars`, which REPLACES all Cloud Run env vars on every deploy — env set by hand in Cloud Run is lost. Add new env vars to the workflow.
- Local DB: `boutique-db` container conflicts on :5432 with another project; a copy runs as `boutique-db-5433` on :5433 (override `DATABASE_URL` when starting dev). Local DB was made with `db push`, so use `prisma db push` there, not `migrate deploy`.
- After `globals.css` changes the Turbopack dev cache can serve stale CSS — `rm -rf .next` and restart.
