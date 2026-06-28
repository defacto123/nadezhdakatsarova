import type { DiscountCode } from "@prisma/client";

/**
 * Effective unit price (euro cents) after applying a product-level sale.
 * Variant price override (if present) takes precedence over the base price.
 */
export function effectiveUnitPriceCents(input: {
  priceCents: number;
  salePercent?: number | null;
  variantPriceOverrideCents?: number | null;
}): number {
  const base = input.variantPriceOverrideCents ?? input.priceCents;
  if (input.salePercent && input.salePercent > 0) {
    return Math.round(base * (1 - input.salePercent / 100));
  }
  return base;
}

/** Original (pre-sale) unit price used for strikethrough display. */
export function originalUnitPriceCents(input: {
  priceCents: number;
  variantPriceOverrideCents?: number | null;
}): number {
  return input.variantPriceOverrideCents ?? input.priceCents;
}

export type DiscountValidationResult =
  | { ok: true; discountCents: number; code: DiscountCode }
  | { ok: false; reason: DiscountError };

export type DiscountError =
  | "NOT_FOUND"
  | "INACTIVE"
  | "EXPIRED"
  | "USAGE_LIMIT"
  | "MIN_ORDER";

/**
 * Validate a discount code against a subtotal and compute the discount amount.
 * `userUsageCount` is the number of times this user already used the code.
 */
export function applyDiscountCode(params: {
  code: DiscountCode | null;
  subtotalCents: number;
  now?: Date;
  userUsageCount?: number;
}): DiscountValidationResult {
  const { code, subtotalCents } = params;
  const now = params.now ?? new Date();

  if (!code) return { ok: false, reason: "NOT_FOUND" };
  if (!code.active) return { ok: false, reason: "INACTIVE" };
  if (code.expiresAt && code.expiresAt.getTime() < now.getTime()) {
    return { ok: false, reason: "EXPIRED" };
  }
  if (code.usageLimit != null && code.usedCount >= code.usageLimit) {
    return { ok: false, reason: "USAGE_LIMIT" };
  }
  if (
    code.perUserLimit != null &&
    (params.userUsageCount ?? 0) >= code.perUserLimit
  ) {
    return { ok: false, reason: "USAGE_LIMIT" };
  }
  if (code.minOrderCents != null && subtotalCents < code.minOrderCents) {
    return { ok: false, reason: "MIN_ORDER" };
  }

  let discountCents =
    code.type === "PERCENT"
      ? Math.round(subtotalCents * (code.value / 100))
      : code.value;

  // Never discount more than the subtotal.
  discountCents = Math.min(discountCents, subtotalCents);

  return { ok: true, discountCents, code };
}

/** Pick the applicable shipping price for a subtotal, honouring free-over thresholds. */
export function shippingForRate(
  rate: { priceCents: number; freeOverCents: number | null } | null,
  subtotalCents: number,
): number {
  if (!rate) return 0;
  if (rate.freeOverCents != null && subtotalCents >= rate.freeOverCents) {
    return 0;
  }
  return rate.priceCents;
}
