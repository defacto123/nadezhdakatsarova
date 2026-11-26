import { Fragment } from "react";
import NextImage from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { pick } from "@/lib/content";
import { formatPrice } from "@/lib/money";
import { cn, isRawImage } from "@/lib/utils";
import { heroMotionClassName, heroMotionInlineStyle } from "@/lib/site-design";

export interface BoutiqueItem {
  id: string;
  slug: string;
  titleBg: string;
  titleEn: string;
  descriptionBg: string | null;
  descriptionEn: string | null;
  priceCents: number;
  salePercent: number | null;
  createdAt: Date;
  images: { url: string; alt: string | null }[];
  variants: { stock: number; priceOverrideCents: number | null }[];
}

export interface BoutiqueDecoration {
  id: string;
  url: string;
  altBg: string | null;
  altEn: string | null;
  animated: boolean;
  motion: string;
  speed: number;
  bgColor: string | null;
  position: string;
}

/**
 * Spread M decorations evenly through N products: decoration k goes after
 * product round((k + 1) * N / (M + 1)), clamped to 1..N (1-based). With no
 * products everything lands in a single row. Returns product index (0-based,
 * "after this product") -> decorations.
 */
function placeDecorations(
  productCount: number,
  decorations: BoutiqueDecoration[],
): Map<number, BoutiqueDecoration[]> {
  const slots = new Map<number, BoutiqueDecoration[]>();
  const m = decorations.length;
  decorations.forEach((d, k) => {
    const after =
      productCount === 0
        ? -1
        : Math.min(
            productCount,
            Math.max(1, Math.round(((k + 1) * productCount) / (m + 1))),
          ) - 1;
    slots.set(after, [...(slots.get(after) ?? []), d]);
  });
  return slots;
}

const JUSTIFY: Record<string, string> = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
};

function DecorationRow({
  decorations,
  locale,
}: {
  decorations: BoutiqueDecoration[];
  locale: string;
}) {
  const justify =
    decorations.length === 1
      ? (JUSTIFY[decorations[0].position] ?? JUSTIFY.center)
      : "justify-around";
  return (
    <div
      aria-hidden={decorations.every((d) => !pick(locale, d.altBg, d.altEn))}
      className={cn("flex flex-wrap items-center gap-10", justify)}
    >
      {decorations.map((d) => {
        const alt = pick(locale, d.altBg, d.altEn);
        return (
          <span
            key={d.id}
            className={cn(
              "inline-block rounded-[var(--radius)]",
              heroMotionClassName(d.animated, d.motion),
            )}
            style={{
              backgroundColor: d.bgColor ?? "transparent",
              ...heroMotionInlineStyle(d.animated, d.motion, d.speed),
            }}
          >
            <NextImage
              src={d.url}
              alt={alt}
              width={700}
              height={900}
              sizes="(min-width: 1024px) 300px, 220px"
              className="h-auto max-h-[380px] w-full max-w-[220px] object-contain lg:max-w-[300px]"
              unoptimized={isRawImage(d.url)}
            />
          </span>
        );
      })}
    </div>
  );
}

function excerpt(text: string, max = 260): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, clean.lastIndexOf(" ", max)) + "…";
}

function applySale(cents: number, salePercent: number | null) {
  return salePercent && salePercent > 0
    ? Math.round(cents * (1 - salePercent / 100))
    : cents;
}

/**
 * Boutique storefront: one curated catalog rendered as a blog-like feed of
 * large "posts", one per product. No categories, filters or search.
 */
