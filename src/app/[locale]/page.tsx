import NextImage from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HeroCarousel, type HeroSlideView } from "@/components/storefront/hero-carousel";
import { ProductCard } from "@/components/storefront/product-card";
import { SectionHeading } from "@/components/storefront/section-heading";
import {
  getNewestProducts,
  getFeaturedProducts,
  getDiscountedProducts,
  toCards,
} from "@/lib/catalog";
import {
  getContentMap,
  getSiteImages,
  getHeroSlides,
} from "@/lib/site-settings";
import { contentValue } from "@/lib/site-design";
import { pick } from "@/lib/content";
import { cn, isRawImage } from "@/lib/utils";
import type { CardProduct } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const [newest, featured, discounted, content, images, heroRows] =
    await Promise.all([
      getNewestProducts(6),
      getFeaturedProducts(6),
      getDiscountedProducts(6),
      getContentMap(),
      getSiteImages(),
      getHeroSlides(),
    ]);

  const c = (key: string) => contentValue(content, key, locale);
  const img = (slot: string) => images[slot]?.url ?? null;
  const alt = (slot: string) =>
    (locale === "en" ? images[slot]?.altEn : images[slot]?.altBg) ?? "";

  let heroSlides: HeroSlideView[] = heroRows.map((s) => ({
    eyebrow: pick(locale, s.eyebrowBg, s.eyebrowEn) || null,
    headline: pick(locale, s.headlineBg, s.headlineEn) || null,
    subtext: pick(locale, s.subtextBg, s.subtextEn) || null,
    imageUrl: s.imageUrl ?? img("home-hero-art"),
    ctaLabel: pick(locale, s.ctaLabelBg, s.ctaLabelEn) || null,
    ctaHref: s.ctaHref || null,
  }));

  if (heroSlides.length === 0) {
    heroSlides = [
      {
        eyebrow: null,
        headline: t("site.name"),
        subtext: c("brand.tagline"),
        imageUrl: img("home-hero-art"),
        ctaLabel: t("home.heroCtaShop"),
        ctaHref: "/shop",
      },
    ];
  }

  return (
    <div className="pb-10">
      <HeroCarousel slides={heroSlides} />

      <SideProductSection
        title={c("home.newestTitle")}
        subtitle={c("home.newestSubtitle")}
        sideUrl={img("home-side-1")}
        sideAlt={alt("home-side-1")}
        sidePosition="left"
        products={toCards(newest)}
        locale={locale}
        viewAllHref="/shop"
        viewAllLabel={t("home.viewAll")}
      />

      {featured.length > 0 && (
        <SideProductSection
          title={c("home.featuredTitle")}
          sideUrl={img("home-side-2")}
          sideAlt={alt("home-side-2")}
          sidePosition="right"
          products={toCards(featured)}
          locale={locale}
        />
      )}

      {discounted.length > 0 && (
        <SideProductSection
          title={c("home.discountedTitle")}
          sideUrl={img("home-side-3")}
          sideAlt={alt("home-side-3")}
          sidePosition="left"
          products={toCards(discounted)}
          locale={locale}
        />
      )}
    </div>
  );
}

function SideProductSection({
  title,
  subtitle,
  sideUrl,
  sideAlt,
  sidePosition,
  products,
  locale,
  viewAllHref,
  viewAllLabel,
}: {
  title: string;
  subtitle?: string;
  sideUrl: string | null;
  sideAlt: string;
  sidePosition: "left" | "right";
  products: CardProduct[];
  locale: string;
  viewAllHref?: string;
  viewAllLabel?: string;
}) {
  if (products.length === 0) return null;

  const side = sideUrl ? (
    <div className="relative hidden min-h-[20rem] items-center justify-center lg:flex">
      <NextImage
        src={sideUrl}
        alt={sideAlt}
        aria-hidden={sideAlt ? undefined : true}
        width={300}
        height={400}
        className="h-auto w-full max-w-[300px] object-contain"
        unoptimized={isRawImage(sideUrl)}
      />
    </div>
  ) : null;

  const grid = (
    <div className="grid grid-cols-2 gap-x-5 gap-y-9 lg:grid-cols-3">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} locale={locale} />
      ))}
    </div>
  );

  return (
    <section className="container-page mt-20">
      <SectionHeading
        title={title}
        subtitle={subtitle}
        href={viewAllHref}
        linkLabel={viewAllLabel}
      />
      <div
        className={cn(
          "grid items-center gap-8 lg:gap-12",
          sideUrl &&
            (sidePosition === "left"
              ? "lg:grid-cols-[280px_minmax(0,1fr)]"
              : "lg:grid-cols-[minmax(0,1fr)_280px]"),
        )}
      >
        {sideUrl && sidePosition === "left" && side}
        {grid}
        {sideUrl && sidePosition === "right" && side}
      </div>
    </section>
  );
}
