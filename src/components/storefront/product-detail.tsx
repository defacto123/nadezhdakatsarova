"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-store";
import { trackEvent } from "@/components/analytics/ga";
import { formatPrice } from "@/lib/money";
import { effectiveUnitPriceCents } from "@/lib/pricing";
import { pick } from "@/lib/content";
import { cn, isRawImage } from "@/lib/utils";

export interface DetailVariant {
  id: string;
  size: string | null;
  color: string | null;
  stock: number;
  priceOverrideCents: number | null;
}

export interface DetailProduct {
  id: string;
  slug: string;
  titleBg: string;
  titleEn: string;
  descriptionBg: string | null;
  descriptionEn: string | null;
  priceCents: number;
  salePercent: number | null;
  images: { url: string; alt: string | null }[];
  variants: DetailVariant[];
}

const PLACEHOLDER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'><rect width='100%25' height='100%25' fill='%23f1e8da'/></svg>";

export function ProductDetail({
  product,
  locale,
}: {
  product: DetailProduct;
  locale: string;
}) {
  const t = useTranslations("product");
  const addItem = useCart((s) => s.addItem);

  const title = pick(locale, product.titleBg, product.titleEn);
  const description = pick(locale, product.descriptionBg, product.descriptionEn);

  const sizes = useMemo(
    () => [...new Set(product.variants.map((v) => v.size).filter(Boolean))] as string[],
    [product.variants],
  );
  const colors = useMemo(
    () => [...new Set(product.variants.map((v) => v.color).filter(Boolean))] as string[],
    [product.variants],
  );

  const [size, setSize] = useState<string | null>(sizes[0] ?? null);
  const [color, setColor] = useState<string | null>(colors[0] ?? null);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);

  const hasVariants = product.variants.length > 0;

  const selectedVariant = useMemo(() => {
    if (!hasVariants) return null;
    return (
      product.variants.find(
        (v) =>
          (sizes.length === 0 || v.size === size) &&
          (colors.length === 0 || v.color === color),
      ) ?? null
    );
  }, [product.variants, hasVariants, size, color, sizes.length, colors.length]);

  const stock = hasVariants ? (selectedVariant?.stock ?? 0) : 99;
  const soldOut = stock <= 0;
  const onSale = product.salePercent != null && product.salePercent > 0;

  const effective = effectiveUnitPriceCents({
    priceCents: product.priceCents,
    salePercent: product.salePercent,
    variantPriceOverrideCents: selectedVariant?.priceOverrideCents ?? null,
  });
  const original = selectedVariant?.priceOverrideCents ?? product.priceCents;
  const images = product.images.length
    ? product.images
    : [{ url: PLACEHOLDER, alt: title }];

  useEffect(() => {
    trackEvent("view_item", {
      currency: "EUR",
      value: effective / 100,
      items: [{ item_id: product.id, item_name: title }],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function add() {
    if (soldOut) return;
    addItem(
      {
        productId: product.id,
        variantId: selectedVariant?.id ?? null,
        slug: product.slug,
        title,
        image: images[0].url,
        unitPriceCents: effective,
        originalUnitPriceCents: original,
        maxStock: stock,
        size: selectedVariant?.size ?? null,
        color: selectedVariant?.color ?? null,
      },
      qty,
    );
    trackEvent("add_to_cart", {
      currency: "EUR",
      value: (effective * qty) / 100,
      items: [{ item_id: product.id, item_name: title, quantity: qty }],
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      {/* Gallery */}
      <div className="flex flex-col gap-4">
        <div className="relative aspect-square overflow-hidden rounded-3xl bg-sand">
          <Image
            src={images[activeImage].url}
            alt={images[activeImage].alt ?? title}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority
            unoptimized={isRawImage(images[activeImage].url)}
          />
          <div className="absolute left-4 top-4 flex flex-col gap-2">
            {onSale && <Badge variant="sale">-{product.salePercent}%</Badge>}
          </div>
        </div>
        {images.length > 1 && (
          <div className="flex gap-3">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={cn(
                  "relative h-20 w-20 overflow-hidden rounded-xl bg-sand ring-2 ring-transparent",
                  i === activeImage && "ring-primary",
                )}
              >
                <Image
                  src={img.url}
                  alt={img.alt ?? title}
                  fill
                  sizes="80px"
                  className="object-cover"
                  unoptimized={isRawImage(img.url)}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <h1 className="heading-display text-3xl sm:text-4xl">{title}</h1>
        <div className="mt-3 flex items-center gap-3">
          <span className="text-2xl font-semibold">
            {formatPrice(effective, locale)}
          </span>
          {onSale && (
            <span className="text-lg text-muted-foreground line-through">
              {formatPrice(original, locale)}
            </span>
          )}
        </div>

        <p className="mt-2 text-xs text-muted-foreground">{t("vatIncluded")}</p>

        {/* Stock */}
        <div className="mt-4">
          {soldOut ? (
            <Badge variant="danger">{t("outOfStock")}</Badge>
          ) : stock <= 5 && hasVariants ? (
            <Badge variant="warning">{t("lowStock", { count: stock })}</Badge>
          ) : (
            <Badge variant="success">{t("inStock")}</Badge>
          )}
        </div>

        {/* Size */}
        {sizes.length > 0 && (
          <div className="mt-6">
            <span className="text-sm font-medium">{t("size")}</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={cn(
                    "min-w-11 rounded-full border px-4 py-2 text-sm",
                    size === s
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Color */}
        {colors.length > 0 && (
          <div className="mt-5">
            <span className="text-sm font-medium">{t("color")}</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm",
                    color === c
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantity + add */}
        <div className="mt-7 flex items-center gap-4">
          <div className="flex items-center rounded-full border border-border">
            <button
              className="h-11 w-11 text-lg"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
            >
              −
            </button>
            <span className="w-10 text-center">{qty}</span>
            <button
              className="h-11 w-11 text-lg"
              onClick={() => setQty((q) => Math.min(stock, q + 1))}
            >
              +
            </button>
          </div>
          <Button size="lg" className="flex-1" onClick={add} disabled={soldOut}>
            {added ? "✓" : soldOut ? t("outOfStock") : t("addToCart")}
          </Button>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">{t("haveCode")}</p>

        {description && (
          <div className="mt-8 border-t border-border pt-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide">
              {t("description")}
            </h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