export async function BoutiqueFeed({
  items,
  decorations = [],
  locale,
}: {
  items: BoutiqueItem[];
  decorations?: BoutiqueDecoration[];
  locale: string;
}) {
  const placed = placeDecorations(items.length, decorations);
  const t = await getTranslations("boutique");
  const dateFmt = new Intl.DateTimeFormat(locale === "bg" ? "bg-BG" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="pb-10">
      <header className="container-page pt-16 pb-8 text-center sm:pt-24 lg:pt-28">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
          {t("eyebrow")}
        </p>
        <h1 className="heading-display mt-3 text-4xl sm:text-5xl">{t("title")}</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">{t("subtitle")}</p>
      </header>

      {items.length === 0 ? (
        <>
          <p className="container-page py-20 text-center text-muted-foreground">
            {t("empty")}
          </p>
          {placed.has(-1) && (
            <div className="container-page">
              <DecorationRow decorations={placed.get(-1)!} locale={locale} />
            </div>
          )}
        </>
      ) : (
        <div className="container-page mt-12 flex flex-col gap-24 sm:gap-32 lg:gap-40">
          {items.map((p, idx) => {
            const title = pick(locale, p.titleBg, p.titleEn);
            const description = pick(locale, p.descriptionBg, p.descriptionEn);
            const cover = p.images[0];
            const second = p.images[1];
            const stock = p.variants.length
              ? p.variants.reduce((s, v) => s + v.stock, 0)
              : 1;
            const overrides = p.variants
              .map((v) => v.priceOverrideCents)
              .filter((c): c is number => c != null);
            const minBase = Math.min(p.priceCents, ...overrides);
            const hasRange = overrides.some((c) => c !== p.priceCents);
            const price = applySale(minBase, p.salePercent);
            const onSale = Boolean(p.salePercent && p.salePercent > 0);
            const href = `/product/${p.slug}`;
            const reversed = idx % 2 === 1;

            return (
              <Fragment key={p.id}>
                <article
                  className="grid items-center gap-10 lg:grid-cols-12 lg:gap-20 xl:gap-24"
                >
                  <Link
                    href={href}
                    className={cn(
                      "group relative block lg:col-span-7",
                      reversed && "lg:order-2",
                    )}
                  >
                    <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius)] bg-sand sm:aspect-[5/4]">
                      {cover && (
                        <NextImage
                          src={cover.url}
                          alt={cover.alt || title}
                          fill
                          sizes="(min-width: 1024px) 58vw, 100vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                          unoptimized={isRawImage(cover.url)}
                          priority={idx === 0}
                        />
                      )}
                      {stock <= 0 && (
                        <span className="absolute left-4 top-4 rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background">
                          {t("soldOut")}
                        </span>
                      )}
                    </div>
                    {second && (
                      <div
                        className={cn(
                          "absolute -bottom-8 hidden aspect-square w-40 overflow-hidden rounded-[var(--radius)] border-4 border-background shadow-xl xl:block",
                          reversed ? "-left-8" : "-right-8",
                        )}
                      >
                        <NextImage
                          src={second.url}
                          alt={second.alt || title}
                          fill
                          sizes="160px"
                          className="object-cover"
                          unoptimized={isRawImage(second.url)}
                        />
                      </div>
                    )}
                  </Link>

                  <div className={cn("max-w-xl lg:col-span-5", reversed && "lg:order-1")}>
                    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      <span className="heading-display text-base italic normal-case tracking-normal text-primary">
                        № {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span aria-hidden className="h-px w-8 bg-border" />
                      <time dateTime={p.createdAt.toISOString()}>
                        {dateFmt.format(p.createdAt)}
                      </time>
                    </div>
                    <h2 className="heading-display mt-4 text-3xl leading-tight sm:text-4xl">
                      <Link href={href} className="hover:text-primary">
                        {title}
                      </Link>
                    </h2>
                    {description && (
                      <p className="mt-5 leading-relaxed text-muted-foreground">
                        {excerpt(description)}
                      </p>
                    )}
                    <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
                      <span className="text-lg font-semibold">
                        {hasRange && (
                          <span className="mr-1 text-sm font-normal text-muted-foreground">
                            {t("fromPrice")}
                          </span>
                        )}
                        {formatPrice(price, locale)}
                        {onSale && (
                          <span className="ml-2 text-sm font-normal text-muted-foreground line-through">
                            {formatPrice(minBase, locale)}
                          </span>
                        )}
                      </span>
                      <Link
                        href={href}
                        className="inline-flex items-center gap-2 border-b border-foreground pb-0.5 text-sm font-medium hover:border-primary hover:text-primary"
                      >
                        {t("view")} <span aria-hidden>→</span>
                      </Link>
                    </div>
                  </div>
                </article>
                {placed.has(idx) && (
                  <DecorationRow decorations={placed.get(idx)!} locale={locale} />
                )}
              </Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
