# Status

_Updated: 2026-11-26_

## Now

- Boutique mode is ON in prod (repo variable `SITE_MODE=boutique`). Off: delete the variable and re-run "Deploy to Cloud Run".

## Done

- Boutique decorative images (`BoutiqueImage`, admin section under `/admin/boutique`, spread evenly between products, same motion/bg controls as site images) — PR #24.
- Removed storefront `loading.tsx` skeleton (grey boxes flashed on reload) — PR #23.
- Deploy passes repo variable `SITE_MODE` to Cloud Run (default `classic`) — PR #22.
- Header brush cap 96px → 141px — PR #20.
- Boutique mode: `SITE_MODE=boutique` switch, blog-like single-catalog feed, admin `/admin/boutique` (add/remove/reorder), `Product.inBoutique` + `boutiqueSortOrder`; wider site container (1600px) and more spacing — PR #21.
- Header brush height fixes — PR #16, #18.

## Next

- Fill the boutique with real items in the CMS (demo seed `prisma/seed-boutique.ts` is local-only).

## Decisions

- Boutique items are normal `Product` rows flagged `inBoutique` — cart, checkout, orders, stock work unchanged.
- Items created from the Boutique screen go to a hidden inactive category `boutique` (`categoryId` is required).
- No route-level `loading.tsx` on the storefront: pages appear fully rendered, redirects/404s are real HTTP codes. If navigation feels unresponsive, add a thin top progress bar, not a skeleton.
- Boutique images: image k goes after product round((k+1)·N/(M+1)) (`placeDecorations` in `boutique-feed.tsx`); size 700×900 recommended, not enforced.
- In boutique mode `/shop`, `/category/*`, `/search` redirect to `/`; non-boutique products 404.

## Traps

- `deploy.yml` uses `--set-env-vars`, which REPLACES all Cloud Run env vars on every deploy — env set by hand in Cloud Run is lost. Add new env vars to the workflow (as `SITE_MODE` is).
- Local DB: `boutique-db` container conflicts on :5432 with another project; a copy runs as `boutique-db-5433` on :5433 (override `DATABASE_URL` when starting dev). Local DB was made with `db push`, so use `prisma db push` there, not `migrate deploy`.
- After `globals.css` changes the Turbopack dev cache can serve stale CSS — `rm -rf .next` and restart.
