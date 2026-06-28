"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/lib/cart-store";
import { trackEvent } from "@/components/analytics/ga";
import { formatPrice } from "@/lib/money";
import { effectiveUnitPriceCents } from "@/lib/pricing";
import { pick } from "@/lib/content";
import type { CardProduct } from "@/lib/types";

const PLACEHOLDER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect width='100%25' height='100%25' fill='%23f1e8da'/></svg>";

export function ProductCard({
  product,
  locale,
}: {
  product: CardProduct;
  locale: string;
}) {
  const t = useTranslations("product");
  const router = useRouter();
  const addItem = useCart((s) => s.addItem);

  const title = pick(locale, product.titleBg, product.titleEn);
  const category = pick(locale, product.categoryNameBg, product.categoryNameEn);
  const original = product.priceCents;
  const effective = effectiveUnitPriceCents({
    priceCents: product.priceCents,
    salePercent: product.salePercent,
  });
  const onSale = product.salePercent != null && product.salePercent > 0;
  const soldOut = product.totalStock <= 0;
  const image = product.images[0]?.url ?? PLACEHOLDER;
  const hover = product.images[1]?.url;

  function handleBuy() {
    if (soldOut) return;
    if (product.hasVariants) {
      router.push(`/product/${product.slug}`);
      return;
    }
    addItem(
      {
        productId: product.id,
        variantId: null,
        slug: product.slug,
        title,
        image,
        unitPriceCents: effective,
        originalUnitPriceCents: original,
        maxStock: 99,
        size: null,
        color: null,
      },
      1,
    );
    trackEvent("add_to_cart", {
      currency: "EUR",
      value: effective / 100,
      items: [{ item_id: product.id, item_name: title, quantity: 1 }],
    });
  }

  return (
    <div className="group flex flex-col">
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-square overflow-hidden rounded-2xl bg-sand"
      >
        <Image
          src={image}
          alt={product.images[0]?.alt ?? title}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-opacity duration-300 group-hover:opacity-0"
          unoptimized={image.startsWith("data:")}
        />
        {hover && (
          <Image
            src={hover}
            alt={title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        )}

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {onSale && <Badge variant="sale">-{product.salePercent}%</Badge>}
          {product.isNew && !onSale && <Badge variant="new">{t("new")}</Badge>}
        </div>

        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-cream/60">
            <span className="rounded-full bg-ink px-4 py-1 text-xs font-semibold uppercase tracking-wide text-cream">
              {t("outOfStock")}
            </span>
          </div>
        )}
      </Link>

      <div className="mt-3 flex flex-1 flex-col">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {category}
        </span>
        <Link
          href={`/product/${product.slug}`}
          className="mt-0.5 line-clamp-2 text-sm font-medium hover:text-primary"
        >
          {title}
        </Link>
        <div className="mt-1 flex items-center gap-2">
          <span className="font-semibold">{formatPrice(effective, locale)}</span>
          {onSale && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(original, locale)}
            </span>
          )}
        </div>
        <button
          onClick={handleBuy}
          disabled={soldOut}
          className="mt-3 inline-flex h-10 items-center justify-center rounded-full bg-ink text-sm font-medium text-cream transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          {soldOut ? t("outOfStock") : t("addToCart")}
        </button>
      </div>
    </div>
  );
}
