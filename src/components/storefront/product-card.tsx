"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/lib/cart-store";
import { trackEvent } from "@/components/analytics/ga";
import { formatPrice } from "@/lib/money";
import { effectiveUnitPriceCents } from "@/lib/pricing";
import { pick } from "@/lib/content";
import { cn } from "@/lib/utils";
import type { CardProduct } from "@/lib/types";

const PLACEHOLDER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect width='100%25' height='100%25' fill='%23f4efe9'/></svg>";

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
  const [liked, setLiked] = useState(false);

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

  function handleBuy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (soldOut) {
      router.push(`/product/${product.slug}`);
      return;
    }
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

  const ctaLabel = soldOut
    ? t("outOfStock")
    : product.hasVariants
      ? `+ ${t("selectOptions")}`
      : `+ ${t("addToCart")}`;

  return (
    <div className="group flex flex-col">
      <div className="relative aspect-square overflow-hidden rounded-md bg-sand">
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

        {/* Click-through link sits below the action controls */}
        <Link
          href={`/product/${product.slug}`}
          aria-label={title}
          className="absolute inset-0 z-[1]"
        />

        {/* Badges */}
        <div className="absolute left-3 top-3 z-[2] flex flex-col gap-1.5">
          {onSale && <Badge variant="sale">-{product.salePercent}%</Badge>}
          {product.isNew && !onSale && <Badge variant="new">{t("new")}</Badge>}
        </div>

        {/* Wishlist */}
        <button
          type="button"
          aria-label="Wishlist"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setLiked((v) => !v);
          }}
          className="absolute right-3 top-3 z-[2] text-ink/70 transition-colors hover:text-primary"
        >
          <Heart className={cn("h-5 w-5", liked && "fill-primary text-primary")} />
        </button>

        {soldOut && (
          <div className="absolute inset-0 z-[2] flex items-center justify-center">
            <span className="rounded-full bg-cream/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink">
              {t("outOfStock")}
            </span>
          </div>
        )}

        {/* Add-to-cart bar: visible on mobile, revealed on hover on desktop */}
        <button
          onClick={handleBuy}
          className="absolute inset-x-0 bottom-0 z-[2] flex h-11 items-center justify-center bg-ink text-xs font-semibold uppercase tracking-[0.12em] text-cream transition-all duration-300 hover:bg-primary md:translate-y-full md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100"
        >
          {ctaLabel}
        </button>
      </div>

      {/* Centered meta */}
      <div className="mt-3 flex flex-1 flex-col items-center text-center">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {category}
        </span>
        <Link
          href={`/product/${product.slug}`}
          className="mt-0.5 line-clamp-2 text-sm font-medium hover:text-primary"
        >
          {title}
        </Link>
        <div className="mt-1 flex items-center justify-center gap-2">
          <span className="font-semibold">{formatPrice(effective, locale)}</span>
          {onSale && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(original, locale)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
