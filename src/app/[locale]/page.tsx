import NextImage from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Hero, type HeroSlideView } from "@/components/storefront/hero";
import { CategoryTiles } from "@/components/storefront/category-tiles";
import { ProductGrid } from "@/components/storefront/product-grid";
import { SectionHeading } from "@/components/storefront/section-heading";
import {
  getNewestProducts,
  getTrendingProducts,
  getFeaturedProducts,
  getDiscountedProducts,
  getTopLevelCategories,
  toCards,
} from "@/lib/catalog";
import {
  getContentMap,
  getSiteImages,
  getHeroSlides,
} from "@/lib/site-settings";
import { contentValue } from "@/lib/site-design";
import { pick } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const [
    newest,
    trending,
    featured,
    discounted,
    categories,
    content,
    images,
    heroRows,
  ] = await Promise.all([
    getNewestProducts(8),
    getTrendingProducts(4),
    getFeaturedProducts(8),
    getDiscountedProducts(4),
    getTopLevelCategories(),
    getContentMap(),
    getSiteImages(),
    getHeroSlides(),
  ]);

  const heroImage = images["hero"]?.url ?? null;
  const collectionImage = images["collection"]?.url ?? null;

  let heroSlides: HeroSlideView[] = heroRows.map((s) => ({
    eyebrow: pick(locale, s.eyebrowBg, s.eyebrowEn) || null,
    headline: pick(locale, s.headlineBg, s.headlineEn) || t("site.name"),
    subtext: pick(locale, s.subtextBg, s.subtextEn) || null,
    imageUrl: s.imageUrl ?? heroImage,
    ctaLabel: pick(locale, s.ctaLabelBg, s.ctaLabelEn) || null,
    ctaHref: s.ctaHref || null,
  }));

  if (heroSlides.length === 0) {
    heroSlides = [
      {
        eyebrow: null,
        headline: t("site.name"),
        subtext: contentValue(content, "brand.tagline", locale),
        imageUrl: heroImage,
        ctaLabel: t("home.heroCtaShop"),
        ctaHref: "/shop",
      },
    ];
  }

  const c = (key: string) => contentValue(content, key, locale);

  return (
    <div className="pb-10">
      <Hero slides={heroSlides} />

      {/* Artist intro */}
      <section className="container-page mt-14">
        <div className="rounded-3xl border border-border bg-white p-8 text-center sm:p-12">
          <h2 className="heading-display text-2xl sm:text-3xl">
            {c("home.artistTitle")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            {c("home.artistText")}
          </p>
        </div>
      </section>

      <section className="container-page mt-16">
        <SectionHeading title={c("home.shopByCategoryTitle")} />
        <CategoryTiles
          locale={locale}
          categories={categories.map((cat) => ({
            slug: cat.slug,
            nameBg: cat.nameBg,
            nameEn: cat.nameEn,
            image: cat.image,
          }))}
        />
      </section>

      <section className="container-page mt-16">
        <SectionHeading
          title={c("home.newestTitle")}
          subtitle={c("home.newestSubtitle")}
          href="/shop"
          linkLabel={t("home.viewAll")}
        />
        <ProductGrid products={toCards(newest)} locale={locale} />
      </section>

      {/* Featured collection banner */}
      <section className="container-page mt-16">
        <div className="relative flex min-h-[22rem] items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--color-accent)] via-[var(--color-surface)] to-[var(--color-background)]">
          {collectionImage && (
            <NextImage
              src={collectionImage}
              alt={c("home.collectionTitle")}
              fill
              sizes="100vw"
              className="object-cover"
              unoptimized={collectionImage.startsWith("data:")}
            />
          )}
          <div className="absolute inset-0 bg-ink/25" />
          <div className="relative text-center text-white">
            <h2 className="heading-display text-3xl sm:text-5xl">
              {c("home.collectionTitle")}
            </h2>
            <div className="mt-6">
              <Link
                href="/shop"
                className={buttonVariants({ size: "lg" })}
              >
                {c("home.collectionCta")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="container-page mt-16">
          <SectionHeading title={c("home.featuredTitle")} />
          <ProductGrid products={toCards(featured)} locale={locale} />
        </section>
      )}

      {trending.length > 0 && (
        <section className="container-page mt-16">
          <SectionHeading
            title={c("home.trendingTitle")}
            subtitle={c("home.trendingSubtitle")}
          />
          <ProductGrid products={toCards(trending)} locale={locale} />
        </section>
      )}

      {discounted.length > 0 && (
        <section className="container-page mt-16">
          <SectionHeading title={c("home.discountedTitle")} />
          <ProductGrid products={toCards(discounted)} locale={locale} />
        </section>
      )}

      {/* Thank-you / gratitude section */}
      <section className="mt-20 bg-sand">
        <div className="container-page py-16 text-center">
          <h2 className="heading-display text-3xl sm:text-4xl">
            {c("home.thanksTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-muted-foreground">
            {c("home.thanksText")}
          </p>
        </div>
      </section>
    </div>
  );
}
