import "server-only";

/**
 * Storefront mode switch. Set SITE_MODE=boutique to show the single-catalog,
 * blog-like boutique storefront (only products flagged `inBoutique`). Any other
 * value — or unset — keeps the classic shop with categories, filters and search.
 * Read at request time, so changing it only needs a restart / new revision.
 */
export function isBoutiqueMode(): boolean {
  return process.env.SITE_MODE?.trim().toLowerCase() === "boutique";
}
