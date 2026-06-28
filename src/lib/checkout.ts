import { prisma } from "@/lib/prisma";
import {
  applyDiscountCode,
  effectiveUnitPriceCents,
  shippingForRate,
  type DiscountError,
} from "@/lib/pricing";

export interface CartLineInput {
  productId: string;
  variantId: string | null;
  quantity: number;
}

export interface PricedLine {
  productId: string;
  variantId: string | null;
  titleSnapshot: string;
  variantSnapshot: string | null;
  unitPriceCents: number;
  quantity: number;
}

export interface PricedOrder {
  lines: PricedLine[];
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  discountCodeId: string | null;
  discountError?: DiscountError;
  errors: string[];
}

/**
 * Recompute an order entirely from the database — never trust client prices.
 * Clamps quantities to available stock and validates discount + shipping.
 */
export async function priceOrder(params: {
  items: CartLineInput[];
  discountCode?: string | null;
  shippingRateId?: string | null;
  userId?: string | null;
}): Promise<PricedOrder> {
  const errors: string[] = [];
  const productIds = [...new Set(params.items.map((i) => i.productId))];

  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true },
    include: { variants: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines: PricedLine[] = [];
  let subtotalCents = 0;

  for (const item of params.items) {
    const product = byId.get(item.productId);
    if (!product) {
      errors.push(`Product ${item.productId} unavailable`);
      continue;
    }

    let variant = null;
    let available = 99;
    if (item.variantId) {
      variant = product.variants.find((v) => v.id === item.variantId) ?? null;
      if (!variant) {
        errors.push(`Variant unavailable for ${product.titleBg}`);
        continue;
      }
      available = variant.stock;
    } else if (product.variants.length > 0) {
      // Product requires a variant but none selected.
      available = product.variants.reduce((s, v) => s + v.stock, 0);
    }

    const quantity = Math.max(0, Math.min(item.quantity, available));
    if (quantity <= 0) {
      errors.push(`${product.titleBg} is out of stock`);
      continue;
    }

    const unitPriceCents = effectiveUnitPriceCents({
      priceCents: product.priceCents,
      salePercent: product.salePercent,
      variantPriceOverrideCents: variant?.priceOverrideCents ?? null,
    });

    subtotalCents += unitPriceCents * quantity;
    lines.push({
      productId: product.id,
      variantId: variant?.id ?? null,
      titleSnapshot: product.titleBg,
      variantSnapshot: variant
        ? [variant.size, variant.color].filter(Boolean).join(" · ") || null
        : null,
      unitPriceCents,
      quantity,
    });
  }

  // Discount
  let discountCents = 0;
  let discountCodeId: string | null = null;
  let discountError: DiscountError | undefined;
  if (params.discountCode) {
    const code = await prisma.discountCode.findUnique({
      where: { code: params.discountCode.trim().toUpperCase() },
    });
    let userUsageCount = 0;
    if (code && params.userId) {
      userUsageCount = await prisma.order.count({
        where: {
          userId: params.userId,
          discountCodeId: code.id,
          status: { in: ["PAID", "FULFILLED"] },
        },
      });
    }
    const result = applyDiscountCode({
      code,
      subtotalCents,
      userUsageCount,
    });
    if (result.ok) {
      discountCents = result.discountCents;
      discountCodeId = result.code.id;
    } else {
      discountError = result.reason;
    }
  }

  // Shipping
  let shippingCents = 0;
  if (params.shippingRateId) {
    const rate = await prisma.shippingRate.findUnique({
      where: { id: params.shippingRateId },
    });
    shippingCents = shippingForRate(rate, subtotalCents);
  }

  const totalCents = Math.max(
    0,
    subtotalCents - discountCents + shippingCents,
  );

  return {
    lines,
    subtotalCents,
    discountCents,
    shippingCents,
    totalCents,
    discountCodeId,
    discountError,
    errors,
  };
}

export async function getShippingOptions(country: string, subtotalCents: number) {
  const zones = await prisma.shippingZone.findMany({
    include: { rates: { orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });

  const upper = country.toUpperCase();
  // Prefer a zone that explicitly lists the country, else a catch-all ("*").
  const zone =
    zones.find((z) => z.countries.map((c) => c.toUpperCase()).includes(upper)) ??
    zones.find((z) => z.countries.includes("*"));

  if (!zone) return [];

  return zone.rates.map((r) => ({
    id: r.id,
    name: r.name,
    priceCents: shippingForRate(r, subtotalCents),
    baseCents: r.priceCents,
    freeOverCents: r.freeOverCents,
  }));
}
